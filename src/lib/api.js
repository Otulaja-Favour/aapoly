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

export async function setStudentGroup(studentId, groupId) {
  return unwrap(await afribase.from('class_students').update({ group_id: groupId }).eq('id', studentId))
}

export async function findStudentByMatric(matricNumber) {
  const rows = unwrap(
    await afribase.from('class_students').select().eq('matric_number', matricNumber)
  )
  return Array.isArray(rows) ? rows[0] || null : rows || null
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

export async function createGroup({ name, project_id }) {
  const res = unwrap(await afribase.from('class_groups').insert({ name, project_id }))
  return Array.isArray(res) ? res[0] : res
}

export async function setGroupProject(groupId, projectId) {
  return unwrap(await afribase.from('class_groups').update({ project_id: projectId }).eq('id', groupId))
}
