import { useQuery } from '@tanstack/react-query'
import { fetchAudiences } from './api'

export function useAudiences() {
  return useQuery({
    queryKey: ['audiences'],
    queryFn: fetchAudiences,
  })
}