import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardOverview } from '@/components/dashboard-overview'

export default async function DashboardPage() {
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

  const isAdmin = profile.role === 'admin'

  // Fetch stats
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false)

  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false)
    .eq('status', 'completed')

  const { count: inProgressTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false)
    .eq('status', 'in_progress')

  const { count: overdueTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false)
    .lt('due_date', new Date().toISOString())
    .neq('status', 'completed')

  // Fetch recent tasks
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(*),
      assignee:profiles!tasks_assigned_to_fkey(*),
      category:task_categories(*)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(5)

  // Count users if admin
  let totalUsers = 0
  if (isAdmin) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    totalUsers = count || 0
  }

  return (
    <DashboardOverview
      stats={{
        total_tasks: totalTasks || 0,
        completed_tasks: completedTasks || 0,
        in_progress_tasks: inProgressTasks || 0,
        overdue_tasks: overdueTasks || 0,
        total_users: totalUsers,
      }}
      recentTasks={recentTasks || []}
      isAdmin={isAdmin}
      userName={profile.full_name || profile.email}
    />
  )
}
