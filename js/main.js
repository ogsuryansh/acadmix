document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleButton && navMenu) {
    toggleButton.addEventListener('click', () => {
      // Toggle classes
      navMenu.classList.toggle('active');
      toggleButton.classList.toggle('open');
    });

    // Optional: close menu when a link is clicked (mobile)
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
          toggleButton.classList.remove('open');
        }
      });
    });
  }
});


document.addEventListener('DOMContentLoaded', () => {
  fetch('/auth/user', { credentials: 'include' })
    .then(res => res.json())
    .then(user => {
      const joinButtons = document.querySelectorAll('.join-btn');
      const userIcons = document.querySelectorAll('.user-icon');

      if (user && user.photo) {
        // Show user's Google photo
        userIcons.forEach(icon => {
          icon.innerHTML = `<img src="${user.photo}" style="width: 35px; height: 35px; border-radius: 50%;" />`;
        });

        // Button = Logout
        joinButtons.forEach(btn => {
          btn.textContent = 'Logout';
          btn.onclick = () => {
            window.location.href = '/auth/logout';
          };
        });
      } else {
        // Not logged in → Button = Login
        joinButtons.forEach(btn => {
          btn.textContent = 'Join';
          btn.onclick = () => {
            window.location.href = '/auth/google';
          };
        });
      }
    });
});
