export function allowedMigrationKey(key) {
  return typeof key === 'string' && (
    /^sebas:2026-09-(0[1-9]|[12][0-9]|30):(desayuno|almuerzo|merienda|cena|descripciones|extras|actividades|puntajes|metricas)$/.test(key) ||
    /^sebas:2026-09-(0[1-9]|[12][0-9]|30):extra:[a-zA-Z0-9_-]+$/.test(key) ||
    ['sebas:presets', 'sebas:presets-actividad'].includes(key)
  );
}
