import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'

export async function meRoutes(app: FastifyInstance) {

  app.get('/me/workload', async (req, reply) => {
    const user = req.user

    if (!user) {
      return reply.status(401).send({ error: 'Требуется авторизация' })
    }

    if (user.role !== 'STAFF' || !user.teacherId) {
      return reply.status(403).send({
        error: 'Доступно только преподавателям',
      })
    }

    const teacherId = user.teacherId

    const [teachers] = await pool.query<any[]>(
      'SELECT id, full_name AS fullName, max_pairs AS maxPairs FROM teachers WHERE id = ?',
      [teacherId]
    )

    if (teachers.length === 0) {
      return reply.status(404).send({ error: 'Преподаватель не найден' })
    }

    const [rows] = await pool.query<any[]>(
      `SELECT
         a.id            AS allocationId,
         a.status        AS status,
         w.id            AS workloadId,
         w.type          AS type,
         w.pairs         AS pairs,
         d.id            AS disciplineId,
         d.name          AS disciplineName
       FROM allocations a
       JOIN workloads w   ON w.id = a.workload_id
       JOIN disciplines d ON d.id = w.discipline_id
       WHERE a.teacher_id = ?
       ORDER BY d.name, w.type DESC`,
      [teacherId]
    )

    const workloadIds = rows.map((r) => r.workloadId)
    const groupsByWorkload: Record<string, string[]> = {}

    if (workloadIds.length > 0) {
      const placeholders = workloadIds.map(() => '?').join(',')
      const [wg] = await pool.query<any[]>(
        `SELECT wg.workload_id AS workloadId, g.name AS groupName
         FROM workload_groups wg
         JOIN \`groups\` g ON g.id = wg.group_id
         WHERE wg.workload_id IN (${placeholders})`,
        workloadIds
      )
      for (const r of wg) {
        if (!groupsByWorkload[r.workloadId]) groupsByWorkload[r.workloadId] = []
        groupsByWorkload[r.workloadId].push(r.groupName)
      }
    }

    const items = rows.map((r) => ({
      allocationId: r.allocationId,
      workloadId: r.workloadId,
      disciplineId: r.disciplineId,
      disciplineName: r.disciplineName,
      type: r.type,
      pairs: r.pairs,
      status: r.status,
      groupNames: groupsByWorkload[r.workloadId] ?? [],
    }))

    const totalPairs = items.reduce((sum, i) => sum + i.pairs, 0)

    return {
      teacher: {
        id: teachers[0].id,
        fullName: teachers[0].fullName,
        maxPairs: teachers[0].maxPairs,
      },
      items,
      totalPairs,
      totalHours: totalPairs * 1.5,
    }
  })
}