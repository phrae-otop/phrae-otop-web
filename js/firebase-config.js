// Firebase Compat Mode for local file execution
// Note: We expect the firebase-app-compat.js, firestore-compat.js, auth-compat.js to be loaded in HTML

const firebaseConfig = {
    apiKey: "AIzaSyB5KeEuk4JS7QnDY93UGFZ9I4_jD7RUGd8",
    authDomain: "otop-phrae.firebaseapp.com",
    projectId: "otop-phrae",
    storageBucket: "otop-phrae.firebasestorage.app",
    messagingSenderId: "446778740823",
    appId: "1:446778740823:web:ebe1584ada28150d715312",
    measurementId: "G-5C5TW6GY3E"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);

    // Initialize services
    const db = firebase.firestore();
    const auth = firebase.auth();
    const analytics = typeof firebase.analytics === 'function' ? firebase.analytics() : null;

    // Make globally available
    window.db = db;
    window.auth = auth;

    console.log("Firebase (Compat) Initialized Successfully");
} else {
    console.error("Firebase SDK not found. key sure script tags are included in HTML.");
}
