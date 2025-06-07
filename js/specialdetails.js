// Import các hàm cần thiết từ Firebase SDK phiên bản 10.12.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Cấu hình dự án Firebase của bạn (thông tin trên Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyBRT5VFIn2NGVzNn15mu_YeQNiz8vEmiL0",
  authDomain: "game-verse-c777c.firebaseapp.com",
  projectId: "game-verse-c777c",
  storageBucket: "game-verse-c777c.appspot.com",
  messagingSenderId: "413081788819",
  appId: "1:413081788819:web:e9d1ee9d2be5eb37230866",
  measurementId: "G-DF5HFT1R49"
};

// Khởi tạo Firebase app với config ở trên
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore database
const db = getFirestore(app);

// Lấy tham số 'id' trong URL (ví dụ: specialdetails.html?id=abc123)
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get("id");

// Hàm bất đồng bộ để tải chi tiết game từ Firestore dựa trên gameId
async function loadGameDetails() {
  // Lấy element container sẽ hiển thị chi tiết game
  const container = document.getElementById("gameDetails");

  // Nếu không có gameId trong URL thì báo lỗi ngay
  if (!gameId) {
    container.innerHTML = "<p class='text-red-400'>Game ID not provided in URL.</p>";
    return; // Dừng hàm
  }

  try {
    console.log("Loading game with ID:", gameId);

    // Tạo reference đến document trong collection "specialGames" với id = gameId
    const docRef = doc(db, "specialGames", gameId);

    // Lấy snapshot của document
    const docSnap = await getDoc(docRef);

    console.log("Document snapshot:", docSnap);

    // Kiểm tra document có tồn tại không
    if (docSnap.exists()) {
      // Lấy dữ liệu game từ document
      const game = docSnap.data();
      console.log("Game data:", game);

      // Nếu container ban đầu có class flex, center thì bỏ để hiển thị nội dung rõ ràng
      container.classList.remove("flex", "items-center", "justify-center");

      // Hiển thị chi tiết game vào container dưới dạng HTML
      container.innerHTML = `
        <img src="${game.image}" alt="${game.title}" class="w-full max-w-full h-64 object-cover rounded mb-4" />
        <h1 class="text-3xl font-bold mb-2">${game.title}</h1>
        <p class="text-lg text-gray-400 mb-1"><strong>Platform:</strong> ${game.platform}</p>
        <p class="text-lg text-gray-400 mb-1"><strong>Genre:</strong> ${game.genre}</p>
        <p class="mt-4 whitespace-pre-wrap">${game.description || 'No description available.'}</p>
        <p class="text-sm text-gray-500 mt-4">Game ID: ${gameId}</p>
      `;
    } else {
      // Nếu không tìm thấy document, hiển thị thông báo game không tồn tại
      container.innerHTML = "<p class='text-yellow-400'>Game not found.</p>";
    }
  } catch (error) {
    // Nếu có lỗi khi gọi Firestore, in lỗi ra console và hiển thị lỗi cho người dùng
    console.error("Error loading game details:", error);
    container.innerHTML = `
      <p class='text-red-400'>Error loading game details. Check console for details.</p>
      <p class='text-red-400'>${error.message}</p>
    `;
  }
}

// Gọi hàm loadGameDetails khi trang được tải
loadGameDetails();
