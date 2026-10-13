import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'
import { hashPassword, verifyPassword } from '../auth/hash.js'
import { RowDataPacket } from 'mysql2'

export async function authRoutes(app: FastifyInstance) {
  app.post<{
    Body: { email: string; password: string }
  }>('/auth/login', async (req, reply) => {
    const { email, password } = req.body ?? {}

    if (!email || !password) {
      return reply.status(400).send({ error: 'email и password обязательны' })
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, email, password_hash AS passwordHash, role, teacher_id AS teacherId
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    )

    if (rows.length === 0) {
      return reply.status(401).send({ error: 'Неверный email или пароль' })
    }

    const user = rows[0]

    const valid = await verifyPassword(user.passwordHash, password)
    if (!valid) {
      return reply.status(401).send({ error: 'Неверный email или пароль' })
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      teacherId: user.teacherId,
    }
    const token = app.jwt.sign(payload)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
      },
    }
  })

  app.get('/auth/me', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Требуется авторизация' })
    }

    const { userId, email, role, teacherId } = req.user
    return { id: userId, email, role, teacherId }
  })

    app.post<{
    Body: { oldPassword?: string; newPassword?: string }
  }>('/auth/change-password', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Требуется авторизация' })
    }

    const { oldPassword, newPassword } = req.body ?? {}

    if (!oldPassword || !newPassword) {
      return reply.status(400).send({ error: 'Оба поля обязательны' })
    }
    if (newPassword.length < 6) {
      return reply.status(400).send({ error: 'Пароль минимум 6 символов' })
    }

    const userId = req.user.userId

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT password_hash AS passwordHash FROM users WHERE id = ?',
      [userId]
    )
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Пользователь не найден' })
    }

    const valid = await verifyPassword(
      rows[0].passwordHash as string,
      oldPassword
    )
    if (!valid) {
      return reply.status(400).send({ error: 'Неверный текущий пароль' })
    }

    const newHash = await hashPassword(newPassword)
    await pool.query(
      'UPDATE users SET password_hash = ?, initial_password = ? WHERE id = ?',
      [newHash, newPassword, userId]
    )

    return { ok: true }
  })
}