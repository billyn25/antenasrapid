// Redacción común aprobada. No recortar para encajar un contador de caracteres.
export const SERVICE_STATEMENT = 'Técnico en instalación, reparación y mantenimiento de antenas, porteros automáticos y videoporteros';

export function localMetadata(page, site) {
  const scope = page.type === 'home' ? 'Antenas en Bizkaia' : `${page.type === 'town' ? 'Antenista' : 'Antenistas'} en ${page.name}`;
  return {
    title: page.title,
    description: `${scope}. ${site.phone}. ${SERVICE_STATEMENT}.`,
    heading: page.type === 'town' ? `Antenista en ${page.name}` : page.heading,
    statement: SERVICE_STATEMENT
  };
}
