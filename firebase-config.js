// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";

// Thay bằng config thật của bạn
const firebaseConfig = {
    apiKey: "AIzaSyCzDFy5cs3G8L_Ocf7bZ9MVvqa-HGdULIU",
    authDomain: "smartlockkey-f85ab.firebaseapp.com",
    databaseURL: "https://smartlockkey-f85ab-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smartlockkey-f85ab",
    storageBucket: "smartlockkey-f85ab.firebasestorage.app",
    messagingSenderId: "697827337425",
    appId: "1:697827337425:web:5f12ebbdfa6f5c138791f0",
    measurementId: "G-43QNXML1D7"
  };

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app };

