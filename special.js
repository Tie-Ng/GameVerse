// Import các hàm cần thiết từ Firebase SDK (phiên bản 10.12.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Cấu hình dự án Firebase (thông tin của bạn trên Firebase)
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

// Khởi tạo Firestore và Authentication
const db = getFirestore(app);
const auth = getAuth(app);

// Lấy các element trong DOM
const addGameForm = document.getElementById("addGameForm");
const gameList = document.getElementById("gameList");
const filterPlatform = document.getElementById("filterPlatform");
const filterGenre = document.getElementById("filterGenre");
const searchInput = document.getElementById("searchInput");
const userEmailSpan = document.getElementById("user-email");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Biến dùng cho phân trang, lưu game, và quản lý người dùng
let currentPage = 1;
const pageSize = 8;
let allGames = [];
let filteredGames = [];
let currentUserEmail = null;
const adminEmail = "admin@gmail.com"; // Email của admin

let editingGameId = null; // ID game đang được sửa

// Lắng nghe trạng thái đăng nhập người dùng
onAuthStateChanged(auth, user => {
  if (user) {
    // Nếu đã đăng nhập, lưu email user và hiển thị email trên UI
    currentUserEmail = user.email;
    userEmailSpan.textContent = currentUserEmail;

    // Nếu là admin thì hiện form thêm game, không thì ẩn đi
    if (currentUserEmail === adminEmail) {
      addGameForm.classList.remove("hidden");
    } else {
      addGameForm.classList.add("hidden");
    }

    // Tải dữ liệu game từ Firestore
    loadGames();
  } else {
    // Nếu chưa đăng nhập thì chuyển về trang login
    window.location.href = "login.html";
  }
});

// Xử lý khi nhấn nút đăng xuất
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html"; // chuyển về login khi đăng xuất
  });
});

// Hàm tải danh sách game từ Firestore
async function loadGames() {
  try {
    // Lấy collection "specialGames", sắp xếp theo createdAt giảm dần
    const q = query(collection(db, "specialGames"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    // Lấy dữ liệu và map thành mảng các object game có thêm id document
    allGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Cập nhật bộ lọc dựa trên dữ liệu hiện có
    populateFilters();

    // Áp dụng bộ lọc để hiển thị game
    applyFilters();
  } catch (error) {
    console.error("Error loading games:", error);
  }
}

// Hàm tạo danh sách filter platform và genre dựa trên dữ liệu game
function populateFilters() {
  // Lấy tập các platform và genre duy nhất, rồi sort alphabet
  const platforms = [...new Set(allGames.map(g => g.platform))].sort();
  const genres = [...new Set(allGames.map(g => g.genre))].sort();

  // Tạo options cho select platform
  filterPlatform.innerHTML = `<option value="">All Platforms</option>` +
    platforms.map(p => `<option value="${p}">${p}</option>`).join("");

  // Tạo options cho select genre
  filterGenre.innerHTML = `<option value="">All Genres</option>` +
    genres.map(g => `<option value="${g}">${g}</option>`).join("");
}

// Lắng nghe sự kiện thay đổi filter hoặc ô tìm kiếm, reset page về 1 và áp dụng filter lại
filterPlatform.addEventListener("change", () => {
  currentPage = 1;
  applyFilters();
});
filterGenre.addEventListener("change", () => {
  currentPage = 1;
  applyFilters();
});
searchInput.addEventListener("input", () => {
  currentPage = 1;
  applyFilters();
});

// Hàm lọc game dựa trên platform, genre, và tìm kiếm
function applyFilters() {
  const selectedPlatform = filterPlatform.value;
  const selectedGenre = filterGenre.value;
  const searchTerm = searchInput.value.toLowerCase();

  filteredGames = allGames.filter(game => {
    const matchesPlatform = !selectedPlatform || game.platform === selectedPlatform;
    const matchesGenre = !selectedGenre || game.genre === selectedGenre;
    const matchesSearch = game.title.toLowerCase().includes(searchTerm);
    return matchesPlatform && matchesGenre && matchesSearch;
  });

  renderGames();
}

// Hàm hiển thị danh sách game lên trang, theo phân trang
function renderGames() {
  if (!filteredGames.length) {
    // Nếu không có game nào thì hiện thông báo
    gameList.innerHTML = `<p class="col-span-full text-center text-gray-400">No games found.</p>`;
    document.getElementById("pageIndicator").textContent = `Page 0`;
    return;
  }

  // Tính index game sẽ hiển thị dựa vào trang hiện tại và kích thước trang
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const gamesToDisplay = filteredGames.slice(start, end);

  // Tạo HTML cho từng game
  gameList.innerHTML = gamesToDisplay.map(game => {
    const shortDesc = game.description ? (game.description.length > 100 ? game.description.slice(0, 100) + "..." : game.description) : "";
    const isAdmin = currentUserEmail === adminEmail;

    return `
      <div class="bg-gray-800 p-4 rounded shadow relative">
        <img src="${game.image}" alt="${game.title}" class="rounded w-full h-40 object-cover mb-2">
        <h3 class="text-lg font-bold">${game.title}</h3>
        <p class="text-sm text-gray-400">${game.platform} | ${game.genre}</p>
        <p class="text-sm text-gray-300 mt-1">${shortDesc}</p>
        <a href="specialdetails.html?id=${game.id}" class="text-green-400 text-sm hover:underline block mb-2">View Details</a>
        ${isAdmin ? `
          <div class="absolute top-2 right-2 flex gap-1">
            <button data-id="${game.id}" class="editBtn bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">Edit</button>
            <button data-id="${game.id}" class="deleteBtn bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">Delete</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join("");

  // Cập nhật chỉ báo trang hiện tại
  document.getElementById("pageIndicator").textContent = `Page ${currentPage} / ${Math.ceil(filteredGames.length / pageSize)}`;

  // Thêm sự kiện cho các nút Edit và Delete (chỉ admin mới thấy)
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", onEditGame);
  });
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", onDeleteGame);
  });
}

