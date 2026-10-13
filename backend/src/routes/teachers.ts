import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'
import { nanoid } from 'nanoid'
import type { RowDataPacket } from 'mysql2'
import type { PoolConnection } from 'mysql2/promise'
import { hashPassword } from '../auth/hash.js'
import { transliterate } from '../utils/transliterate.js'
import { generatePassword } from '../utils/generatePassword.js'

interface TeacherBody {
  fullName: string
  maxPairs?: number | null
}

interface TeacherRow extends RowDataPacket {
  id: string
  fullName: string
  maxPairs: number | null
  email: string | null
  initialPassword: string | null
  disciplineIdsStr: string | null
  disciplineNamesStr: string | null
}

async function generateUniqueEmail(
  conn: PoolConnection,
  base: string
): Promise<string> {
  let email = `${base}@example.com`
  let n = 1
  while (true) {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )
    if (rows.length === 0) return email
    n++
    email = `${base}${n}@example.com`
  }
}

export async function teachersRoutes(app: FastifyInstance) {
  app.get('/teachers', async () => {
    const [rows] = await pool.query<TeacherRow[]>(
      `SELECT
         t.id,
         t.full_name AS fullName,
         t.max_pairs AS maxPairs,
         u.email AS email,
         u.initial_password AS initialPassword,
         GROUP_CONCAT(c.discipline_id) AS disciplineIdsStr,
         GROUP_CONCAT(d.name SEPARATOR '||') AS disciplineNamesStr
       FROM teachers t
       LEFT JOIN users u ON u.teacher_id = t.id
       LEFT JOIN competencies c ON c.teacher_id = t.id
       LEFT JOIN disciplines d ON d.id = c.discipline_id
       GROUP BY t.id, t.full_name, t.max_pairs, u.email, u.initial_password
       ORDER BY t.full_name`
    )

    return rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      maxPairs: r.maxPairs,
      email: r.email,
      initialPassword: r.initialPassword,
      disciplineIds: r.disciplineIdsStr ? r.disciplineIdsStr.split(',') : [],
      disciplineNames: r.disciplineNamesStr
        ? r.disciplineNamesStr.split('||')
        : [],
    }))
  })

  app.post<{ Body: TeacherBody }>('/teachers', async (req, reply) => {
    const fullName = req.body?.fullName?.trim()

    if (!fullName) {
      return reply.status(400).send({ error: 'ФИО обязательно' })
    }
    if (fullName.length > 150) {
      return reply.status(400).send({ error: 'ФИО не длиннее 150 символов' })
    }

    const maxPairs = req.body.maxPairs ?? null
    if (maxPairs !== null && (!Number.isInteger(maxPairs) || maxPairs <= 0)) {
      return reply
        .status(400)
        .send({ error: 'maxPairs должен быть положительным целым или null' })
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const teacherId = nanoid()
      await conn.query(
        'INSERT INTO teachers (id, full_name, max_pairs) VALUES (?, ?, ?)',
        [teacherId, fullName, maxPairs]
      )

      const surname = fullName.split(' ')[0]
      const baseLogin = transliterate(surname) || 'teacher'
      const email = await generateUniqueEmail(conn, baseLogin)
      const password = generatePassword()
      const passwordHash = await hashPassword(password)

      await conn.query(
        `INSERT INTO users (id, email, password_hash, initial_password, role, teacher_id)
         VALUES (?, ?, ?, ?, 'STAFF', ?)`,
        [nanoid(), email, passwordHash, password, teacherId]
      )

      await conn.commit()

      return reply.status(201).send({
        id: teacherId,
        fullName,
        maxPairs,
        email,
        initialPassword: password,
        disciplineIds: [],
        disciplineNames: [],
      })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  })

  app.patch<{
    Params: { id: string }
    Body: Partial<TeacherBody>
  }>('/teachers/:id', async (req, reply) => {
    const { id } = req.params
    const body = req.body ?? {}

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM teachers WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Преподаватель не найден' })
    }

    const sets: string[] = []
    const values: Array<string | number | null> = []

    if (body.fullName !== undefined) {
      const name = body.fullName.trim()
      if (!name) {
        return reply.status(400).send({ error: 'ФИО не может быть пустым' })
      }
      if (name.length > 150) {
        return reply.status(400).send({ error: 'ФИО не длиннее 150 символов' })
      }
      sets.push('full_name = ?')
      values.push(name)
    }

    if (body.maxPairs !== undefined) {
      if (
        body.maxPairs !== null &&
        (!Number.isInteger(body.maxPairs) || body.maxPairs <= 0)
      ) {
        return reply
          .status(400)
          .send({ error: 'maxPairs должен быть положительным или null' })
      }
      sets.push('max_pairs = ?')
      values.push(body.maxPairs)
    }

    if (sets.length === 0) {
      return reply.status(400).send({ error: 'Нечего обновлять' })
    }

    values.push(id)
    await pool.query(
      `UPDATE teachers SET ${sets.join(', ')} WHERE id = ?`,
      values
    )

    const [updated] = await pool.query<TeacherRow[]>(
      `SELECT
         t.id,
         t.full_name AS fullName,
         t.max_pairs AS maxPairs,
         u.email AS email,
         u.initial_password AS initialPassword
       FROM teachers t
       LEFT JOIN users u ON u.teacher_id = t.id
       WHERE t.id = ?`,
      [id]
    )

    return updated[0]
  })

  app.put<{
    Params: { id: string }
    Body: { disciplineIds: string[] }
  }>('/teachers/:id/competencies', async (req, reply) => {
    const { id } = req.params
    const { disciplineIds } = req.body ?? {}

    if (!Array.isArray(disciplineIds)) {
      return reply
        .status(400)
        .send({ error: 'disciplineIds должен быть массивом' })
    }

    const conn = await pool.getConnection()
    try {
      const [teacher] = await conn.query<RowDataPacket[]>(
        'SELECT id FROM teachers WHERE id = ?',
        [id]
      )
      if (teacher.length === 0) {
        return reply.status(404).send({ error: 'Преподаватель не найден' })
      }

      if (disciplineIds.length > 0) {
        const placeholders = disciplineIds.map(() => '?').join(',')
        const [found] = await conn.query<RowDataPacket[]>(
          `SELECT id FROM disciplines WHERE id IN (${placeholders})`,
          disciplineIds
        )
        if (found.length !== disciplineIds.length) {
          return reply
            .status(400)
            .send({ error: 'Одна или несколько дисциплин не найдены' })
        }
      }

      await conn.beginTransaction()

      await conn.query('DELETE FROM competencies WHERE teacher_id = ?', [id])

      for (const disciplineId of disciplineIds) {
        await conn.query(
          'INSERT INTO competencies (id, teacher_id, discipline_id) VALUES (?, ?, ?)',
          [nanoid(), id, disciplineId]
        )
      }

      await conn.commit()

      return { ok: true, disciplineIds }
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  })

  app.delete<{ Params: { id: string } }>(
    '/teachers/:id',
    async (req, reply) => {
      const { id } = req.params

      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM teachers WHERE id = ?',
        [id]
      )
      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Преподаватель не найден' })
      }

      await pool.query('DELETE FROM teachers WHERE id = ?', [id])

      return { ok: true }
    }
  )
}