import { useQuery } from '@tanstack/react-query'
import { fetchMyWorkload } from './api'

export function useMyWorkload() {
  return useQuery({
    queryKey: ['me', 'workload'],
    queryFn: fetchMyWorkload,
  })
}