import { api } from '../../shared/api/client'

export interface CreateWorkloadDto {
  disciplineId: string
  type: 'LECTURE' | 'PRACTICE'
  pairs: number
  groupIds: string[]
}

export interface UpdateWorkloadDto {
  disciplineId?: string
  type?: 'LECTURE' | 'PRACTICE'
  pairs?: number
  groupIds?: string[]
}

export async function createWorkload(dto: CreateWorkloadDto) {
  const { data } = await api.post('/workloads', dto)
  return data
}

export async function updateWorkload(id: string, dto: UpdateWorkloadDto) {
  const { data } = await api.patch(`/workloads/${id}`, dto)
  return data
}

export async function deleteWorkload(id: string) {
  await api.delete(`/workloads/${id}`)
}