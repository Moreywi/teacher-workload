import type {
  Allocation,
  Competency,
  Teacher,
  Workload,
} from '../../shared/types'

export interface AllocationResult {
  allocations: Allocation[]
  unassigned: Workload[]
  loadByTeacher: Record<string, number>
}

export function allocate(
  workloads: Workload[],
  teachers: Teacher[],
  competencies: Competency[]
): AllocationResult {
  const qualified: Record<string, string[]> = {}
  for (const c of competencies) {
    if (!qualified[c.disciplineId]) qualified[c.disciplineId] = []
    qualified[c.disciplineId].push(c.teacherId)
  }

  const loadByTeacher: Record<string, number> = {}
  for (const t of teachers) loadByTeacher[t.id] = 0

  const allocations: Allocation[] = []
  const unassigned: Workload[] = []

  const sorted = [...workloads].sort((a, b) => {
    const ca = qualified[a.disciplineId]?.length ?? 0
    const cb = qualified[b.disciplineId]?.length ?? 0
    if (ca !== cb) return ca - cb
    return b.pairs - a.pairs
  })

  let allocCounter = 0

  for (const w of sorted) {
    const candidates = qualified[w.disciplineId] ?? []

    const eligible = candidates.filter((tid) => {
      const t = teachers.find((x) => x.id === tid)
      if (!t || t.maxPairs === null) return true
      return loadByTeacher[tid] + w.pairs <= t.maxPairs
    })

    if (eligible.length === 0) {
      unassigned.push(w)
      continue
    }

    const chosen = eligible.reduce((best, tid) =>
      loadByTeacher[tid] < loadByTeacher[best] ? tid : best
    )

    loadByTeacher[chosen] += w.pairs
    allocations.push({
      id: `a${++allocCounter}`,
      workloadId: w.id,
      teacherId: chosen,
      status: 'AUTO',
    })
  }

  return { allocations, unassigned, loadByTeacher }
}