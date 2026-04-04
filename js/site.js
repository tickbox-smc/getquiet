// Hamburger nav toggle
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.nav-hamburger');
  const nav = document.querySelector('.nav');

  if (!hamburger) return;

  hamburger.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('nav-open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a link is clicked
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('nav-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
});
