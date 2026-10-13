import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'

export interface AllocationSnapshot {
  allocations: {
    id: string
    workloadId: string
    teacherId: string
    status: 'AUTO' | 'MANUAL'
  }[]
  workloads: {
    id: string
    disciplineId: string
    type: 'LECTURE' | 'PRACTICE'
    pairs: number
    groupIds: string[]
  }[]
  unassigned: {
    id: string
    disciplineId: string
    type: 'LECTURE' | 'PRACTICE'
    pairs: number
    groupIds: string[]
  }[]
  loadByTeacher: Record<string, number>
  teachers: { id: string; fullName: string; maxPairs: number | null }[]
  disciplines: { id: string; name: string }[]
  groups: { id: string; name: string }[]
  competencies: { teacherId: string; disciplineId: string }[] 
}


export function useAllocationSnapshot() {
  return useQuery({
    queryKey: ['allocations'],
    queryFn: async () => {
      const { data } = await api.get<AllocationSnapshot>('/allocations')
      return data
    },
  })
}


export function useGenerateWorkloads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/workloads/generate')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}

export function useRunAllocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/allocations/run')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}

export function useSetOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      workloadId,
      teacherId,
    }: {
      workloadId: string
      teacherId: string
    }) => {
      await api.patch(`/allocations/${workloadId}`, { teacherId })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}

export function useResetManual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete('/allocations/manual')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}