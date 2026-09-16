// Mismo logotipo del cliente, sin redibujar ni duplicar el nombre.
// El filtro de presentación aclara la antena oscura a plata y conserva
// el blanco y el rojo. No depende de JavaScript ni cambia el canal alfa.
export function brandMark() {
  return '<svg class="brand-filter" width="0" height="0" aria-hidden="true" focusable="false"><defs><filter id="rapid-logo-contrast" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.179 0.171 0 0 0.65 -0.821 1.171 0 0 0.65 -0.753 0.753 0.35 0 0.65 0 0 0 1 0"/></filter></defs></svg><img class="rapid-brand-logo" src="/assets/logo-antenasrapid.webp" width="384" height="128" alt="Antenas Rapid" decoding="async" fetchpriority="high">';
}
