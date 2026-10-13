import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  setTeacherCompetencies,
} from './api'
import type { CreateTeacherResponse } from './api'

export const teachersKey = ['teachers'] as const

export function useTeachers() {
  return useQuery({
    queryKey: teachersKey,
    queryFn: fetchTeachers,
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['teachers'] })
    qc.invalidateQueries({ queryKey: ['allocations'] })
    qc.invalidateQueries({ queryKey: ['disciplines'] })
  }
}

export function useCreateTeacher() {
  const invalidate = useInvalidate()
  return useMutation<CreateTeacherResponse, unknown, { fullName: string; maxPairs: number | null }>({
    mutationFn: ({ fullName, maxPairs }) => createTeacher(fullName, maxPairs),
    onSuccess: invalidate,
  })
}

export function useUpdateTeacher() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: { fullName?: string; maxPairs?: number | null }
    }) => updateTeacher(id, patch),
    onSuccess: invalidate,
  })
}

export function useSetTeacherCompetencies() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({
      id,
      disciplineIds,
    }: {
      id: string
      disciplineIds: string[]
    }) => setTeacherCompetencies(id, disciplineIds),
    onSuccess: invalidate,
  })
}

export function useDeleteTeacher() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => deleteTeacher(id),
    onSuccess: invalidate,
  })
}