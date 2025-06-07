 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

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

    const API_KEY = 'd81ce92c1bcd4d74bba38ee005e26d8c';

    // Không dùng BASE_URL cố định nữa vì page & filter thay đổi
    const PAGE_SIZE = 40; // max page_size của RAWG

    let user = null;
    let currentPage = 1;
    let totalPages = 1;
    let ratingFilter = 0;
    let selectedGenre = '';
    let selectedPlatform = '';
    let searchQuery = '';

    onAuthStateChanged(auth, (currentUser) => {
      user = currentUser;
      updateUI();
    });

    function updateUI() {
      const loginBtn = document.getElementById('loginBtn');
      const userSection = document.getElementById('userSection');
      const userName = document.getElementById('userName');
      const logoutBtn = document.getElementById('logoutBtn');
      const loginMessage = document.getElementById('loginMessage');
      const gamesList = document.getElementById('gamesList');

      if (user) {
        loginBtn.classList.add('hidden');
        userSection.classList.remove('hidden');
        userName.textContent = `Welcome back, ${user.email}!`;
        if (loginMessage) loginMessage.classList.add('hidden');
        gamesList.classList.remove('hidden');
        fetchFilters();
        fetchAndRenderGames(currentPage);
      } else {
        loginBtn.classList.remove('hidden');
        userSection.classList.add('hidden');
        if (loginMessage) {
          loginMessage.classList.remove('hidden');
          loginMessage.textContent = 'Please log in to see games';
        }
        gamesList.classList.add('hidden');
        updatePagination(0, 0);
      }

      logoutBtn.onclick = () => {
        signOut(auth).then(() => {
          user = null;
          updateUI();
          alert('Logged out successfully!');
        }).catch((error) => {
          console.error('Error during sign out:', error);
        });
      };
    }

    document.getElementById('loginBtn').addEventListener('click', () => {
      window.location.href = './login.html';
    });

    async function fetchFilters() {
      try {
        const [genreRes, platformRes] = await Promise.all([
          fetch(`https://api.rawg.io/api/genres?key=${API_KEY}`),
          fetch(`https://api.rawg.io/api/platforms/lists/parents?key=${API_KEY}`)
        ]);

        const genreData = await genreRes.json();
        const platformData = await platformRes.json();

        const genreSelect = document.getElementById('genreFilter');
        const platformSelect = document.getElementById('platformFilter');

        // Clear existing options except "All"
        genreSelect.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
        platformSelect.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());

        genreData.results.forEach(g => {
          const option = document.createElement('option');
          option.value = g.id;
          option.textContent = g.name;
          genreSelect.appendChild(option);
        });

        platformData.results.forEach(p => {
          const option = document.createElement('option');
          option.value = p.id;
          option.textContent = p.name;
          platformSelect.appendChild(option);
        });
      } catch (err) {
        console.error('Error loading filters:', err);
      }
    }

    // Thêm debounce để giảm số lần fetch khi gõ search
    function debounce(func, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    }

    document.getElementById('searchBar').addEventListener('input', debounce(() => {
      searchQuery = document.getElementById('searchBar').value.trim();
      currentPage = 1;
      fetchAndRenderGames(currentPage);
    }, 500));

    document.getElementById('genreFilter').addEventListener('change', (e) => {
      selectedGenre = e.target.value;
      currentPage = 1;
      fetchAndRenderGames(currentPage);
    });

    document.getElementById('platformFilter').addEventListener('change', (e) => {
      selectedPlatform = e.target.value;
      currentPage = 1;
      fetchAndRenderGames(currentPage);
    });

    document.getElementById('removeFilterBtn').addEventListener('click', () => {
      selectedGenre = '';
      selectedPlatform = '';
      ratingFilter = 0;
      searchQuery = '';
      currentPage = 1;

      document.getElementById('searchBar').value = '';
      document.getElementById('genreFilter').value = '';
      document.getElementById('platformFilter').value = '';
      clearRatingStars();

      fetchAndRenderGames(currentPage);
    });

    // Rating star filter
    const starButtons = document.querySelectorAll('.star-btn');
    starButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.getAttribute('data-rating'));
        if (ratingFilter === rating) {
          // Nếu click lại rating đang chọn => bỏ chọn
          ratingFilter = 0;
          clearRatingStars();
        } else {
          ratingFilter = rating;
          highlightStars(rating);
        }
        currentPage = 1;
        fetchAndRenderGames(currentPage);
      });
    });

    function highlightStars(rating) {
      starButtons.forEach(btn => {
        const btnRating = parseInt(btn.getAttribute('data-rating'));
        btn.classList.toggle('selected', btnRating === rating);
      });
    }

    function clearRatingStars() {
      starButtons.forEach(btn => btn.classList.remove('selected'));
    }

    // Sleep helper
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fetch games with filters & pagination (server-side)
    async function fetchGamesFromAPI(page) {
      let url = `https://api.rawg.io/api/games?key=${API_KEY}&page=${page}&page_size=${PAGE_SIZE}`;

      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedGenre) url += `&genres=${selectedGenre}`;
      if (selectedPlatform) url += `&platforms=${selectedPlatform}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        const data = await res.json();

        // Filter by ratingFilter locally
        let results = data.results;
        if (ratingFilter > 0) {
          results = results.filter(game => {
            const r = Math.floor(game.rating);
            return r === ratingFilter;
          });
        }

        // Note: data.count là tổng số game thỏa mãn filter
        return {
          games: results,
          totalCount: data.count
        };
      } catch (err) {
        console.error('Error fetching games:', err);
        return { games: [], totalCount: 0 };
      }
    }

    async function fetchAndRenderGames(page) {
      if (!user) return; // nếu chưa đăng nhập thì không fetch game

      const gamesList = document.getElementById('gamesList');
      gamesList.innerHTML = `<p class="col-span-full text-center text-gray-400">Loading games...</p>`;

      const { games, totalCount } = await fetchGamesFromAPI(page);

      if (games.length === 0) {
        gamesList.innerHTML = `<p class="col-span-full text-center text-gray-400">No games found.</p>`;
        updatePagination(0, 0);
        return;
      }

      renderGames(games);

      totalPages = Math.ceil(totalCount / PAGE_SIZE);
      updatePagination(currentPage, totalPages);
    }

   function renderGames(games) {
  const gamesList = document.getElementById('gamesList');
  gamesList.innerHTML = ''; // reset

  games.forEach(game => {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'bg-gray-800 rounded-lg p-4 flex flex-col';

    const img = document.createElement('img');
    img.src = game.background_image || 'https://via.placeholder.com/300x150?text=No+Image';
    img.alt = game.name;
    img.className = 'w-full h-40 object-cover rounded mb-3';
    gameDiv.appendChild(img);

    const title = document.createElement('h2');
    title.textContent = game.name;
    title.className = 'text-xl font-semibold mb-2 truncate';
    gameDiv.appendChild(title);

    // Giữ nguyên star rating cũ
   const ratingDiv = document.createElement('div');
ratingDiv.className = 'mb-2 flex items-center space-x-1';

const rating = game.rating; // ví dụ 3.7
const maxStars = 5;

for (let i = 1; i <= maxStars; i++) {
  const starSpan = document.createElement('span');
  starSpan.style.fontSize = '1.2rem';
  starSpan.style.color = '#ffd700'; // vàng

  if (rating >= i) {
    // full star
    starSpan.innerHTML = '&#9733;'; // ★
  } else if (rating >= i - 0.5) {
    // half star: dùng ký tự unicode half star hoặc custom bằng icon, tạm dùng ★ với opacity
    starSpan.innerHTML = '&#9733;';
    starSpan.style.color = '#ffd700';
    starSpan.style.position = 'relative';

    // tạo hiệu ứng half star bằng css (overlay trắng)
    starSpan.style.background = `linear-gradient(to right, #ffd700 50%, #e1e1e1 50%)`;
    starSpan.style['-webkit-background-clip'] = 'text';
    starSpan.style['-webkit-text-fill-color'] = 'transparent';
  } else {
    // empty star
    starSpan.innerHTML = '&#9733;';
    starSpan.style.color = '#e1e1e1'; // xám nhạt
  }
  ratingDiv.appendChild(starSpan);
}

