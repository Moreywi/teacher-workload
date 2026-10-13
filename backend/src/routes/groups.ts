import type { FastifyInstance } from 'fastify'
import { pool } from '../db.js'

export async function groupsRoutes(app: FastifyInstance) {
  app.get('/groups', async () => {
    const [rows] = await pool.query<any[]>(
      'SELECT id, name FROM `groups` ORDER BY name'
    )
    return rows
  })
}