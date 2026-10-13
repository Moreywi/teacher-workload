import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string
      email: string
      role: 'ADMIN' | 'STAFF'
      teacherId: string | null
    }
    user: {
      userId: string
      email: string
      role: 'ADMIN' | 'STAFF'
      teacherId: string | null
    }
  }
}