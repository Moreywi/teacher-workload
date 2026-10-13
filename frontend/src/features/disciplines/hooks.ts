import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchDisciplines,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
} from './api'

export const disciplinesKey = ['disciplines'] as const

export function useDisciplines() {
  return useQuery({
    queryKey: disciplinesKey,
    queryFn: fetchDisciplines,
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['disciplines'] })
    qc.invalidateQueries({ queryKey: ['teachers'] })
    qc.invalidateQueries({ queryKey: ['allocations'] })
  }
}

export function useCreateDiscipline() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (name: string) => createDiscipline(name),
    onSuccess: invalidate,
  })
}

export function useUpdateDiscipline() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateDiscipline(id, name),
    onSuccess: invalidate,
  })
}

export function useDeleteDiscipline() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => deleteDiscipline(id),
    onSuccess: invalidate,
  })
}