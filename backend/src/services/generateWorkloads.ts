import { pool } from '../db.js'
import { nanoid } from 'nanoid'

const LECTURE_PAIRS = 18
const PRACTICE_PAIRS = 18
const PRACTICE_ONLY = new Set(['Физра'])

export interface GeneratedWorkload {
  id: string
  disciplineId: string
  type: 'LECTURE' | 'PRACTICE'
  pairs: number
  groupIds: string[]
}

export function buildWorkloads(
  disciplines: { id: string; name: string }[],
  groups: { id: string; name: string }[]
): GeneratedWorkload[] {
  const workloads: GeneratedWorkload[] = []

  for (const d of disciplines) {
    const groupIds = groups.map((g) => g.id)

    if (!PRACTICE_ONLY.has(d.name)) {
      workloads.push({
        id: nanoid(),
        disciplineId: d.id,
        type: 'LECTURE',
        pairs: LECTURE_PAIRS,
        groupIds: [...groupIds],
      })
    }

    for (const g of groups) {
      workloads.push({
        id: nanoid(),
        disciplineId: d.id,
        type: 'PRACTICE',
        pairs: PRACTICE_PAIRS,
        groupIds: [g.id],
      })
    }
  }

  return workloads
}

export async function generateAndSaveWorkloads(): Promise<{
  created: number
}> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [disciplines] = await conn.query<any[]>(
      'SELECT id, name FROM disciplines'
    )
    const [groups] = await conn.query<any[]>(
      'SELECT id, name FROM `groups`'
    )

    const workloads = buildWorkloads(disciplines, groups)

    await conn.query('DELETE FROM allocations')
    await conn.query('DELETE FROM workload_groups')
    await conn.query('DELETE FROM workloads')

    for (const w of workloads) {
      await conn.query(
        'INSERT INTO workloads (id, discipline_id, type, pairs) VALUES (?, ?, ?, ?)',
        [w.id, w.disciplineId, w.type, w.pairs]
      )
      for (const gid of w.groupIds) {
        await conn.query(
          'INSERT INTO workload_groups (workload_id, group_id) VALUES (?, ?)',
          [w.id, gid]
        )
      }
    }

    await conn.commit()
    return { created: workloads.length }
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}