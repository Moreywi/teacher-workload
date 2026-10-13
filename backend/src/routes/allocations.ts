import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'
import { runAndSaveAllocation } from '../services/allocate.js'
import { nanoid } from 'nanoid'

export async function allocationsRoutes(app: FastifyInstance) {
  app.post('/allocations/run', async () => {
    return runAndSaveAllocation()
  })

  app.get('/allocations', async () => {
    const [allocations] = await pool.query<any[]>(
      `SELECT id,
              workload_id AS workloadId,
              teacher_id AS teacherId,
              status
         FROM allocations`
    )
    const [workloads] = await pool.query<any[]>(
      `SELECT id,
              discipline_id AS disciplineId,
              type,
              pairs
         FROM workloads`
    )
    const [wg] = await pool.query<any[]>(
      'SELECT workload_id AS workloadId, group_id AS groupId FROM workload_groups'
    )
    const [teachers] = await pool.query<any[]>(
      'SELECT id, full_name AS fullName, max_pairs AS maxPairs FROM teachers ORDER BY full_name'
    )
    const [disciplines] = await pool.query<any[]>(
      'SELECT id, name FROM disciplines ORDER BY name'
    )
    const [groups] = await pool.query<any[]>(
      'SELECT id, name FROM `groups` ORDER BY name'
    )

    const [competencies] = await pool.query<any[]>(
      'SELECT teacher_id AS teacherId, discipline_id AS disciplineId FROM competencies'
    )

    const workloadsWithGroups = workloads.map((w) => ({
      ...w,
      groupIds: wg.filter((x) => x.workloadId === w.id).map((x) => x.groupId),
    }))

    const loadByTeacher: Record<string, number> = {}
    for (const t of teachers) loadByTeacher[t.id] = 0
    for (const a of allocations) {
      const w = workloadsWithGroups.find((x) => x.id === a.workloadId)
      if (w) loadByTeacher[a.teacherId] += w.pairs
    }

    const assignedWorkloadIds = new Set(allocations.map((a) => a.workloadId))
    const unassigned = workloadsWithGroups.filter(
      (w) => !assignedWorkloadIds.has(w.id)
    )

    return {
      allocations,
      workloads: workloadsWithGroups,
      unassigned,
      loadByTeacher,
      teachers,
      disciplines,
      groups,
      competencies
    }
  })

  app.patch<{
    Params: { workloadId: string }
    Body: { teacherId: string }
  }>('/allocations/:workloadId', async (req, reply) => {
    const { workloadId } = req.params
    const { teacherId } = req.body

    if (!teacherId) {
      return reply.status(400).send({ error: 'teacherId is required' })
    }

    const [existing] = await pool.query<any[]>(
      'SELECT id FROM allocations WHERE workload_id = ?',
      [workloadId]
    )

    if (existing.length > 0) {
      await pool.query(
        "UPDATE allocations SET teacher_id = ?, status = 'MANUAL' WHERE workload_id = ?",
        [teacherId, workloadId]
      )
    } else {
      await pool.query(
        "INSERT INTO allocations (id, workload_id, teacher_id, status) VALUES (?, ?, ?, 'MANUAL')",
        [nanoid(), workloadId, teacherId]
      )
    }

    return { ok: true }
  })

  app.delete('/allocations/manual', async () => {
    await pool.query("DELETE FROM allocations WHERE status = 'MANUAL'")
    return runAndSaveAllocation()
  })
}