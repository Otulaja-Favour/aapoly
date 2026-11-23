/**
 * Departments are encoded in the matric number.
 * ND format: FH-<CODE>-<YY>-<NNNN>  (e.g. FH-NCC-25-0001 → NCC)
 * HND format: HND<YY>-01-04-<NNNN>  (last-year Software & Web Development)
 */
export const DEPARTMENTS = {
  NCC: 'Networking and Cloud Computing',
  SWD: 'Software and Web Development'
}

/** The department code inside a matric number, e.g. FH-NCC-25-0001 → "NCC". */
export function departmentCode(matricNumber) {
  const parts = String(matricNumber || '').split('-')
  return parts.length > 1 ? (parts[1] || '').toUpperCase() : ''
}

/** Full department name for a matric number, falling back to the raw code. */
export function departmentFromMatric(matricNumber) {
  const m = String(matricNumber || '')
  // HND last-year cohort (HND24-01-04-XXXX) all read Software & Web Development.
  if (m.toUpperCase().startsWith('HND')) return DEPARTMENTS.SWD
  const code = departmentCode(m)
  if (!code) return ''
  return DEPARTMENTS[code] || code
}

/** True for the graduating (last-year) HND cohort. */
export function isLastYear(matricNumber) {
  return String(matricNumber || '').toUpperCase().startsWith('HND')
}

/** Natural ascending order keeps numeric matric segments in numeric order. */
export function compareMatricNumbers(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  })
}
