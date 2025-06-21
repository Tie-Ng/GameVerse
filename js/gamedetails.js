// ==== Firebase Setup ====
const firebaseConfig = {
  apiKey: "AIzaSyBRT5VFIn2NGVzNn15mu_YeQNiz8vEmiL0",
  authDomain: "game-verse-c777c.firebaseapp.com",
  projectId: "game-verse-c777c",
  storageBucket: "game-verse-c777c.appspot.com",
  messagingSenderId: "413081788819",
  appId: "1:413081788819:web:e9d1ee9d2be5eb37230866",
  measurementId: "G-DF5HFT1R49"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs,
  doc, updateDoc, deleteDoc, serverTimestamp, query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserEmail = null;
let currentGame = null;

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

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "index.html");
});

document.getElementById("backBtn").addEventListener("click", () => {
  window.history.back();
});

// ==== Game Details ====
const gameId = new URLSearchParams(window.location.search).get('id');
const API_KEY = 'd81ce92c1bcd4d74bba38ee005e26d8c';

if (gameId) fetchGameDetails(gameId);
else document.getElementById("gameDetails").innerHTML = `<p class="text-red-400">No game ID provided.</p>`;

async function fetchGameDetails(id) {
  try {
    const res = await fetch(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);
    if (!res.ok) throw new Error("API error");
    const game = await res.json();
    currentGame = game;

    document.getElementById("gameDetails").innerHTML = `
      <div class="flex flex-col md:flex-row gap-8">
        <div class="w-full md:w-1/2">
          <img src="${game.background_image || 'https://via.placeholder.com/600'}" alt="${game.name}" class="rounded-xl shadow-lg w-full max-h-[500px] object-cover mb-4" />
          <div class="bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg text-indigo-300 font-semibold mb-2">PC Requirements</h3>
            <ul class="text-sm list-disc list-inside text-gray-300 space-y-1">
              <li><strong>Minimum:</strong> ${getRequirementText(game.platforms, 'minimum')}</li>
              <li><strong>Recommended:</strong> ${getRequirementText(game.platforms, 'recommended')}</li>
            </ul>
          </div>
        </div>
        <div class="w-full md:w-1/2">
          <div class="bg-gray-700 p-6 rounded-lg space-y-4">
            <h2 class="text-4xl font-bold text-indigo-400">${game.name}</h2>
            <div class="flex items-center gap-1 text-lg">${getStarRating(game.rating)}</div>
            <p><span class="font-semibold text-gray-400">Release Date:</span> ${game.released}</p>
            <p><span class="font-semibold text-gray-400">Developer:</span> ${game.developers?.map(d => d.name).join(', ') || 'Unknown'}</p>
            <p><span class="font-semibold text-gray-400">Genres:</span> ${game.genres.map(g => g.name).join(', ')}</p>
            <p><span class="font-semibold text-gray-400">Platforms:</span> ${game.platforms.map(p => p.platform.name).join(', ')}</p>
            <div class="text-gray-300 text-justify leading-relaxed">${game.description_raw || 'No description available.'}</div>
            ${game.website ? `<a href="${game.website}" target="_blank" class="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-full transition">Visit Game Website</a>` : ''}
          </div>
        </div>
      </div>
    `;
    loadComments();
  } catch (err) {
    console.error(err);
    document.getElementById("gameDetails").innerHTML = `<p class="text-red-400">Failed to load game details.</p>`;
  }
}

// ==== Wishlist ====
document.getElementById("addToWishlistBtn").addEventListener("click", () => {
  if (!currentUserEmail) return showToast("You must be logged in to add to wishlist.");
  if (!currentGame) return showToast("Game not loaded yet.");

  const key = `wishlist_${currentUserEmail}`;
  const wishlist = JSON.parse(localStorage.getItem(key)) || [];

  if (!wishlist.some(item => item.id === currentGame.id)) {
    wishlist.push({
      id: currentGame.id,
      name: currentGame.name,
      background_image: currentGame.background_image,
      released: currentGame.released,
      description_raw: currentGame.description_raw,
      rating: currentGame.rating
    });
    localStorage.setItem(key, JSON.stringify(wishlist));
    showToast(`${currentGame.name} has been added to your wishlist!`);
  } else {
    showToast(`${currentGame.name} is already in your wishlist.`);
  }
});

// ==== Comment System ====
const commentInput = document.getElementById("commentInput");
const submitCommentBtn = document.getElementById("submitCommentBtn");
const commentsList = document.getElementById("commentsList");
const sortSelect = document.getElementById("sortSelect");

submitCommentBtn.addEventListener("click", async () => {
  if (!currentUserEmail || !commentInput.value.trim()) return;
  await addDoc(collection(db, "comments"), {
    gameId,
    user: currentUserEmail,
    text: commentInput.value.trim(),
    likes: 0,
    timestamp: serverTimestamp()
  });
  commentInput.value = "";
  loadComments();
});

