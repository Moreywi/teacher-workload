import { describe, it, expect } from 'vitest'
import { runAllocation } from './allocate.js'

const w = (
  id: string,
  disciplineId: string,
  pairs = 18,
  type: 'LECTURE' | 'PRACTICE' = 'LECTURE'
) => ({ id, disciplineId, type, pairs })

const t = (id: string, maxPairs: number | null = null) => ({
  id,
  fullName: `Teacher ${id}`,
  maxPairs,
})

const c = (teacherId: string, disciplineId: string) => ({
  teacherId,
  disciplineId,
})

describe('runAllocation', () => {
  it('распределяет workload единственному компетентному преподавателю', () => {
    const result = runAllocation([w('w1', 'd1')], [t('t1')], [c('t1', 'd1')])

    expect(result.assignment).toEqual({ w1: 't1' })
    expect(result.unassigned).toEqual([])
  })

  it('возвращает workload в unassigned, если нет компетентных', () => {
    const result = runAllocation([w('w1', 'd1')], [t('t1')], [])

    expect(result.assignment).toEqual({})
    expect(result.unassigned).toEqual(['w1'])
  })

  it('выбирает наименее загруженного среди равных кандидатов', () => {
    const result = runAllocation(
      [w('w1', 'd1', 36), w('w2', 'd1', 18)],
      [t('t1'), t('t2')],
      [c('t1', 'd1'), c('t2', 'd1')]
    )

    expect(Object.keys(result.assignment).length).toBe(2)

    const load: Record<string, number> = { t1: 0, t2: 0 }
    for (const [wid, tid] of Object.entries(result.assignment)) {
      const wk = [w('w1', 'd1', 36), w('w2', 'd1', 18)].find((x) => x.id === wid)!
      load[tid] += wk.pairs
    }

    expect(load.t1 + load.t2).toBe(54)
    expect(Math.abs(load.t1 - load.t2)).toBeLessThanOrEqual(18)
  })

  it('делит нагрузку между двумя компетентными (Java-кейс)', () => {
    const result = runAllocation(
      [w('w1', 'java'), w('w2', 'java'), w('w3', 'java')],
      [t('syrman'), t('potorochin')],
      [c('syrman', 'java'), c('potorochin', 'java')]
    )

    expect(result.unassigned).toEqual([])
    expect(Object.keys(result.assignment).length).toBe(3)

    const counts: Record<string, number> = { syrman: 0, potorochin: 0 }
    for (const tid of Object.values(result.assignment)) {
      counts[tid]++
    }

    const sorted = [counts.syrman, counts.potorochin].sort()
    expect(sorted).toEqual([1, 2])
  })

  it('соблюдает maxPairs при выборе', () => {
    const result = runAllocation(
      [w('w1', 'd1', 18), w('w2', 'd1', 18)],
      [t('t1', 18), t('t2', null)],
      [c('t1', 'd1'), c('t2', 'd1')]
    )

    const load: Record<string, number> = { t1: 0, t2: 0 }
    for (const [wid, tid] of Object.entries(result.assignment)) {
      const wk = [w('w1', 'd1'), w('w2', 'd1')].find((x) => x.id === wid)!
      load[tid] += wk.pairs
    }

    expect(load.t1 + load.t2).toBe(36)
    expect(load.t1).toBeLessThanOrEqual(18)
    expect(load.t2).toBeLessThanOrEqual(18)
  })

  it('не назначает, если все кандидаты исчерпали maxPairs', () => {
    const result = runAllocation(
      [w('w1', 'd1', 18), w('w2', 'd1', 18)],
      [t('t1', 18)],
      [c('t1', 'd1')]
    )

    expect(Object.keys(result.assignment).length).toBe(1)
    expect(result.unassigned.length).toBe(1)
  })

  it('начинает с «узких» workload (меньше кандидатов — раньше)', () => {
    const result = runAllocation(
      [w('w1', 'd1'), w('w2', 'd2')],
      [t('t1'), t('t2')],
      [c('t1', 'd1'), c('t1', 'd2'), c('t2', 'd2')]
    )

    expect(result.unassigned).toEqual([])
    expect(result.assignment.w1).toBe('t1')
  })

  it('возвращает нулевую нагрузку для преподавателей без назначений', () => {
    const result = runAllocation(
      [w('w1', 'd1')],
      [t('t1'), t('t2')],
      [c('t1', 'd1')]
    )

    expect(result.assignment).toEqual({ w1: 't1' })
    expect(Object.values(result.assignment)).not.toContain('t2')
  })

  it('детерминирован: одинаковый вход → одинаковый выход', () => {
    const workloads = [w('w1', 'd1'), w('w2', 'd1'), w('w3', 'd2')]
    const teachers = [t('t1'), t('t2')]
    const competencies = [
      c('t1', 'd1'),
      c('t2', 'd1'),
      c('t1', 'd2'),
    ]

    const r1 = runAllocation(workloads, teachers, competencies)
    const r2 = runAllocation(workloads, teachers, competencies)

    expect(r1).toEqual(r2)
  })

  it('на пустом входе возвращает пустой результат', () => {
    const result = runAllocation([], [], [])
    expect(result.assignment).toEqual({})
    expect(result.unassigned).toEqual([])
  })
})