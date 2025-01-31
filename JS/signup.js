import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

document.getElementById('registerBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageElement = document.getElementById('message'); // Ensure this exists in your HTML

    // Clear previous messages
    if (messageElement) messageElement.textContent = "";

    // Validate input
    if (password !== confirmPassword) {
        if (messageElement) messageElement.textContent = "Passwords do not match.";
        return;
    }

    if (password.length < 6) {
        if (messageElement) messageElement.textContent = "Password should be at least 6 characters long.";
        return;
    }

    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            uid: user.uid
        });

        if (messageElement) {
            messageElement.style.color = "green";
            messageElement.textContent = "Sign-up successful! Redirecting...";
        }

        // Redirect to login page
        setTimeout(() => window.location.href = "index.html", 1500);
    } catch (error) {
        if (messageElement) messageElement.textContent = error.message;
        console.error("Error during sign-up:", error);
    }
});