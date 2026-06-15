(async () => {
  const targets = document.querySelectorAll('[data-include]');
  for (const el of targets) {
    const file = el.getAttribute('data-include');
    const res = await fetch(file);
    const content = await res.text();
    el.outerHTML = content;
  }

  // Initialize Main Template logic after loading partials
  if (typeof window.initMainTemplate === 'function') {
    window.initMainTemplate();
  }

  // Aktif menü işaretleme
  const current = location.pathname.split('/').pop();
  document.querySelectorAll('a[href]').forEach(a => {
    if (a.getAttribute('href') === current) {
      a.classList.add('active');
      a.closest('.menu-item')?.classList.add('active');
      // Parent menü varsa onu da aç
      a.closest('.menu-item.menu-toggle')?.parentNode.closest('.menu-item')?.classList.add('open');
      a.closest('ul.menu-sub')?.closest('.menu-item')?.classList.add('open');
    }
  });
})();
