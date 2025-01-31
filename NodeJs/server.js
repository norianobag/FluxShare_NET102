const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const port = 3000;

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDJDE3Vc2oiDEjDtXC4Huxe978u4BhIV9A",
  authDomain: "fluxshare-6c913.firebaseapp.com",
  projectId: "fluxshare-6c913",
  storageBucket: "fluxshare-6c913.firebasestorage.app",
  messagingSenderId: "166373095063",
  appId: "1:166373095063:web:c9a2aa0f3e81256eb6dbd2",
  measurementId: "G-H4G2PKQFNJ"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

cloudinary.config({
    cloud_name: 'dn13shmgu',
    api_key: '494688159962851',
    api_secret: '9rW4iNtXpCjOxI_7IPixbPSOGnU',
});

// Enable CORS for all origins
app.use(cors());

// Multer Configuration for File Handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint for File Upload
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        const file = req.file;
        const userId = req.body.user_id;
        const parentId = req.body.parent_id;

        console.log('File received:', file); // Log the file object
        console.log('User ID:', userId);
        console.log('Parent ID:', parentId);

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Extract the file extension
        const fileExtension = file.originalname.split('.').pop();
        const publicId = `${uuidv4()}.${fileExtension}`;

        console.log('File buffer:', file.buffer); // Log the file buffer (raw file data)
        console.log('Public ID:', publicId); // Log the generated public ID

        // Upload file to Cloudinary directly from the buffer
        cloudinary.uploader.upload_stream(
            { resource_type: 'auto', public_id: publicId },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary error:', error.message);
                    return res.status(500).json({ message: 'Error uploading to Cloudinary.', error: error.message });
                }

                console.log('Cloudinary upload result:', result);

                // Prepare metadata to save to Firestore
                const metadata = {
                    name: file.originalname,
                    public_id: result.public_id,
                    url: result.secure_url,
                    parent_id: parentId === "0" ? null : parentId,
                    user_id: userId,
                    uploaded_at: new Date(),
                };

                console.log('Metadata to save:', metadata); // Log the metadata to be stored in Firestore

                try {
                    const filesRef = collection(db, 'files');
                    await addDoc(filesRef, metadata); // Save metadata to Firestore
                    console.log('Metadata stored in Firestore:', metadata); // Log successful metadata storage
                    res.status(200).json({
                        message: 'File uploaded and metadata stored.',
                        fileUrl: result.secure_url,
                    });
                } catch (dbError) {
                    console.error('Firestore error:', dbError.message);
                    res.status(500).json({
                        message: 'Error saving metadata to Firestore.',
                        error: dbError.message, // Include detailed Firestore error
                    });
                }
            }
        ).end(file.buffer); // Pass the file buffer to Cloudinary
    } catch (error) {
        console.error('Error during upload:', error.message); // Log any server-side errors
        res.status(500).json({ message: 'Error during upload.', error: error.message }); // Send JSON error
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});