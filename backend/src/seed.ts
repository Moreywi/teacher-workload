import { hashPassword } from './auth/hash.js'
import { pool } from './db.js'
import { nanoid } from 'nanoid'

async function seed() {
  console.log('Seeding...')

  const conn = await pool.getConnection()
  
  try {
    await conn.beginTransaction()

    await conn.execute('DELETE FROM allocations')
    await conn.execute('DELETE FROM workload_groups')
    await conn.execute('DELETE FROM workloads')
    await conn.execute('DELETE FROM competencies')
    await conn.execute('DELETE FROM users')
    await conn.execute('DELETE FROM teachers')
    await conn.execute('DELETE FROM disciplines')
    await conn.execute('DELETE FROM `groups`')

    const groupNames = ['СИ-141', 'СИ-142']
    for (const name of groupNames) {
      await conn.execute(
        'INSERT INTO `groups` (id, name) VALUES (?, ?)',
        [nanoid(), name]
      )
    }

    const disciplineNames = [
      'Архитектуры',
      'Компьютерные сети',
      'ЭВМ',
      'БД',
      'Программирование на C',
      'Python',
      'Java',
      'C#',
      'OpenSCAD',
      'HTML',
      'Сертификация',
      'Численные методы',
      'Математика',
      'Физра',
    ]

    const disciplineIds: Record<string, string> = {}
    for (const name of disciplineNames) {
      const id = nanoid()
      await conn.execute(
        'INSERT INTO disciplines (id, name) VALUES (?, ?)',
        [id, name]
      )
      disciplineIds[name] = id
    }

    const teachersData: Array<{
      name: string
      email: string
      disciplines: string[]
    }> = [
      { name: 'Ковалёв',     email: 'kovalev@example.com',     disciplines: ['Архитектуры', 'Компьютерные сети', 'ЭВМ'] },
      { name: 'Макаров',     email: 'makarov@example.com',     disciplines: ['БД', 'Программирование на C'] },
      { name: 'Лебедева',    email: 'lebedeva@example.com',    disciplines: ['Python', 'Java'] },
      { name: 'Орлов',       email: 'orlov@example.com',       disciplines: ['C#', 'OpenSCAD'] },
      { name: 'Соколов',     email: 'sokolov@example.com',     disciplines: ['HTML', 'Java'] },
      { name: 'Виноградова', email: 'vinogradova@example.com', disciplines: ['Сертификация', 'Численные методы'] },
      { name: 'Тихонова',    email: 'tihonova@example.com',    disciplines: ['Математика'] },
      { name: 'Крылова',     email: 'krylova@example.com',     disciplines: ['Физра'] },
    ]

    for (const td of teachersData) {
      const teacherId = nanoid()
      await conn.execute(
        'INSERT INTO teachers (id, full_name) VALUES (?, ?)',
        [teacherId, td.name]
      )

      for (const discName of td.disciplines) {
        await conn.execute(
          'INSERT INTO competencies (id, teacher_id, discipline_id) VALUES (?, ?, ?)',
          [nanoid(), teacherId, disciplineIds[discName]]
        )
      }

      const passwordHash = await hashPassword('teacher123')
      await conn.execute(
        `INSERT INTO users (id, email, password_hash, role, teacher_id) 
         VALUES (?, ?, ?, 'STAFF', ?)`,
        [nanoid(), td.email, passwordHash, teacherId]
      )
    }

    const adminPasswordHash = await hashPassword('admin123')
    await conn.execute(
      `INSERT INTO users (id, email, password_hash, role) 
       VALUES (?, ?, ?, 'ADMIN')`,
      [nanoid(), 'admin@example.com', adminPasswordHash]
    )

    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

seed()
  .then(() => pool.end())
  .catch((e) => {
    console.error('Seed failed:', e)
    pool.end()
    process.exit(1)
  })