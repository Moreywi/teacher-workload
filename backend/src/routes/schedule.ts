import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'
import { nanoid } from 'nanoid'
import type { RowDataPacket } from 'mysql2'
import type { PoolConnection } from 'mysql2/promise'

interface ScheduleRow extends RowDataPacket {
  id: string
  workloadId: string
  date: string
  pairNumber: number
  audienceId: string
  teacherId: string | null
}

interface ScheduleBody {
  workloadId: string
  date: string
  pairNumber: number
  audienceId: string
  teacherId?: string | null
}

interface WorkloadInfoRow extends RowDataPacket {
  teacherId: string | null
  groupIdsStr: string | null
}

interface ConflictRow extends RowDataPacket {
  id: string
}

interface WorkloadPairsRow extends RowDataPacket {
  id: string
  pairs: number
}

interface GroupRow extends RowDataPacket {
  id: string
  name: string
}

interface GridRow extends RowDataPacket {
  id: string
  date: string
  pairNumber: number
  audienceId: string
  explicitTeacherId: string | null
  workloadId: string
  type: 'LECTURE' | 'PRACTICE'
  disciplineId: string
  disciplineName: string
  loadTeacherId: string | null
}

interface WorkloadGroupRow extends RowDataPacket {
  workloadId: string
  groupId: string
}

interface TeacherNameRow extends RowDataPacket {
  id: string
  fullName: string
}

interface AudienceNameRow extends RowDataPacket {
  id: string
  name: string
}

interface ExistingScheduleRow extends RowDataPacket {
  id: string
  workloadId: string
  date: string
  pairNumber: number
}

interface WorkloadFullRow extends RowDataPacket {
  id: string
  disciplineId: string
  type: 'LECTURE' | 'PRACTICE'
  pairs: number
}

interface AllocationRow extends RowDataPacket {
  workloadId: string
  teacherId: string
}

interface AudienceIdRow extends RowDataPacket {
  id: string
}

interface CountRow extends RowDataPacket {
  cnt: number
}

interface DisciplineNameRow extends RowDataPacket {
  id: string
  name: string
}

interface GridCell {
  id: string
  workloadId: string
  date: string
  day: number
  pair: number
  groupId: string
  disciplineName: string
  type: 'LECTURE' | 'PRACTICE'
  teacherName: string | null
  audienceId: string
  audienceName: string | null
}

interface WorkloadInput {
  workloadId: string
  disciplineId: string
  disciplineName: string
  type: 'LECTURE' | 'PRACTICE'
  groupIds: string[]
  teacherId: string | null
  pairs: number
}

async function checkConflicts(
  conn: PoolConnection,
  workloadId: string,
  date: string,
  pairNumber: number,
  excludeScheduleId: string | null = null
): Promise<string | null> {
  const [wl] = await conn.query<WorkloadInfoRow[]>(
    `SELECT a.teacher_id AS teacherId,
            (SELECT GROUP_CONCAT(wg.group_id) FROM workload_groups wg WHERE wg.workload_id = w.id) AS groupIdsStr
     FROM workloads w
     LEFT JOIN allocations a ON a.workload_id = w.id
     WHERE w.id = ?`,
    [workloadId]
  )
  if (wl.length === 0) return 'Нагрузка не найдена'

  const teacherId = wl[0].teacherId
  const groupIds = wl[0].groupIdsStr ? wl[0].groupIdsStr.split(',') : []

  const excludeClause = excludeScheduleId ? 'AND s.id != ?' : ''
  const baseParams: Array<string | number> = [date, pairNumber]
  if (excludeScheduleId) baseParams.push(excludeScheduleId)

  if (teacherId) {
    const paramsTeacher = [...baseParams, teacherId]
    const [conflict] = await conn.query<ConflictRow[]>(
      `SELECT s.id
       FROM schedule s
       JOIN workloads w ON w.id = s.workload_id
       LEFT JOIN allocations a ON a.workload_id = w.id
       WHERE s.date = ? AND s.pair_number = ?
         ${excludeClause}
         AND COALESCE(s.teacher_id, a.teacher_id) = ?
       LIMIT 1`,
      paramsTeacher
    )
    if (conflict.length > 0) return 'Преподаватель уже занят в это время'
  }

  if (groupIds.length > 0) {
    const placeholders = groupIds.map(() => '?').join(',')
    const paramsGroup = [...baseParams, ...groupIds]
    const [conflict] = await conn.query<ConflictRow[]>(
      `SELECT s.id
       FROM schedule s
       JOIN workload_groups wg ON wg.workload_id = s.workload_id
       WHERE s.date = ? AND s.pair_number = ?
         ${excludeClause}
         AND wg.group_id IN (${placeholders})
       LIMIT 1`,
      paramsGroup
    )
    if (conflict.length > 0) return 'Группа уже занята в это время'
  }

  return null
}

