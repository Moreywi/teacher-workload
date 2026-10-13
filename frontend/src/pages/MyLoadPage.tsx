import { useMyWorkload } from '../features/me/hooks'
import { Spinner } from '../shared/ui/Spinner'
import { Table } from '../shared/ui/Table'
import { PageHeader } from '../shared/ui/PageHeader'
import { StatCard, Card } from '../shared/ui/Card'
import { Badge } from '../shared/ui/Badge'

const typeLabel: Record<string, string> = {
  LECTURE: 'Лекция',
  PRACTICE: 'Практика',
}

export function MyLoadPage() {
  const { data, isLoading, isError, error } = useMyWorkload()

  if (isLoading) return <Spinner />
  if (isError) {
    const msg = (error as any)?.response?.data?.error ?? 'Ошибка загрузки'
    return <p className="text-red-600">{msg}</p>
  }
  if (!data) return null

  return (
    <div className="space-y-5">
      <PageHeader
        title="Моя нагрузка"
        subtitle={data.teacher.fullName}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon="📚"
          label="Всего дисциплин"
          value={new Set(data.items.map((i) => i.disciplineId)).size}
          accent="blue"
        />
        <StatCard
          icon="📋"
          label="Всего пар"
          value={data.totalPairs}
          accent="green"
        />
        <StatCard
          icon="⏱"
          label="Всего часов"
          value={data.totalHours}
          suffix=" ч"
          accent="purple"
        />
      </div>

      {data.teacher.maxPairs !== null && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Использование лимита
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {Math.min(
                100,
                Math.round((data.totalPairs / data.teacher.maxPairs) * 100)
              )}
              %
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                data.totalPairs / data.teacher.maxPairs >= 0.9
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : data.totalPairs / data.teacher.maxPairs >= 0.7
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                    : 'bg-gradient-to-r from-green-400 to-green-600'
              }`}
              style={{
                width: `${Math.min(100, (data.totalPairs / data.teacher.maxPairs) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{data.totalPairs} пар</span>
            <span>лимит {data.teacher.maxPairs}</span>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-medium text-gray-800">
          Распределение занятий
        </h2>

        {data.items.length === 0 ? (
          <Card>
            <p className="text-center text-gray-400 py-6">
              Нагрузка ещё не назначена
            </p>
          </Card>
        ) : (
          <Table headers={['Дисциплина', 'Тип', 'Группы', 'Пар', 'Часов', 'Статус']}>
            {data.items.map((item) => (
              <tr key={item.allocationId} className="hover:bg-gray-50/60 transition">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {item.disciplineName}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {typeLabel[item.type]}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {item.groupNames.join(', ')}
                </td>
                <td className="px-4 py-3">{item.pairs}</td>
                <td className="px-4 py-3 text-gray-500">
                  {(item.pairs * 1.5).toFixed(1)}
                </td>
                <td className="px-4 py-3">
                  {item.status === 'MANUAL' ? (
                    <Badge color="amber">вручную</Badge>
                  ) : (
                    <Badge color="gray">авто</Badge>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50/80 font-medium">
              <td className="px-4 py-3" colSpan={3}>
                Итого
              </td>
              <td className="px-4 py-3">{data.totalPairs}</td>
              <td className="px-4 py-3">{data.totalHours.toFixed(1)}</td>
              <td />
            </tr>
          </Table>
        )}
      </div>
    </div>
  )
}