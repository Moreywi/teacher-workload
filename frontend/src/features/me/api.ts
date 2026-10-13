import { api } from '../../shared/api/client'

export interface MyWorkloadItem {
  allocationId: string
  workloadId: string
  disciplineId: string
  disciplineName: string
  type: 'LECTURE' | 'PRACTICE'
  pairs: number
  status: 'AUTO' | 'MANUAL'
  groupNames: string[]
}

export interface MyWorkloadResponse {
  teacher: {
    id: string
    fullName: string
    maxPairs: number | null
  }
  items: MyWorkloadItem[]
  totalPairs: number
  totalHours: number
}

export async function fetchMyWorkload(): Promise<MyWorkloadResponse> {
  const { data } = await api.get<MyWorkloadResponse>('/me/workload')
  return data
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  await api.post('/auth/change-password', { oldPassword, newPassword })
}