function buildSemesterDates(): Record<number, string[]> {
  const START = new Date('2026-09-01')
  const END = new Date('2026-12-26')
  const datesByDay: Record<number, string[]> = {}
  for (let d = 1; d <= 6; d++) datesByDay[d] = []

  const cursor = new Date(START)
  while (cursor <= END) {
    const jsDay = cursor.getDay()
    if (jsDay >= 1 && jsDay <= 6) {
      const yyyy = cursor.getFullYear()
      const mm = String(cursor.getMonth() + 1).padStart(2, '0')
      const dd = String(cursor.getDate()).padStart(2, '0')
      datesByDay[jsDay].push(`${yyyy}-${mm}-${dd}`)
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return datesByDay
}

function buildAllDatesWithWeekIndex(datesByDay: Record<number, string[]>) {
  const flat: Array<{ date: string; day: number }> = []
  for (const day of [1, 2, 3, 4, 5, 6]) {
    for (const d of datesByDay[day] ?? []) {
      flat.push({ date: d, day })
    }
  }
  flat.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const all: Array<{ date: string; day: number; weekIndex: number }> = []
  let lastMonday = ''
  let weekIndex = -1
  for (const item of flat) {
    const d = new Date(item.date + 'T00:00:00')
    const jsDay = d.getDay()
    const diff = jsDay === 0 ? -6 : 1 - jsDay
    const monday = new Date(d)
    monday.setDate(d.getDate() + diff)
    const mondayStr = monday.toISOString().slice(0, 10)
    if (mondayStr !== lastMonday) {
      lastMonday = mondayStr
      weekIndex++
    }
    all.push({ date: item.date, day: item.day, weekIndex })
  }
  return all
}
function computePairsPerWeek(pairs: number, weeks: number): number[] {
  const result = new Array(weeks).fill(0)
  if (pairs <= 0 || weeks <= 0) return result

  if (pairs <= weeks) {
    for (let i = 0; i < pairs; i++) result[i] = 1
    return result
  }

  const base = Math.floor(pairs / weeks)
  const rem = pairs % weeks
  for (let i = 0; i < weeks; i++) result[i] = base
  for (let i = 0; i < rem; i++) {
    const pos = Math.floor(((i + 1) * weeks) / (rem + 1))
    result[Math.min(pos, weeks - 1)]++
  }
  return result
}

export async function scheduleRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: {
      groupId?: string
      teacherId?: string
      from?: string
      to?: string
    }
  }>('/schedule', async (req) => {
    const user = req.user
    const { groupId, teacherId, from, to } = req.query

    const conditions: string[] = []
    const params: Array<string | number> = []

    if (user.role === 'STAFF') {
      conditions.push(`COALESCE(s.teacher_id, a.teacher_id) = ?`)
      params.push(user.teacherId ?? '')
    } else if (teacherId) {
      conditions.push(`COALESCE(s.teacher_id, a.teacher_id) = ?`)
      params.push(teacherId)
    }

    if (groupId) {
      conditions.push(
        `w.id IN (SELECT workload_id FROM workload_groups WHERE group_id = ?)`
      )
      params.push(groupId)
    }
    if (from) {
      conditions.push(`s.date >= ?`)
      params.push(from)
    }
    if (to) {
      conditions.push(`s.date <= ?`)
      params.push(to)
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows] = await pool.query<ScheduleRow[]>(
      `SELECT
         s.id,
         s.workload_id AS workloadId,
         DATE_FORMAT(s.date, '%Y-%m-%d') AS date,
         s.pair_number AS pairNumber,
         s.audience_id AS audienceId,
         s.teacher_id AS teacherId
       FROM schedule s
       JOIN workloads w ON w.id = s.workload_id
       LEFT JOIN allocations a ON a.workload_id = s.workload_id
       ${where}
       ORDER BY s.date, s.pair_number`,
      params
    )

    return rows
  })

  app.get<{
    Querystring: { weekStart?: string }
  }>('/schedule/grid', async (req) => {
    const user = req.user

    let weekStart: string
    if (req.query.weekStart) {
      weekStart = req.query.weekStart
    } else {
      const today = new Date()
      const day = today.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(today)
      monday.setDate(today.getDate() + diff)
      const yyyy = monday.getFullYear()
      const mm = String(monday.getMonth() + 1).padStart(2, '0')
      const dd = String(monday.getDate()).padStart(2, '0')
      weekStart = `${yyyy}-${mm}-${dd}`
    }

    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    const endStr = endDate.toISOString().slice(0, 10)

    const [groups] = await pool.query<GroupRow[]>(
      'SELECT id, name FROM `groups` ORDER BY name'
    )

    const [rows] = await pool.query<GridRow[]>(
      `SELECT
         s.id,
         DATE_FORMAT(s.date, '%Y-%m-%d') AS date,
         s.pair_number AS pairNumber,
         s.audience_id AS audienceId,
         s.teacher_id AS explicitTeacherId,
         w.id AS workloadId,
         w.type AS type,
         w.discipline_id AS disciplineId,
         d.name AS disciplineName,
         a.teacher_id AS loadTeacherId
       FROM schedule s
       JOIN workloads w ON w.id = s.workload_id
       JOIN disciplines d ON d.id = w.discipline_id
       LEFT JOIN allocations a ON a.workload_id = w.id
       WHERE s.date BETWEEN ? AND ?
       ORDER BY s.date, s.pair_number`,
      [weekStart, endStr]
    )

    const workloadIds = [...new Set(rows.map((r) => r.workloadId))]
    const groupsByWorkload: Record<string, string[]> = {}
    if (workloadIds.length > 0) {
      const placeholders = workloadIds.map(() => '?').join(',')
      const [wg] = await pool.query<WorkloadGroupRow[]>(
        `SELECT workload_id AS workloadId, group_id AS groupId
         FROM workload_groups
         WHERE workload_id IN (${placeholders})`,
        workloadIds
      )
      for (const r of wg) {
        if (!groupsByWorkload[r.workloadId]) groupsByWorkload[r.workloadId] = []
        groupsByWorkload[r.workloadId].push(r.groupId)
      }
    }

    const teacherIds = new Set<string>()
    for (const r of rows) {
      const tid = r.explicitTeacherId ?? r.loadTeacherId
      if (tid) teacherIds.add(tid)
    }
    const teacherNameById: Record<string, string> = {}
    if (teacherIds.size > 0) {
      const ids = [...teacherIds]
      const placeholders = ids.map(() => '?').join(',')
      const [tRows] = await pool.query<TeacherNameRow[]>(
        `SELECT id, full_name AS fullName FROM teachers WHERE id IN (${placeholders})`,
        ids
      )
      for (const t of tRows) teacherNameById[t.id] = t.fullName
    }

    const audienceIds = new Set<string>()
    for (const r of rows) audienceIds.add(r.audienceId)
    const audienceNameById: Record<string, string> = {}
    if (audienceIds.size > 0) {
      const ids = [...audienceIds]
      const placeholders = ids.map(() => '?').join(',')
      const [aRows] = await pool.query<AudienceNameRow[]>(
        `SELECT id, name FROM audiences WHERE id IN (${placeholders})`,
        ids
      )
      for (const a of aRows) audienceNameById[a.id] = a.name
    }

    const cells: GridCell[] = []
    for (const r of rows) {
      const d = new Date(r.date)
      const jsDay = d.getDay()
      const ourDay = jsDay === 0 ? 0 : jsDay

      const teacherId = r.explicitTeacherId ?? r.loadTeacherId
      const teacherName = teacherId ? teacherNameById[teacherId] ?? null : null
      const audienceName = audienceNameById[r.audienceId] ?? null
      const groupsList = groupsByWorkload[r.workloadId] ?? []

      for (const groupId of groupsList) {
        cells.push({
          id: r.id,
          workloadId: r.workloadId,
          date: r.date,
          day: ourDay,
          pair: r.pairNumber,
          groupId,
          disciplineName: r.disciplineName,
          type: r.type,
          teacherName,
          audienceId: r.audienceId,
          audienceName,
        })
      }
    }

    let filtered = cells
    if (user.role === 'STAFF' && user.teacherId) {
      const staffTeacherId = user.teacherId
      filtered = cells.filter((c) => {
        const r = rows.find((x) => x.id === c.id)
        if (!r) return false
        const tid = r.explicitTeacherId ?? r.loadTeacherId
        return tid === staffTeacherId
      })
    }

    return {
      weekStart,
      weekEnd: endStr,
      groups,
      cells: filtered,
    }
  })

  app.post<{ Body: ScheduleBody }>('/schedule', async (req, reply) => {
    if (req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Только администратор' })
    }

    const { workloadId, date, pairNumber, audienceId, teacherId } =
      req.body ?? {}

    if (!workloadId || !date || !pairNumber || !audienceId) {
      return reply.status(400).send({ error: 'Все поля обязательны' })
    }
    if (!Number.isInteger(pairNumber) || pairNumber < 1 || pairNumber > 8) {
      return reply.status(400).send({ error: 'pairNumber от 1 до 8' })
    }

    const conn = await pool.getConnection()
    try {
      const [wl] = await conn.query<WorkloadInfoRow[]>(
        'SELECT id FROM workloads WHERE id = ?',
        [workloadId]
      )
      if (wl.length === 0) {
        return reply.status(400).send({ error: 'Нагрузка не найдена' })
      }

      const [aud] = await conn.query<AudienceIdRow[]>(
        'SELECT id FROM audiences WHERE id = ?',
        [audienceId]
      )
      if (aud.length === 0) {
        return reply.status(400).send({ error: 'Аудитория не найдена' })
      }

      const conflict = await checkConflicts(conn, workloadId, date, pairNumber)
      if (conflict) {
        return reply.status(400).send({ error: conflict })
      }

      const id = nanoid()
      await conn.query(
        `INSERT INTO schedule (id, workload_id, date, pair_number, audience_id, teacher_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, workloadId, date, pairNumber, audienceId, teacherId ?? null]
      )

      return reply.status(201).send({
        id,
        workloadId,
        date,
        pairNumber,
        audienceId,
        teacherId: teacherId ?? null,
      })
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const mysqlErr = err as { code: string; message: string }
        if (mysqlErr.code === 'ER_DUP_ENTRY') {
          const msg = mysqlErr.message.includes('audience')
            ? 'Аудитория уже занята в это время'
            : 'Преподаватель уже занят в это время'
          return reply.status(400).send({ error: msg })
        }
      }
      throw err
    } finally {
      conn.release()
    }
  })

  app.patch<{
    Params: { id: string }
    Body: Partial<ScheduleBody>
  }>('/schedule/:id', async (req, reply) => {
    if (req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Только администратор' })
    }

    const { id } = req.params
    const body = req.body ?? {}

    const conn = await pool.getConnection()
    try {
      const [existing] = await conn.query<ExistingScheduleRow[]>(
        `SELECT id,
                workload_id AS workloadId,
                DATE_FORMAT(date, '%Y-%m-%d') AS date,
                pair_number AS pairNumber
         FROM schedule WHERE id = ?`,
        [id]
      )
      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Пара не найдена' })
      }

      const finalWorkloadId = body.workloadId ?? existing[0].workloadId
      const finalDate = body.date ?? existing[0].date
      const finalPairNumber = body.pairNumber ?? existing[0].pairNumber

      const conflict = await checkConflicts(
        conn,
        finalWorkloadId,
        finalDate,
        finalPairNumber,
        id
      )
      if (conflict) {
        return reply.status(400).send({ error: conflict })
      }

      const sets: string[] = []
      const values: Array<string | number | null> = []

      if (body.date !== undefined) {
        sets.push('date = ?')
        values.push(body.date)
      }
      if (body.pairNumber !== undefined) {
        sets.push('pair_number = ?')
        values.push(body.pairNumber)
      }
      if (body.audienceId !== undefined) {
        sets.push('audience_id = ?')
        values.push(body.audienceId)
      }
      if (body.workloadId !== undefined) {
        sets.push('workload_id = ?')
        values.push(body.workloadId)
      }
      if ('teacherId' in body) {
        sets.push('teacher_id = ?')
        values.push(body.teacherId ?? null)
      }

      if (sets.length === 0) {
        return reply.status(400).send({ error: 'Нет полей для обновления' })
      }

      values.push(id)

      await conn.query(
        `UPDATE schedule SET ${sets.join(', ')} WHERE id = ?`,
        values
      )

      return { ok: true }
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const mysqlErr = err as { code: string }
        if (mysqlErr.code === 'ER_DUP_ENTRY') {
          return reply.status(400).send({ error: 'Аудитория занята' })
        }
      }
      throw err
    } finally {
      conn.release()
    }
  })

  app.delete<{ Params: { id: string } }>('/schedule/:id', async (req, reply) => {
    if (req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Только администратор' })
    }

    const { id } = req.params

    const [existing] = await pool.query<ScheduleRow[]>(
      'SELECT id FROM schedule WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Пара не найдена' })
    }

    await pool.query('DELETE FROM schedule WHERE id = ?', [id])
    return { ok: true }
  })

  app.get('/schedule/generate-info', async (req, reply) => {
    if (req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Только администратор' })
    }

    const datesByDay = buildSemesterDates()
    const minWeeks = Math.min(
      ...Object.values(datesByDay).map((arr) => arr.length)
    )

    const [workloads] = await pool.query<WorkloadPairsRow[]>(
      'SELECT id, pairs FROM workloads'
    )
    const [groupsCount] = await pool.query<CountRow[]>(
      'SELECT COUNT(*) AS cnt FROM `groups`'
    )

    const totalPairs = workloads.reduce((sum, w) => sum + w.pairs, 0)

    const [groups] = await pool.query<GroupRow[]>(
      'SELECT id, name FROM `groups` ORDER BY name'
    )
    const [wgRows] = await pool.query<WorkloadGroupRow[]>(
      'SELECT workload_id AS workloadId, group_id AS groupId FROM workload_groups'
    )

    const groupWorkloads: Record<string, number> = {}
    for (const g of groups) groupWorkloads[g.id] = 0
    for (const r of wgRows) {
      if (groupWorkloads[r.groupId] !== undefined) groupWorkloads[r.groupId]++
    }

    const totalSlots = minWeeks * 6 * 6 * groupsCount[0].cnt

    return {
      startDate: '01.09.2026',
      endDate: '26.12.2026',
      weeksCount: minWeeks,
      totalWorkloads: workloads.length,
      totalGroups: groupsCount[0].cnt,
      totalPairs,
      totalSlots,
      groupWorkloads: groups.map((g) => ({
        name: g.name,
        count: groupWorkloads[g.id] ?? 0,
      })),
    }
  })

  app.post('/schedule/generate', async (req, reply) => {
    if (req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Только администратор' })
    }

    const datesByDay = buildSemesterDates()
    const allDatesWithWeek = buildAllDatesWithWeekIndex(datesByDay)
    const weeksCount =
      allDatesWithWeek.length > 0
        ? allDatesWithWeek[allDatesWithWeek.length - 1].weekIndex + 1
        : 0

    const ALL_PAIRS = [1, 2, 3, 4, 5, 6]
    const MAX_PER_DAY_HARD = 6

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query('DELETE FROM schedule')

      const [workloadsRaw] = await conn.query<WorkloadFullRow[]>(
        `SELECT id, discipline_id AS disciplineId, type, pairs FROM workloads`
      )
      const [wgRows] = await conn.query<WorkloadGroupRow[]>(
        'SELECT workload_id AS workloadId, group_id AS groupId FROM workload_groups'
      )
      const [allocs] = await conn.query<AllocationRow[]>(
        'SELECT workload_id AS workloadId, teacher_id AS teacherId FROM allocations'
      )
      const [audiences] = await conn.query<AudienceIdRow[]>(
        'SELECT id FROM audiences ORDER BY name'
      )
      const [disciplines] = await conn.query<DisciplineNameRow[]>(
        'SELECT id, name FROM disciplines'
      )

      if (audiences.length === 0) {
        return reply.status(400).send({
          error: 'Нет аудиторий. Добавьте хотя бы одну.',
        })
      }

      const disciplineNameById: Record<string, string> = {}
      for (const d of disciplines) disciplineNameById[d.id] = d.name

      const groupsByWorkload: Record<string, string[]> = {}
      for (const r of wgRows) {
        if (!groupsByWorkload[r.workloadId]) groupsByWorkload[r.workloadId] = []
        groupsByWorkload[r.workloadId].push(r.groupId)
      }

      const teacherByWorkload: Record<string, string | null> = {}
      for (const a of allocs) {
        teacherByWorkload[a.workloadId] = a.teacherId
      }

      const workloadInputs: WorkloadInput[] = workloadsRaw.map((w) => ({
        workloadId: w.id,
        disciplineId: w.disciplineId,
        disciplineName: disciplineNameById[w.disciplineId] ?? '?',
        type: w.type,
        groupIds: groupsByWorkload[w.id] ?? [],
        teacherId: teacherByWorkload[w.id] ?? null,
        pairs: w.pairs,
      }))

      workloadInputs.sort((a, b) => {
        if (a.groupIds.length !== b.groupIds.length)
          return b.groupIds.length - a.groupIds.length
        return b.pairs - a.pairs
      })

      const busyGroup: Record<string, Set<string>> = {}
      const busyTeacher: Record<string, Set<string>> = {}
      const busyAudience: Record<string, Set<string>> = {}
      const groupDateCount: Record<string, Record<string, number>> = {}

      const groupNameById: Record<string, string> = {}
      {
        const [gs] = await conn.query<GroupRow[]>(
          'SELECT id, name FROM `groups`'
        )
        for (const g of gs) groupNameById[g.id] = g.name
      }

      for (const w of workloadInputs) {
        for (const gid of w.groupIds) {
          if (!busyGroup[gid]) busyGroup[gid] = new Set()
          if (!groupDateCount[gid]) groupDateCount[gid] = {}
        }
      }

      let created = 0
      let skipped = 0
      const clipped: Array<{
        workloadId: string
        disciplineName: string
        type: 'LECTURE' | 'PRACTICE'
        groupNames: string[]
        wanted: number
        created: number
      }> = []

      for (const w of workloadInputs) {
        const totalPairs = w.pairs
        let createdForThis = 0

        const pairsPerWeek = computePairsPerWeek(totalPairs, weeksCount)

        const sum = pairsPerWeek.reduce((a, b) => a + b, 0)
        if (sum !== totalPairs) {
          let diff = totalPairs - sum
          for (let i = weeksCount - 1; i >= 0 && diff > 0; i--) {
            pairsPerWeek[i]++
            diff--
          }
        }

        for (let weekIdx = 0; weekIdx < pairsPerWeek.length; weekIdx++) {
          const needThisWeek = pairsPerWeek[weekIdx]
          if (needThisWeek === 0) continue

          const weekDates = allDatesWithWeek.filter(
            (d) => d.weekIndex === weekIdx
          )

          for (let k = 0; k < needThisWeek; k++) {
            let best: {
              date: string
              day: number
              pair: number
              audienceId: string
            } | null = null
            let bestScore = Infinity

            for (const wd of weekDates) {
              let maxDayLoad = 0
              let skipDay = false
              for (const gid of w.groupIds) {
                const cnt = groupDateCount[gid]?.[wd.date] ?? 0
                if (cnt >= MAX_PER_DAY_HARD) {
                  skipDay = true
                  break
                }
                if (cnt > maxDayLoad) maxDayLoad = cnt
              }
              if (skipDay) continue

              for (const pair of ALL_PAIRS) {
                const slotKey = `${wd.date}-${pair}`

                const groupsOk = w.groupIds.every(
                  (gid) => !busyGroup[gid]?.has(slotKey)
                )
                if (!groupsOk) continue

                if (w.teacherId && busyTeacher[w.teacherId]?.has(slotKey))
                  continue

                const audBusy = busyAudience[slotKey] ?? new Set<string>()
                if (audBusy.size >= audiences.length) continue
                const freeAud = audiences.find((a) => !audBusy.has(a.id))
                if (!freeAud) continue

                const score = maxDayLoad * 1000 + pair
                if (score < bestScore) {
                  bestScore = score
                  best = {
                    date: wd.date,
                    day: wd.day,
                    pair,
                    audienceId: freeAud.id,
                  }
                }
              }
            }

            if (!best) break

            const slotKey = `${best.date}-${best.pair}`

            for (const gid of w.groupIds) {
              if (!busyGroup[gid]) busyGroup[gid] = new Set()
              busyGroup[gid].add(slotKey)
              if (!groupDateCount[gid]) groupDateCount[gid] = {}
              groupDateCount[gid][best.date] =
                (groupDateCount[gid][best.date] ?? 0) + 1
            }
            if (w.teacherId) {
              if (!busyTeacher[w.teacherId])
                busyTeacher[w.teacherId] = new Set()
              busyTeacher[w.teacherId].add(slotKey)
            }
            if (!busyAudience[slotKey]) busyAudience[slotKey] = new Set()
            busyAudience[slotKey].add(best.audienceId)

            await conn.query(
              `INSERT INTO schedule (id, workload_id, date, pair_number, audience_id, teacher_id)
               VALUES (?, ?, ?, ?, ?, NULL)`,
              [nanoid(), w.workloadId, best.date, best.pair, best.audienceId]
            )
            created++
            createdForThis++
          }
        }

        if (createdForThis < totalPairs) {
          clipped.push({
            workloadId: w.workloadId,
            disciplineName: w.disciplineName,
            type: w.type,
            groupNames: w.groupIds.map((g) => groupNameById[g] ?? '?'),
            wanted: totalPairs,
            created: createdForThis,
          })
        } else if (createdForThis === 0 && totalPairs > 0) {
          skipped++
        }
      }

      await conn.commit()

      return {
        created,
        skipped,
        totalWorkloads: workloadInputs.length,
        clipped,
      }
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  })
}