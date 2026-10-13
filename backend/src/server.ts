import Fastify from 'fastify'
import 'dotenv/config'
import fastifyJwt from '@fastify/jwt'
import { checkConnection } from './db.js'
import { authGuard } from './auth/guard.js'
import { meRoutes } from './routes/me.js'
import { authRoutes } from './routes/auth.js'
import { teachersRoutes } from './routes/teachers.js'
import { disciplinesRoutes } from './routes/disciplines.js'
import { groupsRoutes } from './routes/groups.js'
import { workloadsRoutes } from './routes/workloads.js'
import { allocationsRoutes } from './routes/allocations.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { audiencesRoutes } from './routes/audiences.js'
import { scheduleRoutes } from './routes/schedule.js'
const app = Fastify({ logger: true })

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
})

app.addHook('onRequest', async (req, reply) => {
  reply.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  reply.header('Access-Control-Allow-Credentials', 'true')
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  reply.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    return reply.status(204).send()
  }
})

app.get('/', async () => ({
  name: 'Teacher Load API',
  version: '1.0.0',
  endpoints: [
    'POST   /auth/login',
    'GET    /auth/me',
    'GET    /health',
    'GET    /teachers',
    'GET    /disciplines',
    'GET    /groups',
    'GET    /workloads',
    'POST   /workloads/generate',
    'GET    /allocations',
    'POST   /allocations/run',
    'PATCH  /allocations/:workloadId',
    'DELETE /allocations/manual',
  ],
}))

app.get('/health', async () => ({ status: 'ok' }))

await app.register(authRoutes)


await app.register(async (protectedApp) => {
  protectedApp.addHook('onRequest', authGuard)

  await protectedApp.register(dashboardRoutes)
  await protectedApp.register(meRoutes)
  await protectedApp.register(teachersRoutes)
  await protectedApp.register(disciplinesRoutes)
  await protectedApp.register(groupsRoutes)
  await protectedApp.register(workloadsRoutes)
  await protectedApp.register(allocationsRoutes)
  await protectedApp.register(audiencesRoutes)
  await protectedApp.register(scheduleRoutes)
})

async function start() {
  try {
    await checkConnection()
    const port = Number(process.env.PORT ?? 3000)
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Backend: http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()