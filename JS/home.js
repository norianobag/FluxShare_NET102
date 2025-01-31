import { auth, db } from './firebase.js';
import { doc, setDoc, collection, addDoc, getDocs, getDoc, writeBatch, serverTimestamp, query, where, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

let currentUserUid = null; // Global variable to store the user's UID

// Listen for authentication state changes
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        console.log("User is authenticated, UID:", currentUserUid);
        loadFolders(); // Load folders once the user is authenticated
    } else {
        currentUserUid = null;
        console.error("User is not authenticated.");
        // Optionally, redirect to login page if required
    }
});

// Function to create a folder
async function createFolder() {
    const folderName = document.getElementById('folderName').value.trim();
    const parentId = document.getElementById('currentParentId').value;
    const messageElement = document.getElementById('message');

    if (!currentUserUid) {
        console.error("User is not authenticated. Cannot create folder.");
        if (messageElement) messageElement.textContent = "Please log in to create folders.";
        return;
    }

    if (!folderName) {
        if (messageElement) messageElement.textContent = "Folder name cannot be empty.";
        return;
    }

    try {
        const folderRef = collection(db, "folders");
        await addDoc(folderRef, {
            name: folderName,
            parent_id: parentId === "0" ? null : parentId,
            user_id: currentUserUid,
            created_at: serverTimestamp(),
        });

        console.log("Folder created successfully!");
        if (messageElement) {
            messageElement.style.color = "green";
            messageElement.textContent = "Folder created successfully!";
        }

        // Clear the folder name input
        document.getElementById('folderName').value = "";

        // Refresh folder view
        loadFolders(parentId);
    } catch (error) {
        console.error("Error creating folder:", error);
        if (messageElement) {
            messageElement.style.color = "red";
            messageElement.textContent = "Error creating folder. Please try again.";
        }
    }
}

// Function to load folders and files
function loadFolders(parentId = "0") {
    if (!currentUserUid) {
        console.error("User is not authenticated. Cannot load folders and files.");
        return;
    }

    console.log("Loading folders and files for parentId:", parentId);
    const foldersElement = document.getElementById('folders');
    const filesElement = document.getElementById('files'); // New element for files
    foldersElement.innerHTML = ""; // Clear current folder view
    filesElement.innerHTML = ""; // Clear current file view

    const effectiveParentId = parentId === "0" ? null : parentId;

    // Load folders
    const foldersRef = collection(db, "folders");
    const folderQuery = query(
        foldersRef,
        where("parent_id", "==", effectiveParentId),
        where("user_id", "==", currentUserUid)
    );

    const unsubscribeFolders = onSnapshot(folderQuery, (querySnapshot) => {
        if (querySnapshot.metadata.hasPendingWrites) {
            console.log("Waiting for Firestore sync...");
            return;
        }

        const folderItems = [];
        querySnapshot.forEach((doc) => {
            const folder = doc.data();
            folderItems.push(`
                <div class="folder-item">
                    <img src="../folder.png" class="folder-icon">
                    <span class="folder-text">${folder.name}</span>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                </div>
            `);
        });

        foldersElement.innerHTML = folderItems.join("");

        const folderDivs = foldersElement.querySelectorAll(".folder-item");
        folderDivs.forEach((folderDiv, index) => {
            const deleteButton = folderDiv.querySelector(".delete-btn");
            const folderId = querySnapshot.docs[index].id;

            folderDiv.addEventListener("click", () => openFolder(folderId));
            deleteButton.addEventListener("click", async (e) => {
                e.stopPropagation();
                try {
                    await deleteFolder(folderId);
                } catch (error) {
                    console.error("Error deleting folder:", error);
                }
            });
        });
    });

    // Load files
    const filesRef = collection(db, "files");
    const fileQuery = query(
        filesRef,
        where("parent_id", "==", effectiveParentId),
        where("user_id", "==", currentUserUid)
    );

    const unsubscribeFiles = onSnapshot(fileQuery, (querySnapshot) => {
        if (querySnapshot.metadata.hasPendingWrites) {
            console.log("Waiting for Firestore sync...");
            return;
        }

        const fileItems = [];
        querySnapshot.forEach((doc) => {
            const file = doc.data();
            fileItems.push(`
                <div class="file-item">
                    <img src="../file.png" class="file-icon" alt="File Icon">
                    <a href="${file.url}" target="_blank" class="file-link">${file.name}</a>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                </div>
            `);
        });

        filesElement.innerHTML = fileItems.join("");

        const deleteButtons = filesElement.querySelectorAll(".delete-btn");
        deleteButtons.forEach((button, index) => {
            const fileId = querySnapshot.docs[index].id;

            button.addEventListener("click", async (e) => {
                e.stopPropagation();
                try {
                    await deleteFile(fileId);
                } catch (error) {
                    console.error("Error deleting file:", error);
                }
            });
        });
    });

    return { unsubscribeFolders, unsubscribeFiles };
}

