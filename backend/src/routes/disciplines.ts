import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'
import { nanoid } from 'nanoid'

interface DisciplineBody {
  name: string
}

export async function disciplinesRoutes(app: FastifyInstance) {
  app.get('/disciplines', async () => {
    const [rows] = await pool.query<any[]>(
      'SELECT id, name FROM disciplines ORDER BY name'
    )
    return rows
  })

  app.post<{ Body: DisciplineBody }>('/disciplines', async (req, reply) => {
    const name = req.body?.name?.trim()

    if (!name) {
      return reply.status(400).send({ error: 'Название обязательно' })
    }
    if (name.length > 150) {
      return reply
        .status(400)
        .send({ error: 'Название не длиннее 150 символов' })
    }

    const [existing] = await pool.query<any[]>(
      'SELECT id FROM disciplines WHERE name = ?',
      [name]
    )
    if (existing.length > 0) {
      return reply
        .status(400)
        .send({ error: 'Дисциплина с таким названием уже существует' })
    }

    const id = nanoid()
    await pool.query('INSERT INTO disciplines (id, name) VALUES (?, ?)', [
      id,
      name,
    ])

    return reply.status(201).send({ id, name })
  })

  app.patch<{
    Params: { id: string }
    Body: DisciplineBody
  }>('/disciplines/:id', async (req, reply) => {
    const { id } = req.params
    const name = req.body?.name?.trim()

    if (!name) {
      return reply.status(400).send({ error: 'Название обязательно' })
    }
    if (name.length > 150) {
      return reply
        .status(400)
        .send({ error: 'Название не длиннее 150 символов' })
    }

    const [existing] = await pool.query<any[]>(
      'SELECT id FROM disciplines WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Дисциплина не найдена' })
    }

    const [dup] = await pool.query<any[]>(
      'SELECT id FROM disciplines WHERE name = ? AND id != ?',
      [name, id]
    )
    if (dup.length > 0) {
      return reply
        .status(400)
        .send({ error: 'Дисциплина с таким названием уже существует' })
    }

    await pool.query('UPDATE disciplines SET name = ? WHERE id = ?', [
      name,
      id,
    ])

    return { id, name }
  })

  app.delete<{ Params: { id: string } }>(
    '/disciplines/:id',
    async (req, reply) => {
      const { id } = req.params

      const [existing] = await pool.query<any[]>(
        'SELECT id FROM disciplines WHERE id = ?',
        [id]
      )
      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Дисциплина не найдена' })
      }
      await pool.query('DELETE FROM disciplines WHERE id = ?', [id])

      return { ok: true }
    }
  )
}