sortSelect.addEventListener("change", loadComments);
async function loadComments() {
  const snapshot = await getDocs(query(collection(db, "comments")));
  let comments = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.gameId === gameId) {
      comments.push({ id: docSnap.id, ...data });
    }
  });

  const likedKey = `liked_comments_${currentUserEmail}`;
  const likedList = JSON.parse(localStorage.getItem(likedKey)) || [];

  if (sortSelect.value === "latest") comments.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
  else if (sortSelect.value === "like") comments.sort((a, b) => b.likes - a.likes);

  commentsList.innerHTML = comments.map(c => {
    const isOwner = c.user === currentUserEmail;
    const isLiked = likedList.includes(c.id);
    return `
      <div class="bg-gray-700 p-4 rounded-lg" data-id="${c.id}">
        <p class="text-sm text-gray-400">${c.user}</p>
        <p class="text-white mt-1 comment-text">${c.text}</p>
        <textarea class="w-full mt-2 p-2 bg-gray-800 rounded hidden edit-textarea">${c.text}</textarea>
        <div class="flex justify-between items-center mt-2">
          <span class="text-sm text-gray-400">${new Date(c.timestamp?.seconds * 1000).toLocaleString()}</span>
          <div class="text-sm text-gray-300 flex gap-2 items-center">
            <button class="like-btn transition transform active:scale-110 duration-200 ${isLiked ? 'text-pink-500' : 'text-white'}" data-id="${c.id}">
              ${isLiked ? '❤️' : '🤍'} ${c.likes}
            </button>
            ${isOwner ? `
              <button class="text-blue-400 hover:underline edit-btn">Edit</button>
              <button class="text-red-400 hover:underline delete-btn">Delete</button>
              <button class="text-green-400 hover:underline save-btn hidden">Save</button>
              <button class="text-yellow-400 hover:underline cancel-btn hidden">Cancel</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Like / Unlike
  commentsList.querySelectorAll(".like-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const commentId = e.target.getAttribute("data-id");
      if (!currentUserEmail) return showToast("You must be logged in to like comments.");

      const likedKey = `liked_comments_${currentUserEmail}`;
      let likedList = JSON.parse(localStorage.getItem(likedKey)) || [];

      const commentRef = doc(db, "comments", commentId);
      const snap = await getDocs(collection(db, "comments"));
      let currentLikes = 0;
      snap.forEach(d => {
        if (d.id === commentId) currentLikes = d.data().likes || 0;
      });

      const alreadyLiked = likedList.includes(commentId);

      // Chống spam click
      if (btn.disabled) return;
      btn.disabled = true;
      setTimeout(() => btn.disabled = false, 1000);

      if (alreadyLiked) {
        await updateDoc(commentRef, { likes: Math.max(0, currentLikes - 1) });
        likedList = likedList.filter(id => id !== commentId);
      } else {
        await updateDoc(commentRef, { likes: currentLikes + 1 });
        likedList.push(commentId);
      }

      localStorage.setItem(likedKey, JSON.stringify(likedList));
      loadComments();
    });
  });

  // Edit
  commentsList.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const parent = e.target.closest("[data-id]");
      parent.querySelector(".comment-text").classList.add("hidden");
      parent.querySelector(".edit-textarea").classList.remove("hidden");
      parent.querySelector(".edit-btn").classList.add("hidden");
      parent.querySelector(".delete-btn").classList.add("hidden");
      parent.querySelector(".save-btn").classList.remove("hidden");
      parent.querySelector(".cancel-btn").classList.remove("hidden");
    });
  });

  // Cancel edit
  commentsList.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const parent = e.target.closest("[data-id]");
      parent.querySelector(".comment-text").classList.remove("hidden");
      parent.querySelector(".edit-textarea").classList.add("hidden");
      parent.querySelector(".edit-btn").classList.remove("hidden");
      parent.querySelector(".delete-btn").classList.remove("hidden");
      parent.querySelector(".save-btn").classList.add("hidden");
      parent.querySelector(".cancel-btn").classList.add("hidden");
    });
  });

  // Save edited comment
  commentsList.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const parent = e.target.closest("[data-id]");
      const id = parent.getAttribute("data-id");
      const newText = parent.querySelector(".edit-textarea").value.trim();
      if (newText) {
        await updateDoc(doc(db, "comments", id), { text: newText });
        loadComments();
      }
    });
  });

  // Delete
  commentsList.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const parent = e.target.closest("[data-id]");
      const id = parent.getAttribute("data-id");
      if (confirm("Delete this comment?")) {
        await deleteDoc(doc(db, "comments", id));
        loadComments();
      }
    });
  });
}

// ==== Helpers ====
function getRequirementText() {
  return "Not available";
}
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("opacity-0", "pointer-events-none");
  setTimeout(() => toast.classList.add("opacity-0", "pointer-events-none"), 3000);
}
function getStarRating(rating) {
  const starFull = '★'.repeat(Math.floor(rating));
  const starHalf = rating % 1 >= 0.5 ? '½' : '';
  const starEmpty = '☆'.repeat(5 - Math.floor(rating) - (starHalf ? 1 : 0));
  return `${starFull}${starHalf}${starEmpty}<span class="ml-2 text-yellow-400 font-semibold text-lg">${rating.toFixed(1)}</span>`;
}