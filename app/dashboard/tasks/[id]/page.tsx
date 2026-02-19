import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TaskDetail } from '@/components/task-detail'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(*),
      assignee:profiles!tasks_assigned_to_fkey(*),
      category:task_categories(*)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (!task) notFound()

  return (
    <TaskDetail
      task={task}
      currentUserId={user.id}
      isAdmin={profile.role === 'admin'}
    />
  )
}
