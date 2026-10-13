import { describe, it, expect } from 'vitest'
import { buildWorkloads } from './generateWorkloads.js'

const groups = [
  { id: 'g1', name: 'СИ-141' },
  { id: 'g2', name: 'СИ-142' },
]

const disciplines = [
  { id: 'd1', name: 'Архитектуры' },
  { id: 'd2', name: 'Физра' },
]

describe('buildWorkloads', () => {
  it('создаёт лекцию на поток + по практике на каждую группу', () => {
    const workloads = buildWorkloads([disciplines[0]], groups)

    expect(workloads).toHaveLength(3)

    const lecture = workloads.find((w) => w.type === 'LECTURE')!
    expect(lecture.groupIds).toEqual(['g1', 'g2'])

    const practices = workloads.filter((w) => w.type === 'PRACTICE')
    expect(practices).toHaveLength(2)
    expect(practices[0].groupIds).toEqual(['g1'])
    expect(practices[1].groupIds).toEqual(['g2'])
  })

  it('не создаёт лекцию для Физры (PRACTICE_ONLY)', () => {
    const workloads = buildWorkloads([disciplines[1]], groups)

    expect(workloads).toHaveLength(2)
    expect(workloads.every((w) => w.type === 'PRACTICE')).toBe(true)
  })

  it('создаёт уникальные id', () => {
    const workloads = buildWorkloads(disciplines, groups)
    const ids = workloads.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('на 2 дисциплины (одна с лекциями) даёт 5 workload', () => {
    const workloads = buildWorkloads(disciplines, groups)
    expect(workloads).toHaveLength(5)
  })

  it('устанавливает LECTURE_PAIRS=18 и PRACTICE_PAIRS=18', () => {
    const workloads = buildWorkloads(disciplines, groups)
    for (const w of workloads) {
      expect(w.pairs).toBe(18)
    }
  })
})