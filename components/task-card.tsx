'use client'

import type { Task } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Calendar,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pause,
} from 'lucide-react'
import Link from 'next/link'
import { format, isPast, isToday } from 'date-fns'
import { useState } from 'react'

interface TaskCardProps {
  task: Task
  currentUserId: string
  isAdmin: boolean
  onUpdated: () => void
}

const priorityColor: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-chart-1/15 text-chart-1',
  high: 'bg-chart-5/15 text-chart-5',
  urgent: 'bg-destructive/15 text-destructive-foreground',
}

const statusIcon: Record<string, React.ReactNode> = {
  todo: <Clock className="h-4 w-4 text-muted-foreground" />,
  in_progress: <ArrowRight className="h-4 w-4 text-chart-1" />,
  completed: <CheckCircle2 className="h-4 w-4 text-chart-2" />,
  on_hold: <Pause className="h-4 w-4 text-chart-5" />,
}

const statusLabel: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
}

export function TaskCard({
  task,
  currentUserId,
  isAdmin,
  onUpdated,
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const canModify =
    isAdmin || task.created_by === currentUserId || task.assigned_to === currentUserId

  const isOverdue =
    task.due_date &&
    isPast(new Date(task.due_date)) &&
    !isToday(new Date(task.due_date)) &&
    task.status !== 'completed'

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      onUpdated()
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return
    setIsUpdating(true)
    try {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      onUpdated()
    } finally {
      setIsUpdating(false)
    }
  }

  const assigneeInitials = task.assignee
    ? task.assignee.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || task.assignee.email.slice(0, 2).toUpperCase()
    : null

  return (
    <Card className={`transition-colors ${isUpdating ? 'opacity-60' : ''} ${isOverdue ? 'border-destructive/50' : ''}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <button
          onClick={() => {
            if (!canModify) return
            const nextStatus =
              task.status === 'todo'
                ? 'in_progress'
                : task.status === 'in_progress'
                  ? 'completed'
                  : task.status === 'on_hold'
                    ? 'in_progress'
                    : 'todo'
            handleStatusChange(nextStatus)
          }}
          disabled={!canModify}
          className="flex-shrink-0"
          title={`Status: ${statusLabel[task.status]}`}
        >
          {statusIcon[task.status]}
        </button>

        <Link
          href={`/dashboard/tasks/${task.id}`}
          className="flex min-w-0 flex-1 flex-col gap-1"
        >
          <span
            className={`font-medium text-foreground ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}
          >
            {task.title}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={priorityColor[task.priority]}>
              {task.priority}
            </Badge>
            {task.category && (
              <Badge
                variant="outline"
                className="gap-1"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: task.category.color_hex }}
                />
                {task.category.name}
              </Badge>
            )}
            {task.due_date && (
              <span
                className={`flex items-center gap-1 text-xs ${isOverdue ? 'font-medium text-destructive-foreground' : 'text-muted-foreground'}`}
              >
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </Link>

        {assigneeInitials && (
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="bg-muted text-xs text-foreground">
              {assigneeInitials}
            </AvatarFallback>
          </Avatar>
        )}

        {canModify && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Task actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/tasks/${task.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== 'todo' && (
                <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                  Set To Do
                </DropdownMenuItem>
              )}
              {task.status !== 'in_progress' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('in_progress')}
                >
                  Set In Progress
                </DropdownMenuItem>
              )}
              {task.status !== 'completed' && (
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  Set Completed
                </DropdownMenuItem>
              )}
              {task.status !== 'on_hold' && (
                <DropdownMenuItem onClick={() => handleStatusChange('on_hold')}>
                  Set On Hold
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {(isAdmin || task.created_by === currentUserId) && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive-foreground"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  )
}
