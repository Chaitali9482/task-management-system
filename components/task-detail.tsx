'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  History,
  Trash2,
  Send,
} from 'lucide-react'
import type { Task, TaskComment, TaskHistory, Profile, TaskCategory } from '@/lib/types'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TaskDetailProps {
  task: Task
  currentUserId: string
  isAdmin: boolean
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

export function TaskDetail({ task: initialTask, currentUserId, isAdmin }: TaskDetailProps) {
  const router = useRouter()
  const [commentText, setCommentText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { data: task = initialTask } = useSWR<Task>(
    `/api/tasks/${initialTask.id}`,
    fetcher,
    { fallbackData: initialTask, refreshInterval: 5000 }
  )

  const { data: comments = [] } = useSWR<TaskComment[]>(
    `/api/tasks/${task.id}/comments`,
    fetcher,
    { refreshInterval: 5000 }
  )

  const { data: history = [] } = useSWR<TaskHistory[]>(
    `/api/tasks/${task.id}/history`,
    fetcher
  )

  const { data: profiles = [] } = useSWR<Profile[]>('/api/profiles', fetcher)
  const { data: categories = [] } = useSWR<TaskCategory[]>(
    '/api/categories',
    fetcher
  )

  const canModify =
    isAdmin || task.created_by === currentUserId || task.assigned_to === currentUserId

  const handleUpdate = async (updates: Record<string, unknown>) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    mutate(`/api/tasks/${task.id}`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    router.push('/dashboard/tasks')
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setIsSending(true)
    try {
      await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: commentText }),
      })
      setCommentText('')
      mutate(`/api/tasks/${task.id}/comments`)
    } finally {
      setIsSending(false)
    }
  }

  const getInitials = (profile?: Profile | null) => {
    if (!profile) return '??'
    return profile.full_name
      ? profile.full_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : profile.email.slice(0, 2).toUpperCase()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tasks">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to tasks</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {task.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardContent className="flex flex-col gap-4 p-4">
                  {comments.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-muted text-xs text-foreground">
                            {getInitials(comment.user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {comment.user?.full_name || comment.user?.email || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {comment.comment_text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  <Separator />

                  <form onSubmit={handleComment} className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSending || !commentText.trim()}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send comment</span>
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="flex flex-col gap-3 p-4">
                  {history.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No history yet
                    </p>
                  ) : (
                    history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <span className="font-medium text-foreground">
                            {entry.changer?.full_name || entry.changer?.email || 'Someone'}
                          </span>{' '}
                          <span className="text-muted-foreground">
                            changed <strong>{entry.field_name}</strong>
                            {entry.old_value && (
                              <>
                                {' from '}
                                <span className="text-foreground">{entry.old_value}</span>
                              </>
                            )}
                            {entry.new_value && (
                              <>
                                {' to '}
                                <span className="text-foreground">{entry.new_value}</span>
                              </>
                            )}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.change_timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {canModify ? (
                  <Select
                    value={task.status}
                    onValueChange={(v) => handleUpdate({ status: v })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">{statusLabel[task.status]}</Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                {canModify ? (
                  <Select
                    value={task.priority}
                    onValueChange={(v) => handleUpdate({ priority: v })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={priorityColor[task.priority]}>
                    {task.priority}
                  </Badge>
                )}
              </div>

              {canModify ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assignee</span>
                  <Select
                    value={task.assigned_to || 'unassigned'}
                    onValueChange={(v) =>
                      handleUpdate({
                        assigned_to: v === 'unassigned' ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name || p.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assignee</span>
                  <span className="text-sm text-foreground">
                    {task.assignee?.full_name || task.assignee?.email || 'Unassigned'}
                  </span>
                </div>
              )}

              {canModify ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Select
                    value={task.category_id || 'none'}
                    onValueChange={(v) =>
                      handleUpdate({
                        category_id: v === 'none' ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                task.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge variant="outline" className="gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: task.category.color_hex }}
                      />
                      {task.category.name}
                    </Badge>
                  </div>
                )
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created by</span>
                <span className="text-sm text-foreground">
                  {task.creator?.full_name || task.creator?.email || 'Unknown'}
                </span>
              </div>

              {task.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Due date</span>
                  <span className="flex items-center gap-1 text-sm text-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm text-foreground">
                  {format(new Date(task.created_at), 'MMM d, yyyy')}
                </span>
              </div>

              {task.completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm text-foreground">
                    {format(new Date(task.completed_at), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {(isAdmin || task.created_by === currentUserId) && (
            <Button
              variant="outline"
              className="text-destructive-foreground"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
