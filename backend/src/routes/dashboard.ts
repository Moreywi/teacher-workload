import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', async (req) => {
    const user = req.user!

    // --- Общие счётчики ---
    const [teachersCount] = await pool.query<any[]>(
      'SELECT COUNT(*) AS cnt FROM teachers'
    )
    const [disciplinesCount] = await pool.query<any[]>(
      'SELECT COUNT(*) AS cnt FROM disciplines'
    )
    const [groupsCount] = await pool.query<any[]>(
      'SELECT COUNT(*) AS cnt FROM `groups`'
    )
    const [workloadsCount] = await pool.query<any[]>(
      'SELECT COUNT(*) AS cnt, COALESCE(SUM(pairs), 0) AS totalPairs FROM workloads'
    )
    const [allocCount] = await pool.query<any[]>(
      'SELECT COUNT(*) AS cnt FROM allocations'
    )

    const totalWorkloads = workloadsCount[0].cnt
    const totalPairs = workloadsCount[0].totalPairs
    const assigned = allocCount[0].cnt
    const unassigned = totalWorkloads - assigned

    // --- Нагрузка по преподавателям ---
    const [loads] = await pool.query<any[]>(
      `SELECT
         t.id,
         t.full_name AS fullName,
         COALESCE(SUM(w.pairs), 0) AS pairs
       FROM teachers t
       LEFT JOIN allocations a ON a.teacher_id = t.id
       LEFT JOIN workloads w ON w.id = a.workload_id
       GROUP BY t.id, t.full_name
       ORDER BY pairs DESC`
    )

    const avgPairs =
      loads.length > 0
        ? Math.round(loads.reduce((s, l) => s + Number(l.pairs), 0) / loads.length)
        : 0

    const topLoaded = loads.slice(0, 3).map((l) => ({
      fullName: l.fullName,
      pairs: Number(l.pairs),
    }))

    const leastLoaded = loads
      .slice(-3)
      .reverse()
      .map((l) => ({ fullName: l.fullName, pairs: Number(l.pairs) }))

    // --- Покрытие дисциплин ---
    const [uncovered] = await pool.query<any[]>(
      `SELECT d.id, d.name
       FROM disciplines d
       WHERE NOT EXISTS (
         SELECT 1 FROM competencies c WHERE c.discipline_id = d.id
       )
       ORDER BY d.name`
    )

    let myLoad = null
    if (user.role === 'STAFF' && user.teacherId) {
      const [myItems] = await pool.query<any[]>(
        `SELECT
           COUNT(DISTINCT w.discipline_id) AS disciplinesCount,
           COALESCE(SUM(w.pairs), 0) AS totalPairs
         FROM allocations a
         JOIN workloads w ON w.id = a.workload_id
         WHERE a.teacher_id = ?`,
        [user.teacherId]
      )

      const [myTeacher] = await pool.query<any[]>(
        'SELECT full_name AS fullName, max_pairs AS maxPairs FROM teachers WHERE id = ?',
        [user.teacherId]
      )

      myLoad = {
        fullName: myTeacher[0]?.fullName ?? '',
        maxPairs: myTeacher[0]?.maxPairs ?? null,
        disciplinesCount: Number(myItems[0].disciplinesCount),
        totalPairs: Number(myItems[0].totalPairs),
        totalHours: Number(myItems[0].totalPairs) * 1.5,
      }
    }

    return {
      role: user.role,
      totals: {
        teachers: teachersCount[0].cnt,
        disciplines: disciplinesCount[0].cnt,
        groups: groupsCount[0].cnt,
        workloads: totalWorkloads,
        assigned,
        unassigned,
        totalPairs,
      },
      loadDistribution:
        user.role === 'ADMIN'
          ? {
              avgPairs,
              topLoaded,
              leastLoaded,
              allLoads: loads.map((l) => ({
                fullName: l.fullName,
                pairs: Number(l.pairs),
              })),
            }
          : null,
      uncoveredDisciplines: user.role === 'ADMIN' ? uncovered : null,
      myLoad,
    }
  })
}