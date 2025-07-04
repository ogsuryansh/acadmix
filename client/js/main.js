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
fetch("/api/cards")
  .then((res) => res.json())
  .then((cards) => {
    const container = document.getElementById("card-container");
    if (!cards.length) {
      container.innerHTML = "<p>No cards found</p>";
      return;
    }

    cards.forEach((card) => {
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      cardEl.innerHTML = `
            <div class="card-image">
              <img src="${card.image}" alt="${card.title}" />
              <div class="badge">${card.badge || ""}</div>
            </div>
            <div class="card-body">
              <div class="category">${card.category}</div>
              <h3 class="card-title">${card.title}</h3>
              <div class="price">
                <span class="original">₹${card.originalPrice}</span>
                <span class="discount">₹${card.discountedPrice}</span>
              </div>
              <div class="demo">${card.demo || "No Demo"}</div>
              <a href="#" class="btn-buy">Buy Now</a>
            </div>
          `;
      container.appendChild(cardEl);
    });
  })
  .catch((err) => {
    console.error("Error fetching cards:", err);
    document.getElementById("card-container").innerHTML =
      "<p>Error loading materials</p>";
  });
