import type {
  Teacher,
  Discipline,
  Group,
  Competency,
  Workload,
  Allocation,
} from '../shared/types'

export const mockGroups: Group[] = [
  { id: 'g1', name: 'СИ-141' },
  { id: 'g2', name: 'СИ-142' },
]

export const mockTeachers: Teacher[] = [
  { id: 't1', fullName: 'Кощеев', maxPairs: null },
  { id: 't2', fullName: 'Каюров', maxPairs: null },
  { id: 't3', fullName: 'Сырман', maxPairs: null },
  { id: 't4', fullName: 'Касаткин', maxPairs: null },
  { id: 't5', fullName: 'Поторочин', maxPairs: null },
  { id: 't6', fullName: 'Дюкина', maxPairs: null },
  { id: 't7', fullName: 'Леонтьева', maxPairs: null },
  { id: 't8', fullName: 'Чупина', maxPairs: null },
]

export const mockDisciplines: Discipline[] = [
  { id: 'd1', name: 'Архитектуры' },
  { id: 'd2', name: 'Компьютерные сети' },
  { id: 'd3', name: 'ЭВМ' },
  { id: 'd4', name: 'БД' },
  { id: 'd5', name: 'Программирование на C' },
  { id: 'd6', name: 'Python' },
  { id: 'd7', name: 'Java' },
  { id: 'd8', name: 'C#' },
  { id: 'd9', name: 'OpenSCAD' },
  { id: 'd10', name: 'HTML' },
  { id: 'd11', name: 'Сертификация' },
  { id: 'd12', name: 'Численные методы' },
  { id: 'd13', name: 'Математика' },
  { id: 'd14', name: 'Физра' },
]

export const mockCompetencies: Competency[] = [
  { teacherId: 't1', disciplineId: 'd1' },
  { teacherId: 't1', disciplineId: 'd2' },
  { teacherId: 't1', disciplineId: 'd3' },
  { teacherId: 't2', disciplineId: 'd4' },
  { teacherId: 't2', disciplineId: 'd5' },
  { teacherId: 't3', disciplineId: 'd6' },
  { teacherId: 't3', disciplineId: 'd7' },
  { teacherId: 't4', disciplineId: 'd8' },
  { teacherId: 't4', disciplineId: 'd9' },
  { teacherId: 't5', disciplineId: 'd10' },
  { teacherId: 't5', disciplineId: 'd7' }, // пересечение с Сырманом
  { teacherId: 't6', disciplineId: 'd11' },
  { teacherId: 't6', disciplineId: 'd12' },
  { teacherId: 't7', disciplineId: 'd13' },
  { teacherId: 't8', disciplineId: 'd14' },
]

// пока пусто — заполним на этапе распределения
export const mockWorkloads: Workload[] = []
export const mockAllocations: Allocation[] = []