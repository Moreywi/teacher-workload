import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  generateSchedule,
  fetchScheduleGrid,
  type CreateScheduleDto,
  type UpdateScheduleDto,
} from './api'

export function useSchedule(params?: Parameters<typeof fetchSchedule>[0]) {
  return useQuery({
    queryKey: ['schedule', 'list', params],
    queryFn: () => fetchSchedule(params),
  })
}

export function useScheduleGrid(weekStart?: string) {
  return useQuery({
    queryKey: ['schedule', 'grid', weekStart],
    queryFn: () => fetchScheduleGrid(weekStart),
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return async () => {
    await qc.refetchQueries({ queryKey: ['schedule'] })
  }
}

export function useCreateSchedule() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (dto: CreateScheduleDto) => createSchedule(dto),
    onSuccess: invalidate,
  })
}

export function useUpdateSchedule() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateScheduleDto }) =>
      updateSchedule(id, dto),
    onSuccess: invalidate,
  })
}

export function useDeleteSchedule() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: invalidate,
  })
}

export function useGenerateSchedule() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: () => generateSchedule(),
    onSuccess: invalidate,
  })
}