// Điều khiển nút trang trước
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderGames();
  }
});

// Điều khiển nút trang sau
document.getElementById("nextPage").addEventListener("click", () => {
  if ((currentPage * pageSize) < filteredGames.length) {
    currentPage++;
    renderGames();
  }
});

// Xử lý submit form thêm hoặc sửa game
addGameForm.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(addGameForm);
  const gameData = {
    title: formData.get("title").trim(),
    image: formData.get("image").trim(),
    platform: formData.get("platform").trim(),
    genre: formData.get("genre").trim(),
    description: formData.get("description").trim(),
    createdAt: new Date()
  };

  try {
    if (editingGameId) {
      // Nếu đang sửa game thì cập nhật document
      const gameRef = doc(db, "specialGames", editingGameId);
      await updateDoc(gameRef, gameData);
    } else {
      // Nếu thêm game mới thì tạo document mới
      await addDoc(collection(db, "specialGames"), gameData);
    }

    editingGameId = null;
    addGameForm.reset();
    cancelEditBtn.classList.add("hidden");
    loadGames(); // Tải lại game mới nhất
  } catch (error) {
    console.error("Error saving game:", error);
  }
});

// Nút hủy sửa game
cancelEditBtn.addEventListener("click", () => {
  editingGameId = null;
  addGameForm.reset();
  cancelEditBtn.classList.add("hidden");
});

// Hàm xử lý khi nhấn nút sửa game
function onEditGame(e) {
  const id = e.target.dataset.id;
  const game = allGames.find(g => g.id === id);
  if (!game) return;

  editingGameId = id;

  // Điền thông tin game vào form để sửa
  addGameForm.title.value = game.title;
  addGameForm.image.value = game.image;
  addGameForm.platform.value = game.platform;
  addGameForm.genre.value = game.genre;
  addGameForm.description.value = game.description;

  addGameForm.classList.remove("hidden");
  cancelEditBtn.classList.remove("hidden");
  addGameForm.scrollIntoView({ behavior: "smooth" }); // Scroll đến form
}

// Hàm xử lý khi nhấn nút xóa game
async function onDeleteGame(e) {
  const id = e.target.dataset.id;
  if (!confirm("Are you sure you want to delete this game?")) return;

  try {
    await deleteDoc(doc(db, "specialGames", id)); // Xóa document trên Firestore
    if (editingGameId === id) {
      editingGameId = null;
      addGameForm.reset();
      cancelEditBtn.classList.add("hidden");
    }
    loadGames(); // Tải lại danh sách game sau khi xóa
  } catch (error) {
    console.error("Error deleting game:", error);
  }
}
