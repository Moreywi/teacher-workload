import { api } from '../../shared/api/client'

export interface ScheduleItem {
  id: string
  workloadId: string
  date: string
  pairNumber: number
  audienceId: string
  teacherId: string | null
}

export interface CreateScheduleDto {
  workloadId: string
  date: string
  pairNumber: number
  audienceId: string
  teacherId?: string | null
}

export interface UpdateScheduleDto {
  workloadId?: string
  date?: string
  pairNumber?: number
  audienceId?: string
  teacherId?: string | null
}

export interface GridCell {
  id: string
  workloadId: string
  date: string
  day: number
  pair: number
  groupId: string
  disciplineName: string
  type: 'LECTURE' | 'PRACTICE'
  teacherName: string | null
  audienceId: string
  audienceName: string | null
}

export interface ScheduleGrid {
  weekStart: string
  weekEnd: string
  groups: { id: string; name: string }[]
  cells: GridCell[]
}

export interface GenerateInfo {
  startDate: string
  endDate: string
  weeksCount: number
  totalWorkloads: number
  totalGroups: number
  totalPairs: number
  totalSlots: number
  groupWorkloads: Array<{ name: string; count: number }>
}

export interface ClippedItem {
  workloadId: string
  disciplineName: string
  type: 'LECTURE' | 'PRACTICE'
  groupNames: string[]
  wanted: number
  created: number
}

export interface GenerateResult {
  created: number
  skipped: number
  totalWorkloads: number
  clipped: ClippedItem[]
}

export async function fetchSchedule(params?: {
  groupId?: string
  teacherId?: string
  from?: string
  to?: string
}): Promise<ScheduleItem[]> {
  const { data } = await api.get<ScheduleItem[]>('/schedule', { params })
  return data
}

export async function fetchScheduleGrid(weekStart?: string): Promise<ScheduleGrid> {
  const { data } = await api.get<ScheduleGrid>('/schedule/grid', {
    params: weekStart ? { weekStart } : {},
  })
  return data
}

export async function createSchedule(dto: CreateScheduleDto) {
  const { data } = await api.post('/schedule', dto)
  return data
}

export async function updateSchedule(id: string, dto: UpdateScheduleDto) {
  const { data } = await api.patch(`/schedule/${id}`, dto)
  return data
}

export async function deleteSchedule(id: string) {
  await api.delete(`/schedule/${id}`)
}

export async function generateSchedule(): Promise<GenerateResult> {
  const { data } = await api.post<GenerateResult>('/schedule/generate')
  return data
}

export async function fetchGenerateInfo(): Promise<GenerateInfo> {
  const { data } = await api.get<GenerateInfo>('/schedule/generate-info')
  return data
}