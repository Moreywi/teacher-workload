import type { Discipline, Group, Workload } from '../../shared/types'

const LECTURE_PAIRS = 18
const PRACTICE_PAIRS = 18

const PRACTICE_ONLY = new Set(['Физра'])

export function generateWorkloads(
  disciplines: Discipline[],
  groups: Group[]
): Workload[] {
  const workloads: Workload[] = []
  let counter = 0
  const nextId = () => `w${++counter}`

  for (const d of disciplines) {
    const groupIds = groups.map((g) => g.id)

    if (!PRACTICE_ONLY.has(d.name)) {
      workloads.push({
        id: nextId(),
        disciplineId: d.id,
        type: 'LECTURE',
        pairs: LECTURE_PAIRS,
        groupIds: [...groupIds],
      })
    }

    for (const g of groups) {
      workloads.push({
        id: nextId(),
        disciplineId: d.id,
        type: 'PRACTICE',
        pairs: PRACTICE_PAIRS,
        groupIds: [g.id],
      })
    }
  }

  return workloads
}