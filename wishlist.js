// Import các hàm Firebase cần thiết cho Authentication (đăng nhập/đăng xuất)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Cấu hình Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyBRT5VFIn2NGVzNn15mu_YeQNiz8vEmiL0",
  authDomain: "game-verse-c777c.firebaseapp.com",
  projectId: "game-verse-c777c",
  storageBucket: "game-verse-c777c.appspot.com",
  messagingSenderId: "413081788819",
  appId: "1:413081788819:web:e9d1ee9d2be5eb37230866",
  measurementId: "G-DF5HFT1R49"
};

// Khởi tạo Firebase app
const app = initializeApp(firebaseConfig);

// Khởi tạo Firebase Authentication
const auth = getAuth(app);

// Lắng nghe sự thay đổi trạng thái đăng nhập của người dùng
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Nếu đã đăng nhập
    // Hiển thị email người dùng lên phần tử có id "userName"
    document.getElementById("userName").textContent = `Welcome, ${user.email}`;
    // Hiện phần tử userSection (hiển thị các chức năng dành cho user)
    document.getElementById("userSection").classList.remove("hidden");
    // Ẩn nút đăng nhập
    document.getElementById("loginBtn").classList.add("hidden");
    // Tải wishlist của user dựa trên email
    loadWishlist(user.email);
  } else {
    // Nếu chưa đăng nhập
    // Ẩn phần userSection
    document.getElementById("userSection").classList.add("hidden");
    // Hiện nút đăng nhập
    document.getElementById("loginBtn").classList.remove("hidden");
    // Hiển thị thông báo yêu cầu đăng nhập để xem wishlist
    document.getElementById("wishlistContainer").innerHTML =
      `<p class="text-red-400 text-lg">Please log in to see wishlist.</p>`;
  }
});

// Bắt sự kiện click nút đăng xuất
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    // Đăng xuất thành công thì chuyển về trang index.html
    window.location.href = "index.html";
  }).catch(error => console.error("Logout error:", error));
});

// Hàm tạo key lưu wishlist trong localStorage dựa trên email người dùng
function getKey(email) {
  return `wishlist_${email}`;
}

// Hàm kiểm tra và cập nhật dữ liệu wishlist (thêm thuộc tính addedAt nếu thiếu)
function fixWishlistData(email) {
  const key = getKey(email);
  let wishlist = JSON.parse(localStorage.getItem(key)) || [];
  let changed = false;

  // Duyệt qua từng game trong wishlist
  wishlist = wishlist.map(game => {
    // Nếu game chưa có thuộc tính addedAt (ngày thêm) thì bổ sung
    if (!game.addedAt) {
      changed = true;
      return { ...game, addedAt: new Date().toLocaleString() };
    }
    return game;
  });

  // Nếu có cập nhật thì lưu lại localStorage
  if (changed) localStorage.setItem(key, JSON.stringify(wishlist));
}

// Hàm hiển thị đánh giá sao theo rating dạng số thành các biểu tượng sao vàng và rỗng
function getStarRating(rating) {
  const full = Math.floor(rating); // số sao đầy đủ
  const half = rating % 1 >= 0.5 ? 1 : 0; // số sao nửa (nếu có)
  const empty = 5 - full - half; // số sao rỗng
  // Tạo chuỗi sao tương ứng và bọc trong span màu vàng
  return `${'\u2605'.repeat(full)}${'\u2605'.repeat(half)}${'\u2606'.repeat(empty)}`
    .split('')
    .map(star => `<span class="text-yellow-400">${star}</span>`).join('');
}

// Hàm hiển thị thông báo nhỏ (toast) ở góc màn hình, tự ẩn sau khoảng thời gian duration
function showToast(message, duration = 2000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.opacity = 1;
  toast.style.pointerEvents = "auto";
  setTimeout(() => {
    toast.style.opacity = 0;
    toast.style.pointerEvents = "none";
  }, duration);
}

