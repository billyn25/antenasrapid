export function renderHomeContact(provinces, services, esc, { provincePath = '', locality = '' } = {}) {
  const selectedProvince = provincePath ? provinces.find(province => province.path.toLowerCase() === provincePath.toLowerCase()) : null;
  if (provincePath && !selectedProvince) throw new Error(`Provincia desconocida para la consulta: ${provincePath}`);
  const provinceOptions = [...provinces]
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    .map(province => {
      const slug = province.path.match(/^\/Antenas-([^/]+)\/$/i)?.[1].toLowerCase();
      if (!slug) throw new Error(`Provincia sin ruta válida para el formulario: ${province.name}`);
      return `<option value="${esc(slug)}"${province === selectedProvince ? ' selected' : ''}>${esc(province.name)}</option>`;
    }).join('');
  const serviceOptions = services
    .map(service => `<option value="${esc(service.id)}">${esc(service.name)}</option>`)
    .join('');
  const whatsappIcon = '<svg class="whatsapp-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.5-4.7a8.5 8.5 0 1 1 16-4.2Z"/><path d="M8.1 7.6c.2-.4.5-.4.8-.4h.4c.2 0 .3.1.4.4l.8 1.8c.1.3 0 .5-.2.7l-.6.7c.8 1.5 1.8 2.5 3.4 3.2l.7-.9c.2-.3.4-.3.7-.2l1.8.8c.3.1.4.3.4.5 0 1-.7 1.8-1.7 2-1.1.2-3-.6-4.8-2.1-1.9-1.7-3-3.7-3-5 0-.6.3-1.1.9-1.5Z" fill="currentColor" stroke="none"/></svg>';

  return `<section class="section wrap home-contact" id="contacto" aria-labelledby="home-contact-title"><div class="home-contact-layout">
<div class="home-contact-copy"><span class="eyebrow">Consulta por WhatsApp</span><h2 id="home-contact-title">Cuéntanos qué necesitas</h2><p>${locality ? 'La provincia y la localidad ya están indicadas. Elige el servicio y cuéntanos qué necesitas revisar.' : selectedProvince ? 'La provincia ya está indicada. Añade tu localidad y el servicio que necesitas para preparar la consulta.' : 'Indica tu provincia y localidad y cuéntanos qué equipo necesitas revisar. Prepararemos tu consulta para el contacto de tu zona.'}</p><noscript><p class="whatsapp-note">Para consultar por WhatsApp, utiliza el contacto de tu zona en el pie de página.</p></noscript></div>
<form class="whatsapp-form" data-whatsapp-form hidden aria-describedby="contact-privacy-note">
<div class="whatsapp-fields">
<div class="whatsapp-field"><label for="contact-province">Provincia</label><select id="contact-province" name="province" required><option value="">Elige tu provincia</option>${provinceOptions}</select></div>
<div class="whatsapp-field"><label for="contact-locality">Localidad</label><input id="contact-locality" name="locality" type="text" required maxlength="80" autocomplete="address-level2" placeholder="Tu pueblo o ciudad"${locality ? ` value="${esc(locality)}"` : ''}></div>
<div class="whatsapp-field whatsapp-field-wide"><label for="contact-service">¿Qué servicio necesitas?</label><select id="contact-service" name="service" required><option value="">Elige un servicio</option>${serviceOptions}<option value="otros">Otra consulta</option></select></div>
<fieldset class="whatsapp-reception whatsapp-field-wide" data-reception-fields hidden disabled aria-describedby="contact-reception-note"><legend>Sobre el fallo de televisión <span>(opcional)</span></legend><p class="whatsapp-reception-note" id="contact-reception-note">Si tienes cortes o pérdida de señal, estos datos ayudan a preparar la revisión.</p><div class="whatsapp-fields">
<div class="whatsapp-field"><label for="contact-channels">¿Qué canales fallan?</label><input id="contact-channels" name="channels" type="text" maxlength="120" autocomplete="off" placeholder="Canales concretos o todos"></div>
<div class="whatsapp-field"><label for="contact-timing">¿Cuándo ocurre?</label><select id="contact-timing" name="timing"><option value="">Elige una opción si lo sabes</option><option value="manana">Por la mañana</option><option value="mediodia">A mediodía</option><option value="tarde">Por la tarde</option><option value="noche">Por la noche</option><option value="sin-horario">Sin horario fijo</option><option value="siempre">Siempre</option><option value="no-lo-se">No lo sé</option></select></div>
</div></fieldset>
<div class="whatsapp-field whatsapp-field-wide"><label for="contact-message">Cuéntanos qué ocurre <span>(opcional)</span></label><textarea id="contact-message" name="message" maxlength="800" rows="4" placeholder="Qué falla, desde cuándo o qué instalación necesitas"></textarea></div>
</div>
<p class="whatsapp-status" data-contact-status role="status" aria-live="polite" aria-atomic="true"></p>
<button class="btn wa whatsapp-submit" type="submit">${whatsappIcon}<span>Continuar en WhatsApp</span></button>
<p class="whatsapp-note" id="contact-privacy-note">Se abrirá WhatsApp con tu consulta preparada. Podrás revisarla antes de enviarla. <a href="/privacidad.html">Privacidad y protección de datos</a>.</p>
</form></div></section>`;
}
