(function () {
  const menu = document.getElementById('navHeaderMenu');
  const toggle = document.querySelector('.nav-header__toggle');
  const header = document.querySelector('.nav-header');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  }

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (header && menu && !header.contains(e.target) && menu.classList.contains('active')) {
      menu.classList.remove('active');
    }
  });

  // Close on link click + set active link
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-header__link').forEach(link => {
      link.addEventListener('click', () => menu && menu.classList.remove('active'));
    });

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-header__link').forEach(link => {
      if (link.getAttribute('href') === currentPage) link.classList.add('active');
    });
  });
})();
