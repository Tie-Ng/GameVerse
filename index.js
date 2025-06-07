 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

        // Firebase configuration
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
        const auth = getAuth(app);

        // Handle authentication state change
        onAuthStateChanged(auth, (user) => {
            const loginBtn = document.getElementById("loginBtn");
            const userSection = document.getElementById("userSection");
            const welcomeMessage = document.getElementById("welcomeMessage");

            if (user) {
                // User is logged in
                welcomeMessage.textContent = `Welcome, ${user.email}`;
                loginBtn.classList.add("hidden");
                userSection.classList.remove("hidden");
            } else {
                // User is not logged in
                welcomeMessage.textContent = "Please log in to see your account.";
                loginBtn.classList.remove("hidden");
                userSection.classList.add("hidden");
            }
        });

        // Logout functionality
        document.getElementById("logoutBtn").addEventListener("click", () => {
            signOut(auth)
                .then(() => {
                    window.location.reload();
                })
                .catch((error) => {
                    console.error("Error logging out: ", error.message);
                });
        });

        // Redirect to login page when Login button is clicked
        document.getElementById("loginBtn").addEventListener("click", () => {
            window.location.href = "login.html";
        });

        // Fetch games data from RAWG API
        const API_KEY = 'd81ce92c1bcd4d74bba38ee005e26d8c';
        const BASE_URL = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=8`;

        async function fetchGames() {
            try {
                const response = await fetch(BASE_URL);

                if (!response.ok) throw new Error('Network response was not ok');

                const data = await response.json();
                const games = data.results;
                const gamesList = document.getElementById("gamesList");
                gamesList.innerHTML = "";

                games.forEach(game => {
                    const gameElement = document.createElement("div");
                    gameElement.classList.add("bg-gray-800", "p-4", "rounded-lg", "shadow-lg", "hover:shadow-xl", "transition-transform", "transform", "hover:scale-105");

                    gameElement.innerHTML = `
                        <img src="${game.background_image || 'https://via.placeholder.com/150'}" alt="${game.name}" class="w-full h-48 object-cover rounded-lg mb-4" />
                        <h3 class="text-xl font-semibold text-indigo-400">${game.name}</h3>
                        <p class="text-sm text-gray-400">${game.released}</p>
                        <p class="text-sm text-gray-300 mt-2">${game.genres.map(genre => genre.name).join(", ")}</p>
                        <a href="gamedetails.html?id=${game.id}" class="text-indigo-400 mt-4 block text-center">View Details</a>
                    `;
                    gamesList.appendChild(gameElement);
                });

                const carouselImages = games.slice(0, 3).map(game => game.background_image);
                const slides = document.querySelectorAll('.carousel-slide');
                let currentSlide = 0;

                slides.forEach((slide, index) => {
                    slide.style.backgroundImage = `url(${carouselImages[index % carouselImages.length]})`;
                });

                function showNextSlide() {
                    slides.forEach((slide, index) => {
                        slide.style.opacity = index === currentSlide ? "1" : "0";
                    });
                    currentSlide = (currentSlide + 1) % slides.length;
                }

                showNextSlide();
                setInterval(showNextSlide, 5000);

            } catch (error) {
                console.error('Error fetching game data:', error);
            }
        }

        fetchGames();