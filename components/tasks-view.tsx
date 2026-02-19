'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { CreateTaskDialog } from '@/components/create-task-dialog'
import { TaskCard } from '@/components/task-card'
import type { Task, TaskCategory, Profile } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TasksViewProps {
  currentUserId: string
  isAdmin: boolean
}

export function TasksView({ currentUserId, isAdmin }: TasksViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (priorityFilter !== 'all') params.set('priority', priorityFilter)
    return `/api/tasks?${params.toString()}`
  }

  const { data: tasks = [], isLoading } = useSWR<Task[]>(buildUrl(), fetcher, {
    refreshInterval: 5000,
  })
  const { data: categories = [] } = useSWR<TaskCategory[]>(
    '/api/categories',
    fetcher
  )
  const { data: profiles = [] } = useSWR<Profile[]>('/api/profiles', fetcher)

  const handleTaskCreated = () => {
    mutate(buildUrl())
    setDialogOpen(false)
  }

  const handleTaskUpdated = () => {
    mutate(buildUrl())
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all your tasks
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Active filter badges */}
      {(statusFilter !== 'all' || priorityFilter !== 'all' || search) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {statusFilter !== 'all' && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setStatusFilter('all')}
            >
              Status: {statusFilter.replace('_', ' ')} x
            </Badge>
          )}
          {priorityFilter !== 'all' && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setPriorityFilter('all')}
            >
              Priority: {priorityFilter} x
            </Badge>
          )}
          {search && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSearch('')}
            >
              Search: {search} x
            </Badge>
          )}
        </div>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-muted"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No tasks found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setDialogOpen(true)}
            >
              Create your first task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onUpdated={handleTaskUpdated}
            />
          ))}
        </div>
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        profiles={profiles}
        currentUserId={currentUserId}
        onCreated={handleTaskCreated}
      />
    </div>
  )
}
