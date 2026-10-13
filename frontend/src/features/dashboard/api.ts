import { api } from '../../shared/api/client'

export interface DashboardResponse {
  role: 'ADMIN' | 'STAFF'
  totals: {
    teachers: number
    disciplines: number
    groups: number
    workloads: number
    assigned: number
    unassigned: number
    totalPairs: number
  }
  loadDistribution: {
    avgPairs: number
    topLoaded: { fullName: string; pairs: number }[]
    leastLoaded: { fullName: string; pairs: number }[]
    allLoads: { fullName: string; pairs: number }[]
  } | null
  uncoveredDisciplines: { id: string; name: string }[] | null
  myLoad: {
    fullName: string
    maxPairs: number | null
    disciplinesCount: number
    totalPairs: number
    totalHours: number
  } | null
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>('/dashboard')
  return data
}