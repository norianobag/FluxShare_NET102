import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                alert("Please fill in both email and password.");
                return;
            }

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log('Login successful');
                    localStorage.setItem('currentUserEmail', email);

                    // Redirect to home page
                    setTimeout(() => window.location.href = "HTML/home.html", 500);
                })
                .catch((error) => {
                    const loginStatus = document.getElementById('loginStatus');
                    if (loginStatus) {
                        loginStatus.textContent = 'Login failed. Please check your Email and Password or Sign Up.';
                    }
                    console.error('Error during login:', error);
                });
        });
    }
});