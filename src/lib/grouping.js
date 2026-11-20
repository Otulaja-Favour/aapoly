/** Fisher–Yates shuffle on a copy of the array. */
export function shuffle(input) {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Split students into groups.
 * Provide either `groupCount` (how many groups) or `groupSize` (how many per group).
 * Students are shuffled first so the split is random.
 */
export function splitIntoGroups(students, { groupCount, groupSize } = {}) {
  const pool = shuffle(students)
  if (!pool.length) return []

  let count
  if (groupCount && groupCount > 0) {
    count = Math.min(groupCount, pool.length)
  } else if (groupSize && groupSize > 0) {
    count = Math.ceil(pool.length / groupSize)
  } else {
    count = 1
  }

  const buckets = Array.from({ length: count }, () => [])
  pool.forEach((student, index) => {
    // Round-robin keeps group sizes as even as possible (max diff of 1).
    buckets[index % count].push(student)
  })
  return buckets
}

/**
 * Assign one project to every group.
 * Projects are shuffled each time; if there are more groups than projects the
 * catalogue cycles, so no group is left without a project.
 */
export function assignProjects(groupBuckets, projects) {
  if (!projects.length) {
    return groupBuckets.map((students) => ({ students, project: null }))
  }
  const pool = shuffle(projects)
  return groupBuckets.map((students, index) => ({
    students,
    project: pool[index % pool.length]
  }))
}

/** Convenience: build named, project-assigned groups ready to persist. */
export function buildGroups(students, projects, options) {
  const buckets = splitIntoGroups(students, options)
  const withProjects = assignProjects(buckets, projects)
  return withProjects.map(({ students: members, project }, index) => ({
    name: `Group ${index + 1}`,
    project,
    students: members
  }))
}
