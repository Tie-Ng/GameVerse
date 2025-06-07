// Khai báo cấu hình Firebase cho dự án
const firebaseConfig = { 
    apiKey: "AIzaSyBRT5VFIn2NGVzNn15mu_YeQNiz8vEmiL0",
    authDomain: "game-verse-c777c.firebaseapp.com",
    projectId: "game-verse-c777c",
    storageBucket: "game-verse-c777c.appspot.com",
    messagingSenderId: "413081788819",
    appId: "1:413081788819:web:e9d1ee9d2be5eb37230866",
    measurementId: "G-DF5HFT1R49"
};

// Import các module cần thiết từ Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Khởi tạo Firebase app và các dịch vụ
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Biến toàn cục để lưu email người dùng hiện tại và game hiện tại
let currentUserEmail = null;
let currentGame = null;

// Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserEmail = user.email;
        // Hiển thị email người dùng
        document.getElementById("userName").textContent = `Welcome, ${user.email}`;
        // Hiện phần user, ẩn nút đăng nhập
        document.getElementById("userSection").classList.remove("hidden");
        document.getElementById("loginBtn").classList.add("hidden");
    } else {
        // Nếu chưa đăng nhập, ẩn phần user, hiện nút đăng nhập
        currentUserEmail = null;
        document.getElementById("userSection").classList.add("hidden");
        document.getElementById("loginBtn").classList.remove("hidden");
    }
});

// Xử lý đăng xuất khi bấm nút
document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "index.html"; // Quay về trang chủ
    }).catch(error => console.error("Logout error:", error));
});

// Xử lý nút quay lại
document.getElementById("backBtn").addEventListener("click", () => {
    window.history.back(); // Quay lại trang trước
});

// Lấy ID game từ URL (ví dụ: ?id=1234)
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('id');
const API_KEY = 'd81ce92c1bcd4d74bba38ee005e26d8c'; // API key của RAWG

// Hàm fetch chi tiết game từ RAWG
async function fetchGameDetails(id) {
    try {
        const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);
        if (!response.ok) throw new Error("API Error");
        const game = await response.json();
        currentGame = game;

        // Hiển thị nội dung chi tiết game
        document.getElementById("gameDetails").innerHTML = `
          <div class="flex flex-col md:flex-row items-start gap-8">
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
    } catch (err) {
        console.error("Failed to load game:", err);
        document.getElementById("gameDetails").innerHTML = `<p class="text-red-400">Error loading game details.</p>`;
    }
}

// Nếu có gameId thì fetch chi tiết, không thì báo lỗi
if (gameId) fetchGameDetails(gameId);
else document.getElementById("gameDetails").innerHTML = `<p class="text-red-400">No game ID provided.</p>`;

// Xử lý nút thêm vào Wishlist
document.getElementById("addToWishlistBtn").addEventListener("click", () => {
    if (!currentUserEmail) {
        showToast("You must be logged in to add to wishlist.");
        return;
    }

    if (!currentGame) {
        showToast("Game not loaded yet.");
        return;
    }

    const gameData = {
        id: currentGame.id,
        name: currentGame.name,
        background_image: currentGame.background_image || 'https://via.placeholder.com/600',
        released: currentGame.released,
        description_raw: currentGame.description_raw,
        rating: currentGame.rating,
    };

    // Lưu vào localStorage theo từng người dùng
    const key = `wishlist_${currentUserEmail}`;
    const wishlist = JSON.parse(localStorage.getItem(key)) || [];

    // Kiểm tra đã tồn tại chưa
    if (!wishlist.some(item => item.id === gameData.id)) {
        wishlist.push(gameData);
        localStorage.setItem(key, JSON.stringify(wishlist));
        showToast(`${gameData.name} has been added to your wishlist!`);
    } else {
        showToast(`${gameData.name} is already in your wishlist.`);
    }
});

// Hàm tạo sao theo điểm rating
function getStarRating(rating) {
    const starsTotal = 5;
    const fullStars = Math.floor(rating);
    const halfStar = (rating - fullStars) >= 0.5 ? 1 : 0;
    const emptyStars = starsTotal - fullStars - halfStar;

    const starFull = `<svg ...>...</svg>`;  // sao đầy
    const starHalf = `<svg ...>...</svg>`;  // sao nửa
    const starEmpty = `<svg ...>...</svg>`; // sao rỗng

    return `
        ${starFull.repeat(fullStars)}
        ${halfStar ? starHalf : ''}
        ${starEmpty.repeat(emptyStars)}
        <span class="ml-2 text-yellow-400 font-semibold text-lg">${rating.toFixed(1)}</span>
    `;
}

// Hàm trả về yêu cầu cấu hình (có thể mở rộng thêm sau)
function getRequirementText(platforms, type) {
    return "Not available";
}

// Hiển thị toast message
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("opacity-0", "pointer-events-none");
    setTimeout(() => {
        toast.classList.add("opacity-0", "pointer-events-none");
    }, 3000);
}