// Hàm tải và hiển thị wishlist từ localStorage dựa trên email user
function loadWishlist(email) {
  fixWishlistData(email); // Đảm bảo dữ liệu wishlist có đủ trường addedAt
  const key = getKey(email);
  const wishlist = JSON.parse(localStorage.getItem(key)) || [];
  const wishlistContainer = document.getElementById("wishlistContainer");
  wishlistContainer.innerHTML = "";

  // Nếu wishlist rỗng thì hiển thị thông báo
  if (wishlist.length === 0) {
    wishlistContainer.innerHTML = `<p class="text-red-400">Your wishlist is empty.</p>`;
    return;
  }

  // Duyệt qua từng game trong wishlist và tạo phần tử hiển thị
  wishlist.forEach(game => {
    const gameElement = document.createElement("div");
    gameElement.classList.add("bg-gray-800", "p-4", "rounded-xl", "shadow-lg", "space-y-4", "relative");

    gameElement.innerHTML = `
      <img src="${game.background_image}" alt="${game.name}" class="rounded-xl shadow-lg w-full h-48 object-cover mb-4" />
      <h3 class="text-xl text-indigo-400 font-semibold">${game.name}</h3>
      <p class="text-gray-300">Release Date: ${game.released}</p>
      <div class="flex items-center gap-1 text-lg">${getStarRating(game.rating)}</div>
      <p class="text-gray-300 text-sm">Added on: ${game.addedAt || 'Unknown'}</p>

      <div class="note-section flex justify-between items-center border border-indigo-600 rounded-md p-2 bg-gray-700 text-gray-300 text-sm">
        <div class="note-text flex-1 whitespace-pre-wrap">${game.note || "No notes added."}</div>
        <button class="editNoteBtn bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-1 ml-3 text-sm" data-id="${game.id}">Edit</button>
      </div>

      <a href="gamedetails.html?id=${game.id}" class="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-700 transition mt-4 block text-center">View Details</a>

      <button class="removeFromWishlistBtn bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition mt-2 w-full" data-id="${game.id}">
        Remove from Wishlist
      </button>
    `;

    wishlistContainer.appendChild(gameElement);
  });

  // Gán sự kiện xóa game khỏi wishlist cho tất cả nút "Remove from Wishlist"
  document.querySelectorAll(".removeFromWishlistBtn").forEach(btn => {
    btn.addEventListener("click", (e) => removeFromWishlist(e, email));
  });

  // Gán sự kiện chỉnh sửa ghi chú cho tất cả nút "Edit"
  document.querySelectorAll(".editNoteBtn").forEach(btn => {
    btn.addEventListener("click", (e) => handleEditNote(e, email));
  });
}

// Hàm xóa game khỏi wishlist khi người dùng nhấn nút xóa
function removeFromWishlist(event, email) {
  const key = getKey(email);
  const gameId = Number(event.target.getAttribute("data-id"));
  let wishlist = JSON.parse(localStorage.getItem(key)) || [];
  // Lọc bỏ game có id trùng với gameId vừa lấy
  wishlist = wishlist.filter(game => game.id !== gameId);
  // Lưu lại localStorage
  localStorage.setItem(key, JSON.stringify(wishlist));
  // Tải lại wishlist để cập nhật UI
  loadWishlist(email);
  // Hiển thị thông báo đã xóa
  showToast("Removed from wishlist!");
}

// Hàm xử lý chỉnh sửa ghi chú (note) cho game
function handleEditNote(event, email) {
  const gameId = Number(event.target.getAttribute("data-id"));
  const parent = event.target.closest(".note-section");

  // Nếu popup chỉnh sửa đang mở rồi thì đóng popup đó
  const existingPopup = parent.querySelector(".edit-note-popup");
  if (existingPopup) {
    existingPopup.remove();
    return;
  }

  // Lấy danh sách wishlist hiện tại
  const key = getKey(email);
  const wishlist = JSON.parse(localStorage.getItem(key)) || [];
  // Tìm game cần chỉnh sửa note
  const game = wishlist.find(g => g.id === gameId);
  const currentNote = game?.note || "";

  // Tạo popup textarea để nhập note mới
  const popup = document.createElement("div");
  popup.classList.add("edit-note-popup", "absolute", "top-0", "right-0", "z-50", "bg-gray-800", "border", "border-indigo-600", "rounded-md", "p-3", "w-64", "shadow-lg");

  popup.innerHTML = `
    <textarea class="edit-note-textarea w-full h-24 p-2 bg-gray-700 text-white rounded resize-y" placeholder="Add or edit note...">${currentNote}</textarea>
    <div class="flex justify-end space-x-2 mt-2">
      <button class="cancelEditNoteBtn bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded">Cancel</button>
      <button class="saveEditNoteBtn bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded">Save</button>
    </div>
  `;

  // Đặt vị trí relative cho phần tử cha để popup có thể hiện đúng vị trí tuyệt đối
  parent.style.position = "relative";
  // Thêm popup vào trong phần note-section
  parent.appendChild(popup);

  // Gán sự kiện hủy chỉnh sửa
  popup.querySelector(".cancelEditNoteBtn").addEventListener("click", () => popup.remove());

  // Gán sự kiện lưu note mới
  popup.querySelector(".saveEditNoteBtn").addEventListener("click", () => {
    const newNote = popup.querySelector(".edit-note-textarea").value.trim();
    saveNote(gameId, newNote, email);
    popup.remove();
    loadWishlist(email); // Tải lại để cập nhật UI
    showToast("Note saved!"); // Hiển thị thông báo
  });
}

// Hàm lưu ghi chú mới vào wishlist trong localStorage
function saveNote(gameId, note, email) {
  const key = getKey(email);
  let wishlist = JSON.parse(localStorage.getItem(key)) || [];
  // Cập nhật note của game tương ứng
  wishlist = wishlist.map(game => game.id === gameId ? { ...game, note } : game);
  // Lưu lại localStorage
  localStorage.setItem(key, JSON.stringify(wishlist));
}
