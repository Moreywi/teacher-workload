import { Link } from 'react-router-dom'
import { useDashboard } from '../features/dashboard/hooks'
import { Spinner } from '../shared/ui/Spinner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard()

  if (isLoading) return <Spinner />
  if (isError)
    return <p className="text-red-600">Ошибка загрузки дашборда</p>
  if (!data) return null

  if (data.role === 'STAFF' && data.myLoad) {
    return <StaffDashboard data={data} />
  }

  return <AdminDashboard data={data} />
}

function AdminDashboard({ data }: { data: any }) {
  if (!data.loadDistribution) return null
  const { totals, loadDistribution, uncoveredDisciplines } = data

  const assignedPercent =
    totals.workloads > 0
      ? Math.round((totals.assigned / totals.workloads) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Дашборд</h1>
          <p className="text-sm text-gray-500 mt-1">
            Общая сводка по системе распределения нагрузки
          </p>
        </div>
        <Link
          to="/allocation"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          Открыть распределение
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          label="Преподавателей"
          value={totals.teachers}
          accent="blue"
          to="/teachers"
        />
        <StatCard
          icon="📚"
          label="Дисциплин"
          value={totals.disciplines}
          accent="purple"
          to="/disciplines"
        />
        <StatCard
          icon="🎓"
          label="Студенческих групп"
          value={totals.groups}
          accent="indigo"
        />
        <StatCard
          icon="📋"
          label="Всего workload'ов"
          value={totals.workloads}
          accent="gray"
          to="/allocation"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Распределено
            </span>
            <span className="text-2xl font-semibold text-green-600">
              {assignedPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
              style={{ width: `${assignedPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{totals.assigned} назначено</span>
            <span>
              {totals.unassigned > 0 ? (
                <span className="text-red-600 font-medium">
                  {totals.unassigned} не распределено
                </span>
              ) : (
                <span className="text-green-600">всё ок</span>
              )}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Общая нагрузка
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-gray-900">
              {totals.totalPairs}
            </span>
            <span className="text-sm text-gray-500">пар</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            ≈ {(totals.totalPairs * 1.5).toFixed(0)} академических часов
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Средняя на преподавателя
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-gray-900">
              {loadDistribution.avgPairs}
            </span>
            <span className="text-sm text-gray-500">пар</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            ≈ {(loadDistribution.avgPairs * 1.5).toFixed(0)} часов
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">
              Нагрузка по преподавателям
            </h2>
            <Legend />
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={loadDistribution.allLoads}
                margin={{ top: 8, right: 8, left: -10, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="fullName"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: 12,
                  }}
                  formatter={(value) => {
                    const n = Number(value ?? 0)
                    return [`${n} пар · ${(n * 1.5).toFixed(0)} ч`, 'Нагрузка']
                  }}
                />
                <Bar dataKey="pairs" radius={[6, 6, 0, 0]}>
                  {loadDistribution.allLoads.map(
                    (entry: any, i: number) => {
                      const ratio = entry.pairs / loadDistribution.avgPairs
                      const fill =
                        ratio > 1.2
                          ? 'url(#barRed)'
                          : ratio < 0.8
                            ? 'url(#barBlue)'
                            : 'url(#barGreen)'
                      return <Cell key={i} fill={fill} />
                    }
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <RankCard
            title="🔥 Самые загруженные"
            items={loadDistribution.topLoaded}
            colorClass="text-red-600"
            bgClass="bg-red-50"
          />
          <RankCard
            title="💤 Менее загруженные"
            items={loadDistribution.leastLoaded}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">
            Покрытие дисциплин компетенциями
          </h2>
          <Link
            to="/disciplines"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Все дисциплины →
          </Link>
        </div>

        {uncoveredDisciplines && uncoveredDisciplines.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-sm text-red-700 font-medium">
                {uncoveredDisciplines.length}{' '}
                {uncoveredDisciplines.length === 1
                  ? 'дисциплина'
                  : 'дисциплин'}{' '}
                без компетентных преподавателей
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {uncoveredDisciplines.map((d: any) => (
                <span
                  key={d.id}
                  className="text-xs bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-md"
                >
                  {d.name}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <p className="text-sm text-green-700 font-medium">
              Все дисциплины покрыты компетенциями
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StaffDashboard({ data }: { data: any }) {
  const my = data.myLoad
  const percent =
    my.maxPairs !== null
      ? Math.min(100, Math.round((my.totalPairs / my.maxPairs) * 100))
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Здравствуйте, {my.fullName.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Краткая сводка по вашей учебной нагрузке
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon="📚"
          label="Дисциплин"
          value={my.disciplinesCount}
          accent="blue"
        />
        <StatCard
          icon="📋"
          label="Всего пар"
          value={my.totalPairs}
          accent="green"
        />
        <StatCard
          icon="⏱"
          label="Всего часов"
          value={my.totalHours}
          accent="purple"
        />
      </div>

      {my.maxPairs !== null && percent !== null && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Использование лимита нагрузки
            </span>
            <span
              className={`text-sm font-semibold ${
                percent >= 90
                  ? 'text-red-600'
                  : percent >= 70
                    ? 'text-amber-600'
                    : 'text-green-600'
              }`}
            >
              {percent}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percent >= 90
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : percent >= 70
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                    : 'bg-gradient-to-r from-green-400 to-green-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{my.totalPairs} пар</span>
            <span>лимит {my.maxPairs}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-blue-100 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Подробная информация
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Список дисциплин, групп и точных часов по каждой нагрузке
          </p>
        </div>
        <Link
          to="/my-load"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition self-start sm:self-auto"
        >
          Открыть мою нагрузку
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}

const accentMap = {
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  gray: 'bg-gray-100 text-gray-600',
} as const

function StatCard({
  icon,
  label,
  value,
  accent,
  suffix = '',
  to,
}: {
  icon: string
  label: string
  value: number
  accent: keyof typeof accentMap
  suffix?: string
  to?: string
}) {
  const content = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${accentMap[accent]}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {value}
        {suffix}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    )
  }
  return content
}

function RankCard({
  title,
  items,
  colorClass,
  bgClass,
}: {
  title: string
  items: { fullName: string; pairs: number }[]
  colorClass: string
  bgClass: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-700 truncate pr-2">
              {item.fullName}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-medium shrink-0 ${bgClass} ${colorClass}`}
            >
              {item.pairs} пар
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-green-500" />
        <span className="text-gray-500">норма</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
        <span className="text-gray-500">ниже средней</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
        <span className="text-gray-500">выше средней</span>
      </span>
    </div>
  )
}