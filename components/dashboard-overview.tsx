'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DashboardStats, Task } from '@/lib/types'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface DashboardOverviewProps {
  stats: DashboardStats
  recentTasks: Task[]
  isAdmin: boolean
  userName: string
}

const priorityColor: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-chart-1/15 text-chart-1',
  high: 'bg-chart-5/15 text-chart-5',
  urgent: 'bg-destructive/15 text-destructive-foreground',
}

const statusLabel: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
}

export function DashboardOverview({
  stats,
  recentTasks,
  isAdmin,
  userName,
}: DashboardOverviewProps) {
  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total_tasks,
      icon: ListTodo,
      color: 'text-foreground',
    },
    {
      title: 'In Progress',
      value: stats.in_progress_tasks,
      icon: Clock,
      color: 'text-chart-1',
    },
    {
      title: 'Completed',
      value: stats.completed_tasks,
      icon: CheckCircle2,
      color: 'text-chart-2',
    },
    {
      title: 'Overdue',
      value: stats.overdue_tasks,
      icon: AlertTriangle,
      color: 'text-chart-5',
    },
  ]

  if (isAdmin) {
    statCards.push({
      title: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'text-chart-3',
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {userName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {"Here's an overview of your tasks and activity."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No tasks yet. Create your first task!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={priorityColor[task.priority]}
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {statusLabel[task.status]}
                      </span>
                      {task.category && (
                        <span
                          className="inline-flex h-2 w-2 rounded-full"
                          style={{ backgroundColor: task.category.color_hex }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(task.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