const ratingNumber = document.createElement('span');
ratingNumber.textContent = ` (${rating.toFixed(1)})`;
ratingNumber.className = 'text-gray-400 ml-2 text-sm';
ratingDiv.appendChild(ratingNumber);

gameDiv.appendChild(ratingDiv);


    // Released date
    const releaseDate = document.createElement('p');
    releaseDate.textContent = `Released: ${game.released || 'Unknown'}`;
    releaseDate.className = 'text-gray-400 text-sm mb-4';
    gameDiv.appendChild(releaseDate);

    // Nút Details
    const detailBtn = document.createElement('a');
    detailBtn.href = `gamedetails.html?id=${game.id}`;
    detailBtn.textContent = 'Details';
    detailBtn.className = 'mt-auto inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-center';
    gameDiv.appendChild(detailBtn);

    gamesList.appendChild(gameDiv);
  });
}


    function updatePagination(page, total) {
      const pageCountSpan = document.getElementById('pageCount');
      const prevBtn = document.getElementById('prevPageBtn');
      const nextBtn = document.getElementById('nextPageBtn');

      if (total === 0) {
        pageCountSpan.textContent = 'Page 0 of 0';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      pageCountSpan.textContent = `Page ${page} of ${total}`;
      prevBtn.disabled = page <= 1;
      nextBtn.disabled = page >= total;
    }

    document.getElementById('prevPageBtn').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchAndRenderGames(currentPage);
      }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchAndRenderGames(currentPage);
      }
    });

    // Khởi tạo UI nếu user đã đăng nhập sẵn
    updateUI();