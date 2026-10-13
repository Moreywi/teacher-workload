import { describe, it, expect } from 'vitest'
import { allocate } from './allocate'
import type {
  Competency,
  Teacher,
  Workload,
} from '../../shared/types'

const w = (
  id: string,
  disciplineId: string,
  pairs = 18,
  type: Workload['type'] = 'LECTURE'
): Workload => ({
  id,
  disciplineId,
  type,
  pairs,
  groupIds: ['g1'],
})

const t = (id: string, maxPairs: number | null = null): Teacher => ({
  id,
  fullName: `Teacher ${id}`,
  maxPairs,
})

const c = (teacherId: string, disciplineId: string): Competency => ({
  teacherId,
  disciplineId,
})

describe('allocate', () => {
  it('распределяет workload единственному компетентному преподавателю', () => {
    const result = allocate(
      [w('w1', 'd1')],
      [t('t1')],
      [c('t1', 'd1')]
    )

    expect(result.allocations).toHaveLength(1)
    expect(result.allocations[0].teacherId).toBe('t1')
    expect(result.unassigned).toHaveLength(0)
    expect(result.loadByTeacher.t1).toBe(18)
  })

  it('возвращает workload в unassigned, если нет компетентных', () => {
    const result = allocate(
      [w('w1', 'd1')],
      [t('t1')],
      []
    )

    expect(result.allocations).toHaveLength(0)
    expect(result.unassigned).toHaveLength(1)
    expect(result.unassigned[0].id).toBe('w1')
  })

  it('выбирает наименее загруженного среди равных кандидатов', () => {
    const result = allocate(
      [w('w1', 'd1', 36), w('w2', 'd1', 18)],
      [t('t1'), t('t2')],
      [c('t1', 'd1'), c('t2', 'd1')]
    )

    const t1Load = result.loadByTeacher.t1
    const t2Load = result.loadByTeacher.t2

    expect(t1Load + t2Load).toBe(54)
    expect(Math.abs(t1Load - t2Load)).toBeLessThanOrEqual(18)
  })

  it('делит нагрузку между двумя компетентными (Java-кейс)', () => {
    const workloads = [
      w('w1', 'java'),
      w('w2', 'java'),
      w('w3', 'java'),
    ]
    const result = allocate(
      workloads,
      [t('syrman'), t('potorochin')],
      [c('syrman', 'java'), c('potorochin', 'java')]
    )

    expect(result.unassigned).toHaveLength(0)
    expect(result.allocations).toHaveLength(3)

    const loads = [
      result.loadByTeacher.syrman,
      result.loadByTeacher.potorochin,
    ].sort((a, b) => a - b)

    expect(loads).toEqual([18, 36])
  })

    it('соблюдает maxPairs при выборе', () => {
    const result = allocate(
        [w('w1', 'd1', 18), w('w2', 'd1', 18)],
        [t('t1', 18), t('t2', null)],
        [c('t1', 'd1'), c('t2', 'd1')]
    )

    expect(result.loadByTeacher.t1 + result.loadByTeacher.t2).toBe(36)
    expect(result.loadByTeacher.t1).toBeLessThanOrEqual(18)
    expect(result.loadByTeacher.t2).toBeLessThanOrEqual(18)
    })

  it('не назначает, если все кандидаты исчерпали maxPairs', () => {
    const result = allocate(
      [w('w1', 'd1', 18), w('w2', 'd1', 18)],
      [t('t1', 18)], 
      [c('t1', 'd1')]
    )

    expect(result.allocations).toHaveLength(1)
    expect(result.unassigned).toHaveLength(1)
    expect(result.loadByTeacher.t1).toBe(18)
  })

  it('начинает с «узких» workload (меньше кандидатов — раньше)', () => {
    const workloads = [w('w1', 'd1'), w('w2', 'd2')]
    const result = allocate(
      workloads,
      [t('t1'), t('t2')],
      [c('t1', 'd1'), c('t1', 'd2'), c('t2', 'd2')]
    )

    expect(result.unassigned).toHaveLength(0)
    const w1 = result.allocations.find((a) => a.workloadId === 'w1')
    expect(w1?.teacherId).toBe('t1')
  })

  it('возвращает нулевую нагрузку для преподавателей без назначений', () => {
    const result = allocate(
      [w('w1', 'd1')],
      [t('t1'), t('t2')],
      [c('t1', 'd1')]
    )

    expect(result.loadByTeacher.t1).toBe(18)
    expect(result.loadByTeacher.t2).toBe(0)
  })

  it('детерминирован: одинаковый вход → одинаковый выход', () => {
    const workloads = [w('w1', 'd1'), w('w2', 'd1'), w('w3', 'd2')]
    const teachers = [t('t1'), t('t2')]
    const competencies = [
      c('t1', 'd1'),
      c('t2', 'd1'),
      c('t1', 'd2'),
    ]

    const r1 = allocate(workloads, teachers, competencies)
    const r2 = allocate(workloads, teachers, competencies)

    expect(r1.allocations).toEqual(r2.allocations)
    expect(r1.unassigned).toEqual(r2.unassigned)
    expect(r1.loadByTeacher).toEqual(r2.loadByTeacher)
  })

  it('на пустом входе возвращает пустой результат', () => {
    const result = allocate([], [], [])
    expect(result.allocations).toEqual([])
    expect(result.unassigned).toEqual([])
    expect(result.loadByTeacher).toEqual({})
  })
})