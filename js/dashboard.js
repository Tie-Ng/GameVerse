import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRT5VFIn2NGVzNn15mu_YeQNiz8vEmiL0",
  authDomain: "game-verse-c777c.firebaseapp.com",
  projectId: "game-verse-c777c",
  storageBucket: "game-verse-c777c.appspot.com",
  messagingSenderId: "413081788819",
  appId: "1:413081788819:web:e9d1ee9d2be5eb37230866",
  measurementId: "G-DF5HFT1R49"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Lấy phần tử
const loginBtn = document.getElementById("loginBtn");
const userSection = document.getElementById("userSection");
const userNameSpan = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

// Kiểm tra trạng thái đăng nhập
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (user.email !== "admin@gmail.com") {
      alert("Access Denied: Admins only.");
      window.location.href = "index.html";
      return;
    }

    // Hiển thị tên người dùng thay cho nút login
    userNameSpan.textContent = user.email;
    loginBtn.style.display = "none";
    userSection.classList.remove("hidden");

    await loadDashboardData();
  } else {
    // Chưa đăng nhập, show nút login và ẩn user section
    loginBtn.style.display = "block";
    userSection.classList.add("hidden");
    window.location.href = "login.html";
  }
});

// Xử lý logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    loginBtn.style.display = "block";
    userSection.classList.add("hidden");
    window.location.href = "login.html";
  });
});

// Chuyển hướng khi nhấn Login
loginBtn.addEventListener("click", () => {
  window.location.href = "login.html";
});

// Hàm tải dữ liệu dashboard (giữ nguyên)
async function loadDashboardData() {
  const q = query(collection(db, "specialGames"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const games = snapshot.docs.map(doc => doc.data());

  document.getElementById("totalGames").textContent = games.length;

  const genreStats = {};
  const platformStats = {};
  const latestGamesList = [];

  games.forEach((g, i) => {
    genreStats[g.genre] = (genreStats[g.genre] || 0) + 1;
    platformStats[g.platform] = (platformStats[g.platform] || 0) + 1;

    if (i < 5) {
      latestGamesList.push(
        `<li><span class="text-green-400 font-semibold">${g.title}</span> - ${g.platform}</li>`
      );
    }
  });

  document.getElementById("genreStats").innerHTML = Object.entries(genreStats)
    .map(([k, v]) => `<li>${k}: ${v}</li>`).join("");

  document.getElementById("platformStats").innerHTML = Object.entries(platformStats)
    .map(([k, v]) => `<li>${k}: ${v}</li>`).join("");

  document.getElementById("latestGames").innerHTML = latestGamesList.join("");

  const ctx = document.getElementById("genreChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(genreStats),
      datasets: [{
        label: "Games per Genre",
        data: Object.values(genreStats),
        backgroundColor: "rgba(34,197,94,0.7)"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      }
    }
  });
}
