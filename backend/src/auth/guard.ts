import type { FastifyRequest, FastifyReply } from 'fastify'

export async function authGuard(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await req.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Требуется авторизация' })
  }
}

export function requireRole(...roles: Array<'ADMIN' | 'STAFF'>) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ error: 'Требуется авторизация' })
    }
    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({ error: 'Недостаточно прав' })
    }
  }
}