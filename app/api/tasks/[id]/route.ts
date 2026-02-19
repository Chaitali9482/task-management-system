import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: task, error } = await supabase
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

  if (error || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(task)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Get current task for history logging
  const { data: currentTask } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  const historyEntries: { field_name: string; old_value: string | null; new_value: string | null }[] = []

  const fields = ['title', 'description', 'priority', 'status', 'due_date', 'category_id', 'assigned_to'] as const

  for (const field of fields) {
    if (body[field] !== undefined && body[field] !== currentTask[field]) {
      updates[field] = body[field]
      historyEntries.push({
        field_name: field,
        old_value: currentTask[field]?.toString() || null,
        new_value: body[field]?.toString() || null,
      })
    }
  }

  // Handle completion timestamp
  if (body.status === 'completed' && currentTask.status !== 'completed') {
    updates.completed_at = new Date().toISOString()
  } else if (body.status && body.status !== 'completed') {
    updates.completed_at = null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'No changes' })
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(*),
      assignee:profiles!tasks_assigned_to_fkey(*),
      category:task_categories(*)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log history
  if (historyEntries.length > 0) {
    await supabase.from('task_history').insert(
      historyEntries.map((entry) => ({
        ...entry,
        task_id: id,
        changed_by: user.id,
      }))
    )
  }

  return NextResponse.json(task)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete
  const { error } = await supabase
    .from('tasks')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log deletion
  await supabase.from('task_history').insert({
    task_id: id,
    changed_by: user.id,
    field_name: 'deleted',
    old_value: 'false',
    new_value: 'true',
  })

  return NextResponse.json({ message: 'Task deleted' })
}
