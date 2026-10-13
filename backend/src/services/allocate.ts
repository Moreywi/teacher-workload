import { pool } from '../db.js'
import { nanoid } from 'nanoid'

interface WorkloadRow {
  id: string
  disciplineId: string
  type: 'LECTURE' | 'PRACTICE'
  pairs: number
}

interface TeacherRow {
  id: string
  fullName: string
  maxPairs: number | null
}

interface CompetencyRow {
  teacherId: string
  disciplineId: string
}

export interface AllocationOutput {
  assignment: Record<string, string>
  unassigned: string[]
}

export interface AllocationResult {
  allocated: number
  unassigned: number 
}

export function runAllocation(
  workloads: WorkloadRow[],
  teachers: TeacherRow[],
  competencies: CompetencyRow[]
): AllocationOutput {
  const qualified: Record<string, string[]> = {}
  for (const c of competencies) {
    ;(qualified[c.disciplineId] ??= []).push(c.teacherId)
  }

  const load: Record<string, number> = {}
  for (const t of teachers) load[t.id] = 0

  const assignment: Record<string, string> = {}
  const unassigned: string[] = []

  const sorted = [...workloads].sort((a, b) => {
    const ca = qualified[a.disciplineId]?.length ?? 0
    const cb = qualified[b.disciplineId]?.length ?? 0
    if (ca !== cb) return ca - cb
    return b.pairs - a.pairs
  })

  for (const w of sorted) {
    const candidates = qualified[w.disciplineId] ?? []

    const eligible = candidates.filter((tid) => {
      const t = teachers.find((x) => x.id === tid)
      if (!t || t.maxPairs === null) return true
      return load[tid] + w.pairs <= t.maxPairs
    })

    if (eligible.length === 0) {
      unassigned.push(w.id)
      continue
    }

    const chosen = eligible.reduce((best, tid) =>
      load[tid] < load[best] ? tid : best
    )

    load[chosen] += w.pairs
    assignment[w.id] = chosen
  }

  return { assignment, unassigned }
}

export async function runAndSaveAllocation(): Promise<AllocationResult> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [workloads] = await conn.query<any[]>(
      `SELECT id,
              discipline_id AS disciplineId,
              type,
              pairs
         FROM workloads`
    )
    const [teachers] = await conn.query<any[]>(
      'SELECT id, full_name AS fullName, max_pairs AS maxPairs FROM teachers'
    )
    const [competencies] = await conn.query<any[]>(
      'SELECT teacher_id AS teacherId, discipline_id AS disciplineId FROM competencies'
    )

    const [manualRows] = await conn.query<any[]>(
      "SELECT workload_id AS workloadId, teacher_id AS teacherId FROM allocations WHERE status = 'MANUAL'"
    )
    const manualMap = new Map<string, string>(
      manualRows.map((r) => [r.workloadId, r.teacherId])
    )
    const manualWorkloadIds = new Set(manualMap.keys())

    const autoWorkloads = workloads.filter((w) => !manualWorkloadIds.has(w.id))

    const loadAdjust: Record<string, number> = {}
    for (const w of workloads) {
      const manualTeacher = manualMap.get(w.id)
      if (manualTeacher) {
        loadAdjust[manualTeacher] = (loadAdjust[manualTeacher] ?? 0) + w.pairs
      }
    }

    const { assignment, unassigned } = runAllocation(
      autoWorkloads,
      teachers.map((t) => ({ ...t })),
      competencies
    )

    await conn.query("DELETE FROM allocations WHERE status = 'AUTO'")

    for (const [workloadId, teacherId] of Object.entries(assignment)) {
      await conn.query(
        "INSERT INTO allocations (id, workload_id, teacher_id, status) VALUES (?, ?, ?, 'AUTO')",
        [nanoid(), workloadId, teacherId]
      )
    }

    await conn.commit()

    return {
      allocated: Object.keys(assignment).length + manualMap.size,
      unassigned: unassigned.length,
    }
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}