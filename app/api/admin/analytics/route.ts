import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch all tasks for analytics
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*, category:task_categories(*), assignee:profiles!tasks_assigned_to_fkey(*)')
    .eq('is_deleted', false)

  const tasks = allTasks || []

  // Status breakdown
  const statusBreakdown = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    on_hold: tasks.filter((t) => t.status === 'on_hold').length,
  }

  // Priority breakdown
  const priorityBreakdown = {
    low: tasks.filter((t) => t.priority === 'low').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    high: tasks.filter((t) => t.priority === 'high').length,
    urgent: tasks.filter((t) => t.priority === 'urgent').length,
  }

  // Category breakdown
  const categoryMap: Record<string, number> = {}
  tasks.forEach((t) => {
    const catName = t.category?.name || 'Uncategorized'
    categoryMap[catName] = (categoryMap[catName] || 0) + 1
  })
  const categoryBreakdown = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    count,
  }))

  // Tasks per user (top assignees)
  const userMap: Record<string, { name: string; count: number }> = {}
  tasks.forEach((t) => {
    if (t.assignee) {
      const key = t.assignee.id
      if (!userMap[key]) {
        userMap[key] = {
          name: t.assignee.full_name || t.assignee.email,
          count: 0,
        }
      }
      userMap[key].count++
    }
  })
  const userBreakdown = Object.values(userMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Overdue tasks
  const overdue = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'completed'
  ).length

  // Completion rate
  const completionRate =
    tasks.length > 0
      ? Math.round((statusBreakdown.completed / tasks.length) * 100)
      : 0

  return NextResponse.json({
    totalTasks: tasks.length,
    overdue,
    completionRate,
    statusBreakdown,
    priorityBreakdown,
    categoryBreakdown,
    userBreakdown,
  })
}
