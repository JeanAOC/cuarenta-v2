const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** true si es un día real con formato AAAA-MM-DD (por ejemplo 2026-11-23). */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DAY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "2026-11-23" -> "lunes 23". Se calcula en UTC para que la zona horaria no cambie el día. */
export function dayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}`;
}
