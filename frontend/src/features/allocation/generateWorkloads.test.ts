import { describe, it, expect } from 'vitest'
import { generateWorkloads } from './generateWorkloads'
import type { Discipline, Group } from '../../shared/types'

const groups: Group[] = [
  { id: 'g1', name: 'СИ-141' },
  { id: 'g2', name: 'СИ-142' },
]

const disciplines: Discipline[] = [
  { id: 'd1', name: 'Архитектуры' },
  { id: 'd2', name: 'Физра' },
]

describe('generateWorkloads', () => {
  it('создаёт лекцию на поток + по практике на каждую группу', () => {
    const workloads = generateWorkloads([disciplines[0]], groups)

    expect(workloads).toHaveLength(3)

    const lecture = workloads.find((w) => w.type === 'LECTURE')
    expect(lecture).toBeDefined()
    expect(lecture!.groupIds).toEqual(['g1', 'g2'])

    const practices = workloads.filter((w) => w.type === 'PRACTICE')
    expect(practices).toHaveLength(2)
    expect(practices[0].groupIds).toEqual(['g1'])
    expect(practices[1].groupIds).toEqual(['g2'])
  })

  it('не создаёт лекцию для Физры (PRACTICE_ONLY)', () => {
    const workloads = generateWorkloads([disciplines[1]], groups)

    expect(workloads).toHaveLength(2)
    expect(workloads.every((w) => w.type === 'PRACTICE')).toBe(true)
  })

  it('создаёт уникальные id', () => {
    const workloads = generateWorkloads(disciplines, groups)
    const ids = workloads.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('на каждую дисциплину с лекциями — ровно (1 + кол-во групп) workload', () => {
    const workloads = generateWorkloads(disciplines, groups)
    expect(workloads).toHaveLength(5)
  })
})