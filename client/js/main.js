// Use same-origin for all API calls
const BASE_API = ""; // "" or window.location.origin

document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const joinButtons = document.querySelectorAll(".join-btn");
  const userIcons = document.querySelectorAll(".user-icon");

  // 🔁 Navbar toggle (for mobile)
  if (toggleButton && navMenu) {
    toggleButton.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      toggleButton.classList.toggle("open");
    });

    document.querySelectorAll(".nav-item").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        toggleButton.classList.remove("open");
      });
    });
  }

  // 👤 Render user UI
  function renderUserUI(user) {
    const isLoggedIn = user && user.photo;

    userIcons.forEach((icon) => {
      icon.innerHTML = isLoggedIn
        ? `<img src="${user.photo}" style="width: 35px; height: 35px; border-radius: 50%;" />`
        : `<i class="fa fa-user-circle"></i>`;
    });

    joinButtons.forEach((btn) => {
      if (isLoggedIn) {
        btn.textContent = "Logout";
        btn.onclick = async () => {
          try {
            await fetch(`${BASE_API}/api/auth/logout`, {
              method: "POST",
              credentials: "include",
            });
          } catch (e) {
            console.error("Logout failed:", e);
          }
          localStorage.removeItem("acadmix-user");
          window.location.reload();
        };
      } else {
        btn.textContent = "Join Now";
        btn.onclick = () => {
          window.location.href = `${BASE_API}/api/auth/google`;
        };
      }
    });
  }

  // 🚀 1. Instant load from localStorage
  try {
    const storedUser = JSON.parse(localStorage.getItem("acadmix-user"));
    if (storedUser && storedUser.photo) {
      renderUserUI(storedUser);
    }
  } catch (err) {
    localStorage.removeItem("acadmix-user");
  }

  // 🔁 2. Check live session from backend
  fetch(`${BASE_API}/api/auth/user`, { credentials: "include" })
    .then((res) => {
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("User fetch failed");
      return res.json();
    })
    .then((user) => {
      console.log("👤 Live session user:", user);
      if (user && user.photo) {
        localStorage.setItem("acadmix-user", JSON.stringify(user));
        renderUserUI(user);
      } else {
        localStorage.removeItem("acadmix-user");
        renderUserUI(null);
      }
    })
    .catch((err) => {
      console.warn("⚠️ Auth check unexpected error:", err);
    });
});

// 🚀 "Get Started" Button Animation
const btn = document.querySelector(".btn-get-started");
if (btn) {
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
  });
}

// 📚 Detect page section
let PAGE_SECTION;
if (window.location.pathname.includes("class11")) PAGE_SECTION = "class11";
else if (window.location.pathname.includes("class12")) PAGE_SECTION = "class12";
else if (window.location.pathname.includes("test")) PAGE_SECTION = "test";
else PAGE_SECTION = "home";

fetch(`${BASE_API}/api/books`)
  .then((res) => {
    if (!res.ok) throw new Error("Books fetch failed");
    return res.json();
  })
  .then((cards) => {
    const filtered = cards.filter((card) => card.section === PAGE_SECTION);

    if (PAGE_SECTION === "home") {
      const container = document.getElementById("card-container");
      container.innerHTML = "";
      filtered.forEach((card) => container.appendChild(createCard(card)));
      if (filtered.length === 0) {
        container.innerHTML = "<p>No books found for homepage.</p>";
      }
    } else {
      const neetCards = filtered.filter((card) => card.track === "NEET");
      const jeeCards = filtered.filter((card) => card.track === "JEE");

      const neetContainer = document.getElementById("card-container-neet");
      const jeeContainer = document.getElementById("card-container-jee");

      if (neetContainer) {
        neetContainer.innerHTML = "";
        neetCards.forEach((card) => neetContainer.appendChild(createCard(card)));
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
    if (homeContainer) homeContainer.innerHTML = "<p>Error loading materials.</p>";
    if (neetContainer) neetContainer.innerHTML = "<p>Error loading NEET materials.</p>";
    if (jeeContainer) jeeContainer.innerHTML = "<p>Error loading JEE materials.</p>";
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
      <div class="demo">Demo Available: ${card.demo === "Yes" ? "Yes" : "No"}</div>

      ${
        card.canRead && card.pdfUrl
          ? `<a href="/reader?id=${card._id}" class="btn-buy" target="_blank">📖 Read</a>`
          : `<a href="/api/payment/${card._id}" class="btn-buy">Buy Now</a>`
      }
    </div>
  `;
  return cardEl;
}
