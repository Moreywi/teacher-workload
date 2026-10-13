import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'
import { nanoid } from 'nanoid'
import type { RowDataPacket } from 'mysql2'

interface AudienceRow extends RowDataPacket {
  id: string
  name: string
  capacity: number | null
}

interface AudienceBody {
  name: string
  capacity?: number | null
}

export async function audiencesRoutes(app: FastifyInstance) {
  app.get('/audiences', async () => {
    const [rows] = await pool.execute<AudienceRow[]>(
      `SELECT id, name, capacity
       FROM audiences
       ORDER BY name`
    )
    return rows
  })

  app.post<{ Body: AudienceBody }>('/audiences', async (req, reply) => {
    const name = req.body?.name?.trim()
    const capacity = req.body?.capacity ?? null

    if (!name) {
      return reply.status(400).send({ error: 'Название обязательно' })
    }
    if (name.length > 50) {
      return reply.status(400).send({ error: 'Название до 50 символов' })
    }
    if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
      return reply.status(400).send({ error: 'Вместимость — положительное число' })
    }

    const [existing] = await pool.execute<AudienceRow[]>(
      'SELECT id FROM audiences WHERE name = ?',
      [name]
    )
    if (existing.length > 0) {
      return reply.status(400).send({ error: 'Аудитория с таким названием уже есть' })
    }

    const id = nanoid()
    await pool.execute(
      'INSERT INTO audiences (id, name, capacity) VALUES (?, ?, ?)',
      [id, name, capacity]
    )

    return reply.status(201).send({ id, name, capacity })
  })

  app.delete<{ Params: { id: string } }>(
    '/audiences/:id',
    async (req, reply) => {
      const { id } = req.params

      const [existing] = await pool.execute<AudienceRow[]>(
        'SELECT id FROM audiences WHERE id = ?',
        [id]
      )
      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Аудитория не найдена' })
      }

      try {
        await pool.execute('DELETE FROM audiences WHERE id = ?', [id])
        return { ok: true }
      } catch (err: any) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
          return reply
            .status(400)
            .send({ error: 'Аудитория используется в расписании' })
        }
        throw err
      }
    }
  )
}