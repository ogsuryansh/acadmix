document.addEventListener("DOMContentLoaded", () => {
  const BASE_API = "https://acadmix-opal.vercel.app";

  // ----------------------------------------
  // 🔁 Navbar toggle (for mobile)
  // ----------------------------------------

  const toggleButton = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (toggleButton && navMenu) {
    toggleButton.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      toggleButton.classList.toggle("open");
    });

    document.querySelectorAll(".nav-item").forEach((link) => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          toggleButton.classList.remove("open");
        }
      });
    });
  }

  // ----------------------------------------
  // 👤 Auth Check: Show Join/Logout and Photo
  // ----------------------------------------
  if (BASE_API) {
    fetch(`${BASE_API}/api/auth/user`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("User fetch failed");
        return res.json();
      })
      .then((user) => {
        const joinButtons = document.querySelectorAll(".join-btn");
        const userIcons = document.querySelectorAll(".user-icon");

        if (user && user.photo) {
          userIcons.forEach((icon) => {
            icon.innerHTML = `<img src="${user.photo}" style="width: 35px; height: 35px; border-radius: 50%;" />`;
          });

          joinButtons.forEach((btn) => {
            btn.textContent = "Logout";
            btn.onclick = () => {
              window.location.href = `${BASE_API}/api/auth/logout`;
            };
          });
        } else {
          joinButtons.forEach((btn) => {
            btn.textContent = "Join";
            btn.onclick = () => {
              window.location.href = `${BASE_API}/api/auth/google`;
            };
          });
        }
      })
      .catch((err) => {
        console.warn("Auth check failed:", err);
      });
  } else {
    console.error(
      "❌ VITE_API_URL is not defined. Set it in Netlify environment variables."
    );
  }

  // ----------------------------------------
  // 🚀 "Get Started" Button Animation
  // ----------------------------------------
  const btn = document.querySelector(".btn-get-started");
  if (btn) {
    btn.addEventListener("click", () => {
      btn.classList.toggle("open");
    });
  }
});
let PAGE_SECTION;
if (window.location.pathname.includes("class11")) PAGE_SECTION = "class11";
else if (window.location.pathname.includes("class12")) PAGE_SECTION = "class12";
else if (window.location.pathname.includes("test")) PAGE_SECTION = "test";
else PAGE_SECTION = "home"; // homepage fallback

const API_BASE = "https://acadmix-opal.vercel.app";

fetch(`${API_BASE}/api/books`)
  .then((res) => res.json())
  .then((cards) => {
    const filtered = cards.filter((card) => card.section === PAGE_SECTION);

    if (PAGE_SECTION === "home") {
      // No NEET/JEE split on homepage
      const container = document.getElementById("card-container");
      container.innerHTML = "";

      filtered.forEach((card) => {
        container.appendChild(createCard(card));
      });

      if (filtered.length === 0) {
        container.innerHTML = "<p>No books found for homepage.</p>";
      }
    } else {
      // Split by NEET and JEE on class11/class12/test pages
      const neetCards = filtered.filter((card) => card.track === "NEET");
      const jeeCards = filtered.filter((card) => card.track === "JEE");

      const neetContainer = document.getElementById("card-container-neet");
      const jeeContainer = document.getElementById("card-container-jee");

      if (neetContainer) {
        neetContainer.innerHTML = "";
        neetCards.forEach((card) =>
          neetContainer.appendChild(createCard(card))
        );
        if (neetCards.length === 0) {
          neetContainer.innerHTML = "<p>📚 NEET Content Coming Soon</p>";
        }
      }

      if (jeeContainer) {
        jeeContainer.innerHTML = "";
        jeeCards.forEach((card) => jeeContainer.appendChild(createCard(card)));
        if (jeeCards.length === 0) {
          jeeContainer.innerHTML = "<p>📘 JEE Content Coming Soon</p>";
        }
      }
    }
  })
  .catch((err) => {
    console.error("Error fetching cards:", err);
    const homeContainer = document.getElementById("card-container");
    const neetContainer = document.getElementById("card-container-neet");
    const jeeContainer = document.getElementById("card-container-jee");

    if (homeContainer)
      homeContainer.innerHTML = "<p>Error loading materials.</p>";
    if (neetContainer)
      neetContainer.innerHTML = "<p>Error loading NEET materials.</p>";
    if (jeeContainer)
      jeeContainer.innerHTML = "<p>Error loading JEE materials.</p>";
  });

function createCard(card) {
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.innerHTML = `
    <div class="card-image">
      <img src="${card.imageUrl}" alt="${card.title}" />
      <div class="badge">${card.badge || ""}</div>
    </div>
    <div class="card-body">
      <h1 class="category">${card.category}</h1>
      <h3 class="card-title">${card.title}</h3>
      <div class="price">
        <p class="original">₹${card.priceOriginal}</p>
        <p class="discount">₹${card.priceDiscounted}</p>
      </div>
      <div class="demo">Demo Available: ${
        card.demo === "Yes" ? "Yes" : "No"
      }</div>

${
  card.pdfPath
    ? `
  <a href="/client/ebook-reader/index.html?pdf=${encodeURIComponent(
    card.pdfPath
  )}" class="btn-buy" target="_blank">📖 Read</a>
`
    : `
  <a href="/api/payment/${card._id}" class="btn-buy">Buy Now</a>
`
}

    </div>
  `;
  return cardEl;
}