// Attach event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listener to the "Create Folder" button
    const createFolderButton = document.querySelector(".action-btn");
    if (createFolderButton) {
        createFolderButton.addEventListener("click", createFolder);
    } else {
        console.error("Create Folder button not found!");
    }

    // Add the event listener for the logout button
    const logoutButton = document.querySelector(".logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("User logged out successfully!");
                window.location.href = '../index.html'; // Redirect to login page
            } catch (error) {
                console.error("Error logging out:", error);
            }
        });
    }
});

const fileInput = document.getElementById('fileUpload');

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    // Get the current user UID and parent ID
    const currentUserUid = auth.currentUser ? auth.currentUser.uid : null;
    const parentId = document.getElementById('currentParentId').value;

    if (!currentUserUid) {
        console.error("User is not authenticated. Cannot upload file.");
        return;
    }

    formData.append('user_id', currentUserUid);
    formData.append('parent_id', parentId);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            alert(`File uploaded successfully: ${result.fileUrl}`);
        } else {
            console.error('Upload failed:', result.message);
            alert('File upload failed.');
        }
    } catch (error) {
        console.error('Error during upload:', error);
        alert('An error occurred during upload.');
    }
});

// open folder function
function openFolder(folderId) {
    console.log(`Opening folder with ID: ${folderId}`);
    // Update the current parent ID to the selected folder's ID
    const currentParentIdElement = document.getElementById('currentParentId');
    if (currentParentIdElement) {
        currentParentIdElement.value = folderId;
    }

    // Reload the folders and files for the selected folder
    loadFolders(folderId);
}

// delete folder function
async function deleteFolder(folderId) {
    if (!folderId) {
        console.error("Folder ID is required to delete a folder.");
        return;
    }

    try {
        // Reference the folder document in Firestore
        const folderRef = doc(db, "folders", folderId);

        // Delete the folder
        await deleteDoc(folderRef);
        console.log(`Folder with ID ${folderId} deleted successfully!`);

        // Reload the folder view to reflect changes
        const currentParentId = document.getElementById('currentParentId').value;
        loadFolders(currentParentId);
    } catch (error) {
        console.error("Error deleting folder:", error);
        alert("An error occurred while deleting the folder. Please try again.");
    }
}

// Add event listener for the logout button
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector(".logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("User logged out successfully!");
                window.location.href = '../index.html'; // Redirect to login page
            } catch (error) {
                console.error("Error logging out:", error);
            }
        });
    }
});

// delete file function
async function deleteFile(fileId) {
    if (!fileId) {
        console.error("File ID is required to delete a file.");
        return;
    }

    try {
        // Reference the file document in Firestore
        const fileRef = doc(db, "files", fileId);

        // Delete the file document
        await deleteDoc(fileRef);
        console.log(`File with ID ${fileId} deleted successfully!`);

        // Reload the files view to reflect changes
        const currentParentId = document.getElementById('currentParentId').value;
        loadFolders(currentParentId);
    } catch (error) {
        console.error("Error deleting file:", error);
        alert("An error occurred while deleting the file. Please try again.");
    }
}

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
    const currentParentIdElement = document.getElementById("currentParentId");
    const currentParentId = currentParentIdElement.value;

    if (currentParentId === "0") {
        // Already at the root folder
        console.log("You are already at the root folder.");
        return;
    }

    // Fetch the parent folder's parent ID from Firestore
    const folderRef = doc(db, "folders", currentParentId);

    getDoc(folderRef)
        .then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const parentId = docSnapshot.data().parent_id || "0"; // Set to root if no parent ID
                currentParentIdElement.value = parentId;
                loadFolders(parentId); // Load the parent folder
            } else {
                console.error("Current folder does not exist in Firestore.");
            }
        })
        .catch((error) => {
            console.error("Error navigating back:", error);
        });
});