'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Analytics {
  totalTasks: number
  overdue: number
  completionRate: number
  statusBreakdown: {
    todo: number
    in_progress: number
    completed: number
    on_hold: number
  }
  priorityBreakdown: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  categoryBreakdown: { name: string; count: number }[]
  userBreakdown: { name: string; count: number }[]
}

const STATUS_COLORS = ['#71717a', '#3b82f6', '#10b981', '#f59e0b']
const PRIORITY_COLORS = ['#94a3b8', '#3b82f6', '#f97316', '#ef4444']

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useSWR<Analytics>(
    '/api/admin/analytics',
    fetcher
  )

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-muted"
            />
          ))}
        </div>
      </div>
    )
  }

  const statusData = [
    { name: 'To Do', value: data.statusBreakdown.todo },
    { name: 'In Progress', value: data.statusBreakdown.in_progress },
    { name: 'Completed', value: data.statusBreakdown.completed },
    { name: 'On Hold', value: data.statusBreakdown.on_hold },
  ]

  const priorityData = [
    { name: 'Low', value: data.priorityBreakdown.low },
    { name: 'Medium', value: data.priorityBreakdown.medium },
    { name: 'High', value: data.priorityBreakdown.high },
    { name: 'Urgent', value: data.priorityBreakdown.urgent },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <BarChart3 className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Overview of all task data and metrics
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <ListTodo className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold text-foreground">
                {data.totalTasks}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <CheckCircle2 className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">
                {data.statusBreakdown.completed}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <AlertTriangle className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-foreground">
                {data.overdue}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <TrendingUp className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold text-foreground">
                {data.completionRate}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={STATUS_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {statusData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[i] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((_, index) => (
                    <Cell key={index} fill={PRIORITY_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                No category data
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-foreground">{cat.name}</span>
                    <Badge variant="secondary">{cat.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top assignees */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Assignees</CardTitle>
          </CardHeader>
          <CardContent>
            {data.userBreakdown.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                No assignment data
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.userBreakdown.map((u, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{u.name}</span>
                    <Badge variant="secondary">{u.count} tasks</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
