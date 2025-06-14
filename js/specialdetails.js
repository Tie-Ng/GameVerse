// ===== IMPORT FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ===== CONFIG FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyBRT5VFIn2NGVzNn15mu_YeQNiz8vEmiL0",
  authDomain: "game-verse-c777c.firebaseapp.com",
  projectId: "game-verse-c777c",
  storageBucket: "game-verse-c777c.appspot.com",
  messagingSenderId: "413081788819",
  appId: "1:413081788819:web:e9d1ee9d2be5eb37230866",
  measurementId: "G-DF5HFT1R49"
};

// ===== INITIALIZE FIREBASE =====
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUserEmail = null;

// ===== THEO DÕI TRẠNG THÁI ĐĂNG NHẬP =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;
    document.getElementById("userName").textContent = `Welcome, ${user.email}`;
    document.getElementById("userSection").classList.remove("hidden");
    document.getElementById("loginBtn").classList.add("hidden");
  } else {
    currentUserEmail = null;
    document.getElementById("userSection").classList.add("hidden");
    document.getElementById("loginBtn").classList.remove("hidden");
  }
});

// ===== FUNCTION LOGOUT (TÙY CHỌN) =====
window.logout = function () {
  signOut(auth).then(() => {
    location.reload();
  });
};

// ===== LẤY GAME ID TỪ URL =====
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get("id");

// ===== LOAD GAME DETAILS =====
async function loadGameDetails() {
  const container = document.getElementById("gameDetails");

  if (!gameId) {
    container.innerHTML = "<p class='text-red-400'>Game ID not provided in URL.</p>";
    return;
  }

  try {
    const docRef = doc(db, "specialGames", gameId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const game = docSnap.data();
      container.classList.remove("flex", "items-center", "justify-center");

      container.innerHTML = `
        <img src="${game.image}" alt="${game.title}" class="w-full max-w-full h-64 object-cover rounded mb-4" />
        <h1 class="text-3xl font-bold mb-2">${game.title}</h1>
        <p class="text-lg text-gray-400 mb-1"><strong>Platform:</strong> ${game.platform}</p>
        <p class="text-lg text-gray-400 mb-1"><strong>Genre:</strong> ${game.genre}</p>
        <p class="mt-4 whitespace-pre-wrap">${game.description || 'No description available.'}</p>
        <p class="text-sm text-gray-500 mt-4">Game ID: ${gameId}</p>
      `;
    } else {
      container.innerHTML = "<p class='text-yellow-400'>Game not found.</p>";
    }
  } catch (error) {
    console.error("Error loading game details:", error);
    container.innerHTML = `
      <p class='text-red-400'>Error loading game details. Check console for details.</p>
      <p class='text-red-400'>${error.message}</p>
    `;
  }
}

loadGameDetails();
