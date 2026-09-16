// Logotipo oficial facilitado por el cliente.
// Se sirve como WebP optimizado y con fondo integrado #222327 para evitar
// bordes/zonas transparentes visibles en la cabecera oscura.
export function brandMark() {
  return '<img class="rapid-brand-logo" src="/assets/logo-antenasrapid.webp" width="700" height="200" alt="Antenas Rapid"><style>.brand:has(.rapid-brand-logo)>span{display:none}.rapid-brand-logo{display:block;width:clamp(190px,24vw,300px);height:auto;object-fit:contain}.brand{min-width:0}@media(max-width:760px){.rapid-brand-logo{width:clamp(175px,46vw,245px)}}@media(max-width:480px){.rapid-brand-logo{width:clamp(155px,48vw,210px)}}</style>';
}
