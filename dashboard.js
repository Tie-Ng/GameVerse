// ===== Nhập các module từ Firebase CDN =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"; // Khởi tạo Firebase app
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // Firestore database
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; // Firebase Authentication

// ===== Cấu hình Firebase (copy từ Firebase Console) =====
const firebaseConfig = {
    apiKey: "AIzaSyBRT5VFIn2NGVzNn15mu_YeQNiz8vEmiL0", // Khóa API
    authDomain: "game-verse-c777c.firebaseapp.com", // Miền xác thực
    projectId: "game-verse-c777c", // ID dự án
    storageBucket: "game-verse-c777c.appspot.com", // Lưu trữ file
    messagingSenderId: "413081788819", // ID gửi tin nhắn
    appId: "1:413081788819:web:e9d1ee9d2be5eb37230866", // ID app web
    measurementId: "G-DF5HFT1R49" // Google Analytics (nếu cần)
};

// ===== Khởi tạo Firebase App, Firestore và Auth =====
const app = initializeApp(firebaseConfig); // Khởi tạo app
const db = getFirestore(app); // Kết nối Firestore
const auth = getAuth(app); // Kết nối Authentication

// ===== Lấy phần tử HTML =====
const userEmailSpan = document.getElementById("user-email"); // Phần hiển thị email người dùng
const logoutBtn = document.getElementById("logoutBtn"); // Nút logout

// ===== Kiểm tra trạng thái đăng nhập =====
onAuthStateChanged(auth, async user => {
    if (user) {
        userEmailSpan.textContent = user.email; // Hiển thị email người dùng

        // Chỉ cho phép admin truy cập dashboard
        if (user.email !== "admin@gmail.com") {
            alert("Access Denied: Admins only."); // Cảnh báo
            window.location.href = "index.html"; // Quay về trang chính
            return;
        }

        // Nếu là admin, tải dữ liệu thống kê
        await loadDashboardData();
    } else {
        // Nếu chưa đăng nhập, chuyển đến login
        window.location.href = "login.html";
    }
});

// ===== Sự kiện logout =====
logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "login.html"); // Đăng xuất và quay về login
});

// ===== Hàm tải dữ liệu dashboard =====
async function loadDashboardData() {
    // Truy vấn danh sách game từ Firestore, sắp xếp theo thời gian tạo mới nhất
    const q = query(collection(db, "specialGames"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q); // Lấy dữ liệu
    const games = snapshot.docs.map(doc => doc.data()); // Biến đổi về dạng mảng dữ liệu

    // Hiển thị tổng số game
    document.getElementById("totalGames").textContent = games.length;

    // Tạo object thống kê theo thể loại và nền tảng
    const genreStats = {};
    const platformStats = {};
    const latestGamesList = []; // Danh sách game mới nhất

    // Duyệt qua từng game để thống kê
    games.forEach((g, i) => {
        genreStats[g.genre] = (genreStats[g.genre] || 0) + 1; // Tăng đếm theo thể loại
        platformStats[g.platform] = (platformStats[g.platform] || 0) + 1; // Tăng đếm theo nền tảng

        // Thêm 5 game mới nhất vào danh sách
        if (i < 5) {
            latestGamesList.push(
                `<li><span class="text-green-400 font-semibold">${g.title}</span> - ${g.platform}</li>`
            );
        }
    });

    // Hiển thị danh sách thể loại
    document.getElementById("genreStats").innerHTML = Object.entries(genreStats)
        .map(([k, v]) => `<li>${k}: ${v}</li>`).join("");

    // Hiển thị danh sách nền tảng
    document.getElementById("platformStats").innerHTML = Object.entries(platformStats)
        .map(([k, v]) => `<li>${k}: ${v}</li>`).join("");

    // Hiển thị danh sách game mới
    document.getElementById("latestGames").innerHTML = latestGamesList.join("");

    // ===== Vẽ biểu đồ thống kê thể loại bằng Chart.js =====
    const ctx = document.getElementById("genreChart").getContext("2d");
    new Chart(ctx, {
        type: "bar", // Kiểu biểu đồ cột
        data: {
            labels: Object.keys(genreStats), // Nhãn (thể loại)
            datasets: [{
                label: "Games per Genre", // Chú thích
                data: Object.values(genreStats), // Số liệu theo thể loại
                backgroundColor: "rgba(34,197,94,0.7)" // Màu cột
            }]
        },
        options: {
            responsive: true, // Tự động co giãn theo màn hình
            plugins: {
                legend: { display: false }, // Ẩn chú thích
                tooltip: { enabled: true } // Hiện thông tin khi hover
            },
            scales: {
                x: { ticks: { color: "#fff" } }, // Màu trục X
                y: { ticks: { color: "#fff" } }  // Màu trục Y
            }
        }
    });
}
