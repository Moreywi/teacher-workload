import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createWorkload,
  updateWorkload,
  deleteWorkload,
  type CreateWorkloadDto,
  type UpdateWorkloadDto,
} from './api'

function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['allocations'] })
  }
}

export function useCreateWorkload() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (dto: CreateWorkloadDto) => createWorkload(dto),
    onSuccess: invalidate,
  })
}

export function useUpdateWorkload() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWorkloadDto }) =>
      updateWorkload(id, dto),
    onSuccess: invalidate,
  })
}

export function useDeleteWorkload() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => deleteWorkload(id),
    onSuccess: invalidate,
  })
}