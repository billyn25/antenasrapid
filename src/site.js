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

  for (const network of document.querySelectorAll('[data-footer-network]')) {
    const compactFooter = window.matchMedia('(max-width:640px)');
    // El HTML mantiene todos los destinos abiertos cuando no hay JavaScript.
    const fitNetwork = () => { network.open = !compactFooter.matches; };
    fitNetwork();
    compactFooter.addEventListener('change', fitNetwork);
  }

  const contactForm = document.querySelector('[data-whatsapp-form]');
  if (contactForm) {
    const province = contactForm.elements.namedItem('province');
    const locality = contactForm.elements.namedItem('locality');
    const service = contactForm.elements.namedItem('service');
    const message = contactForm.elements.namedItem('message');
    const status = contactForm.querySelector('[data-contact-status]');
    if (province && locality && service && message && status) {
      const optionNames = select => new Map([...select.options]
        .filter(option => option.value && !option.disabled)
        .map(option => [option.value, option.textContent.trim()]));
      const provinceNames = optionNames(province);
      const serviceNames = optionNames(service);
      const centralProvinces = new Set(['madrid', 'toledo', 'guadalajara']);
      const zoneName = () => centralProvinces.has(province.value)
        ? 'Madrid, Guadalajara y Toledo'
        : 'Zona norte y Castilla y León';
      const setStatus = (text, error = false) => {
        status.textContent = text;
        status.classList.toggle('is-error', error);
      };
      const destinationForProvince = () => {
        if (!provinceNames.has(province.value)) return null;
        const region = [...document.querySelectorAll('footer .regional-contact')]
          .find(card => card.querySelector('strong')?.textContent.trim() === zoneName());
        const href = region?.querySelector('.regional-whatsapp')?.getAttribute('href');
        if (!href) return null;
        try {
          const destination = new URL(href);
          if (destination.origin !== 'https://wa.me' || destination.username || destination.password || !/^\/\d{10,15}$/.test(destination.pathname)) return null;
          destination.search = '';
          destination.hash = '';
          return destination;
        } catch {
          return null;
        }
      };
      const updateZoneStatus = () => {
        if (!province.value) return setStatus('');
        if (!provinceNames.has(province.value)) return setStatus('Elige una provincia de la lista.', true);
        if (!destinationForProvince()) return setStatus('No se ha podido preparar el contacto. Utiliza el WhatsApp de tu zona en el pie de página.', true);
        const destinationLabel = centralProvinces.has(province.value) ? zoneName() : 'la zona norte y Castilla y León';
        setStatus(`Tu consulta irá al equipo de ${destinationLabel}.`);
      };
      const validateLocality = () => locality.setCustomValidity(
        locality.value && !locality.value.trim() ? 'Escribe tu localidad, sin dejar solo espacios.' : ''
      );
      province.addEventListener('change', updateZoneStatus);
      locality.addEventListener('input', validateLocality);
      service.addEventListener('change', updateZoneStatus);

      for (const link of document.querySelectorAll('[data-contact-service]')) {
        link.addEventListener('click', event => {
          if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const selected = link.getAttribute('data-contact-service');
          if (!serviceNames.has(selected)) {
            event.preventDefault();
            setStatus('Elige un servicio de la lista para preparar tu consulta.', true);
            service.focus();
            return;
          }
          service.value = selected;
          updateZoneStatus();
          const nextField = !provinceNames.has(province.value) ? province : !locality.value.trim() ? locality : message;
          // El enlace lleva a #contacto; después acercamos el foco al campo pendiente.
          window.requestAnimationFrame(() => nextField.focus({ preventScroll: true }));
        });
      }

      contactForm.addEventListener('submit', event => {
        event.preventDefault();
        validateLocality();
        if (!contactForm.reportValidity()) return;
        if (!provinceNames.has(province.value)) {
          setStatus('Elige una provincia de la lista.', true);
          province.focus();
          return;
        }
        if (!serviceNames.has(service.value)) {
          setStatus('Elige un servicio de la lista.', true);
          service.focus();
          return;
        }
        const destination = destinationForProvince();
        if (!destination) {
          setStatus('No se ha podido preparar el contacto. Utiliza el WhatsApp de tu zona en el pie de página.', true);
          return;
        }
        const details = message.value.trim();
        const lines = [
          'Hola, quiero hacer una consulta a Antenas Rapid.',
          `Provincia: ${provinceNames.get(province.value)}`,
          `Localidad: ${locality.value.trim()}`,
          `Servicio: ${serviceNames.get(service.value)}`,
          ...(details ? [`Detalles: ${details}`] : [])
        ];
        destination.searchParams.set('text', lines.join('\n'));
        setStatus('Abriendo WhatsApp con tu consulta preparada…');
        window.location.assign(destination.href);
      });
      validateLocality();
      updateZoneStatus();
      contactForm.hidden = false;
    }
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
