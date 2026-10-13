export type WorkloadType = 'LECTURE' | 'PRACTICE'
export type AllocationStatus = 'AUTO' | 'MANUAL'
export type Role = 'ADMIN' | 'STAFF'

export interface Teacher {
  id: string
  fullName: string
  maxPairs: number | null
}

export interface Discipline {
  id: string
  name: string
}

export interface Group {
  id: string
  name: string
}

export interface Competency {
  teacherId: string
  disciplineId: string
}

export interface Workload {
  id: string
  disciplineId: string
  type: WorkloadType
  pairs: number
  groupIds: string[]
}

export interface Allocation {
  id: string
  workloadId: string
  teacherId: string
  status: AllocationStatus
}

export interface User {
  id: string
  email: string
  role: Role
}