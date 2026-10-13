import { api } from '../../shared/api/client'

export interface TeacherWithDisciplines {
  id: string
  fullName: string
  maxPairs: number | null
  email: string | null
  initialPassword: string | null
  disciplineIds: string[]
  disciplineNames: string[]
}

export interface CreateTeacherResponse extends TeacherWithDisciplines {
  email: string
  initialPassword: string
}

export async function fetchTeachers(): Promise<TeacherWithDisciplines[]> {
  const { data } = await api.get<TeacherWithDisciplines[]>('/teachers')
  return data
}

export async function createTeacher(
  fullName: string,
  maxPairs: number | null
): Promise<CreateTeacherResponse> {
  const { data } = await api.post<CreateTeacherResponse>('/teachers', {
    fullName,
    maxPairs,
  })
  return data
}

export async function updateTeacher(
  id: string,
  patch: { fullName?: string; maxPairs?: number | null }
): Promise<TeacherWithDisciplines> {
  const { data } = await api.patch<TeacherWithDisciplines>(
    `/teachers/${id}`,
    patch
  )
  return data
}

export async function setTeacherCompetencies(
  id: string,
  disciplineIds: string[]
): Promise<void> {
  await api.put(`/teachers/${id}/competencies`, { disciplineIds })
}

export async function deleteTeacher(id: string): Promise<void> {
  await api.delete(`/teachers/${id}`)
}