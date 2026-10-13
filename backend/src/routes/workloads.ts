import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'
import { nanoid } from 'nanoid'
import { generateAndSaveWorkloads } from '../services/generateWorkloads.js'

interface WorkloadBody {
  disciplineId: string
  type: 'LECTURE' | 'PRACTICE'
  pairs: number
  groupIds: string[]
}

function validateWorkloadBody(body: any): string | null {
  if (!body) return 'Тело запроса обязательно'
  if (typeof body.disciplineId !== 'string' || body.disciplineId.length === 0)
    return 'disciplineId обязателен'
  if (body.type !== 'LECTURE' && body.type !== 'PRACTICE')
    return 'type должен быть LECTURE или PRACTICE'
  if (!Number.isInteger(body.pairs) || body.pairs <= 0)
    return 'pairs должен быть положительным целым числом'
  if (!Array.isArray(body.groupIds) || body.groupIds.length === 0)
    return 'groupIds должен быть непустым массивом'
  return null
}

export async function workloadsRoutes(app: FastifyInstance) {
  app.get('/workloads', async () => {
    const [workloads] = await pool.query<any[]>(
      `SELECT id, discipline_id AS disciplineId, type, pairs
         FROM workloads`
    )
    const [wg] = await pool.query<any[]>(
      'SELECT workload_id AS workloadId, group_id AS groupId FROM workload_groups'
    )

    return workloads.map((w) => ({
      ...w,
      groupIds: wg.filter((x) => x.workloadId === w.id).map((x) => x.groupId),
    }))
  })

  app.post('/workloads/generate', async () => {
    return generateAndSaveWorkloads()
  })

  app.post<{ Body: WorkloadBody }>('/workloads', async (req, reply) => {
    const error = validateWorkloadBody(req.body)
    if (error) return reply.status(400).send({ error })

    const { disciplineId, type, pairs, groupIds } = req.body

    const conn = await pool.getConnection()
    try {
      const [d] = await conn.query<any[]>(
        'SELECT id FROM disciplines WHERE id = ?',
        [disciplineId]
      )
      if (d.length === 0) {
        return reply.status(400).send({ error: 'Дисциплина не найдена' })
      }

      const placeholders = groupIds.map(() => '?').join(',')
      const [g] = await conn.query<any[]>(
        `SELECT id FROM \`groups\` WHERE id IN (${placeholders})`,
        groupIds
      )
      if (g.length !== groupIds.length) {
        return reply.status(400).send({ error: 'Одна или несколько групп не найдены' })
      }

      await conn.beginTransaction()

      const id = nanoid()
      await conn.query(
        'INSERT INTO workloads (id, discipline_id, type, pairs) VALUES (?, ?, ?, ?)',
        [id, disciplineId, type, pairs]
      )

      for (const gid of groupIds) {
        await conn.query(
          'INSERT INTO workload_groups (workload_id, group_id) VALUES (?, ?)',
          [id, gid]
        )
      }

      await conn.commit()

      return reply.status(201).send({
        id,
        disciplineId,
        type,
        pairs,
        groupIds,
      })
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  })

  app.patch<{
    Params: { id: string }
    Body: Partial<WorkloadBody>
  }>('/workloads/:id', async (req, reply) => {
    const { id } = req.params
    const body = req.body ?? {}

    const conn = await pool.getConnection()
    try {
      const [existing] = await conn.query<any[]>(
        'SELECT id FROM workloads WHERE id = ?',
        [id]
      )
      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Workload не найден' })
      }

      if (body.type !== undefined && body.type !== 'LECTURE' && body.type !== 'PRACTICE') {
        return reply.status(400).send({ error: 'type должен быть LECTURE или PRACTICE' })
      }
      if (body.pairs !== undefined && (!Number.isInteger(body.pairs) || body.pairs <= 0)) {
        return reply.status(400).send({ error: 'pairs должен быть положительным целым' })
      }

      await conn.beginTransaction()

      if (body.disciplineId !== undefined || body.type !== undefined || body.pairs !== undefined) {
        const sets: string[] = []
        const values: any[] = []
        if (body.disciplineId !== undefined) {
          sets.push('discipline_id = ?')
          values.push(body.disciplineId)
        }
        if (body.type !== undefined) {
          sets.push('type = ?')
          values.push(body.type)
        }
        if (body.pairs !== undefined) {
          sets.push('pairs = ?')
          values.push(body.pairs)
        }
        values.push(id)
        await conn.query(
          `UPDATE workloads SET ${sets.join(', ')} WHERE id = ?`,
          values
        )
      }

      if (body.groupIds !== undefined) {
        if (!Array.isArray(body.groupIds) || body.groupIds.length === 0) {
          return reply.status(400).send({ error: 'groupIds должен быть непустым массивом' })
        }

        const placeholders = body.groupIds.map(() => '?').join(',')
        const [g] = await conn.query<any[]>(
          `SELECT id FROM \`groups\` WHERE id IN (${placeholders})`,
          body.groupIds
        )
        if (g.length !== body.groupIds.length) {
          return reply.status(400).send({ error: 'Одна или несколько групп не найдены' })
        }

        await conn.query('DELETE FROM workload_groups WHERE workload_id = ?', [id])
        for (const gid of body.groupIds) {
          await conn.query(
            'INSERT INTO workload_groups (workload_id, group_id) VALUES (?, ?)',
            [id, gid]
          )
        }
      }

      await conn.commit()

      const [updated] = await pool.query<any[]>(
        'SELECT id, discipline_id AS disciplineId, type, pairs FROM workloads WHERE id = ?',
        [id]
      )
      const [wg] = await pool.query<any[]>(
        'SELECT group_id AS groupId FROM workload_groups WHERE workload_id = ?',
        [id]
      )

      return {
        ...updated[0],
        groupIds: wg.map((x) => x.groupId),
      }
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  })

  app.delete<{ Params: { id: string } }>('/workloads/:id', async (req, reply) => {
    const { id } = req.params

    const [existing] = await pool.query<any[]>(
      'SELECT id FROM workloads WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Workload не найден' })
    }

    await pool.query('DELETE FROM workloads WHERE id = ?', [id])

    return { ok: true }
  })
}