/**
 * Departments are encoded in the matric number: FH-<CODE>-<YY>-<NNNN>.
 * e.g. FH-NCC-25-0001 → NCC, FH-SWD-25-0001 → SWD.
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
  const code = departmentCode(matricNumber)
  if (!code) return ''
  return DEPARTMENTS[code] || code
}
