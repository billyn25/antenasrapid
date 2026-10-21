(() => {
  // Interacción de interfaz y aviso informativo de privacidad. Sin analítica ni publicidad.
  const normalize = value => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const head = document.querySelector('.head');
  const menuToggle = head?.querySelector('.menu-toggle');
  const menu = menuToggle && document.getElementById(menuToggle.getAttribute('aria-controls'));
  if (menu && menuToggle) {
    const mobileMenu = window.matchMedia('(max-width:1000px)');
    const label = menuToggle.querySelector('.menu-toggle-label');
    const setMenuOpen = open => {
      menu.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      label.textContent = open ? 'Cerrar' : 'Menú';
    };
    // Sin JavaScript los enlaces permanecen visibles.
    head.classList.add('menu-ready');
    menuToggle.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link || !mobileMenu.matches) return;
      setMenuOpen(false);
      if (link.hash && link.pathname === window.location.pathname) {
        const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
        if (target) {
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
            target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
          }
          target.focus({ preventScroll: true });
        }
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || menuToggle.getAttribute('aria-expanded') !== 'true') return;
      setMenuOpen(false);
      menuToggle.focus();
    });
    document.addEventListener('click', event => {
      if (mobileMenu.matches && !head.contains(event.target)) setMenuOpen(false);
    });
    mobileMenu.addEventListener('change', () => setMenuOpen(false));
  }

  for (const block of document.querySelectorAll('[data-locality-search]')) {
    const input = block.querySelector('input');
    const groups = [...block.querySelectorAll('[data-letter-group]')];
    const count = block.querySelector('[role="status"]');
    const filter = () => {
      const term = normalize(input.value.trim());
      let visible = 0;
      for (const group of groups) {
        let matches = 0;
        for (const item of group.querySelectorAll('[data-town]')) {
          item.hidden = !normalize(item.dataset.town).includes(term);
          if (!item.hidden) {
            matches++;
            visible++;
          }
        }
        group.hidden = matches === 0;
      }
      count.textContent = visible
        ? `${visible} localidades en esta selección`
        : 'Sin coincidencias en esta selección. Consulta por teléfono tu localidad.';
    };
    input.addEventListener('input', filter);
    block.querySelectorAll('.alphabet a').forEach(a => a.addEventListener('click', () => {
      input.value = '';
      filter();
    }));
    filter();
  }

  const privacyKey = 'antenasrapid-cookie-info-v1';
  const notice = document.querySelector('[data-cookie-notice]');
  if (notice) {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(privacyKey) === 'hidden';
    } catch {}
    if (!dismissed) notice.hidden = false;

    const dismiss = notice.querySelector('[data-cookie-dismiss]');
    if (dismiss) {
      dismiss.addEventListener('click', () => {
        notice.hidden = true;
        try {
          localStorage.setItem(privacyKey, 'hidden');
        } catch {}
      });
    }
  }
})();
