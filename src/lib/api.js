/**
 * Normalises an AfriBase SDK response.
 * The SDK may return either the payload directly or a `{ data, error }` envelope,
 * so we unwrap both shapes and throw on error.
 */
function unwrap(res) {
  if (res && typeof res === 'object' && ('error' in res || 'data' in res)) {
    if (res.error) {
      const message = res.error.message || res.error.error || String(res.error)
      throw new Error(message)
    }
    return res.data
  }
  return res
}

import { afribase } from './afribase'

/* ------------------------------------------------------------------ projects */

export async function listProjects() {
  return unwrap(await afribase.from('class_projects').select())
}

export async function seedProjects(projects) {
  const existing = await listProjects()
  const known = new Set((existing || []).map((p) => p.slug))
  const missing = projects.filter((p) => !known.has(p.slug))
  if (!missing.length) return existing
  const rows = missing.map(({ slug, name, description, repo_folder, difficulty, tags }) => ({
    slug,
    name,
    description,
    repo_folder,
    difficulty,
    tags
  }))
  return unwrap(await afribase.from('class_projects').insert(rows))
}

/* ------------------------------------------------------------------ students */

export async function listStudents() {
  return unwrap(await afribase.from('class_students').select())
}

export async function addStudents(students) {
  if (!students.length) return []
  return unwrap(await afribase.from('class_students').insert(students))
}

export async function deleteStudent(id) {
  return unwrap(await afribase.from('class_students').delete().eq('id', id))
}

export async function clearStudents() {
  // PostgREST requires a filter on DELETE. `neq('id', '')` breaks on uuid columns
  // (empty string can't be cast), so we use `id IS NOT NULL`, which matches all.
  return unwrap(await afribase.from('class_students').delete().not('id', 'is', null))
}

export async function assignStudentsToGroup(studentIds, groupId) {
  if (!studentIds.length) return []
  return unwrap(
    await afribase.from('class_students').update({ group_id: groupId }).in('id', studentIds)
  )
}

export async function findStudentByMatric(matricNumber) {
  const rows = unwrap(
    await afribase.from('class_students').select().eq('matric_number', matricNumber)
  )
  return Array.isArray(rows) ? rows[0] || null : rows || null
}

/** Bulk-update a field on a set of students (e.g. has_paid, certificate_approved). */
export async function updateStudents(studentIds, fields) {
  if (!studentIds.length) return []
  return unwrap(await afribase.from('class_students').update(fields).in('id', studentIds))
}

/** Toggle a single student field, e.g. has_paid. */
export async function updateStudent(id, fields) {
  return unwrap(await afribase.from('class_students').update(fields).eq('id', id))
}

/* ------------------------------------------------------------------ payments */

/**
 * Marks a list of matric numbers as paid. Used to bulk-record the paid list the
 * lecturer hands in. Unknown matrics are ignored so it never errors on typos.
 */
export async function markPaidByMatric(matricNumbers, method) {
  const clean = [...new Set(matricNumbers.map((m) => String(m).toUpperCase().trim()))].filter(Boolean)
  if (!clean.length) return []
  const all = await listStudents()
  const matched = all.filter((s) => clean.includes(s.matric_number))
  if (!matched.length) return []
  return updateStudents(
    matched.map((s) => s.id),
    { has_paid: true, payment_method: method }
  )
}

/* -------------------------------------------------------------------- groups */

export async function listGroups() {
  return unwrap(await afribase.from('class_groups').select())
}

export async function clearGroups() {
  // PostgREST requires a filter on DELETE. `neq('id', '')` breaks on uuid columns
  // (empty string can't be cast), so we use `id IS NOT NULL`, which matches all.
  return unwrap(await afribase.from('class_groups').delete().not('id', 'is', null))
}

export async function createGroups(groups) {
  if (!groups.length) return []
  return unwrap(await afribase.from('class_groups').insert(groups))
}

export async function setGroupProject(groupId, projectId) {
  return unwrap(await afribase.from('class_groups').update({ project_id: projectId }).eq('id', groupId))
}

export async function setGroupProjectApproved(groupId, approved) {
  return unwrap(
    await afribase.from('class_groups').update({ project_approved: approved }).eq('id', groupId)
  )
}

/* ----------------------------------------------------------------- attendance */

export async function listAttendance() {
  return unwrap(await afribase.from('class_attendance').select())
}

/** Sets attendance for a (student, week) row, inserting if missing. */
export async function setAttendance(studentId, week, present) {
  return unwrap(
    await afribase.from('class_attendance').upsert({ student_id: studentId, week, present }, { onConflict: 'student_id,week' })
  )
}

/* ------------------------------------------------------------------- settings */

export async function listSettings() {
  const rows = unwrap(await afribase.from('class_settings').select())
  const map = {}
  for (const { key, value } of rows || []) map[key] = value
  return map
}

export async function setSetting(key, value) {
  return unwrap(
    await afribase.from('class_settings').upsert({ key, value }, { onConflict: 'key' })
  )
}
