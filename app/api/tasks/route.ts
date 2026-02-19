import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const category_id = searchParams.get('category_id')
  const search = searchParams.get('search')
  const assigned_to = searchParams.get('assigned_to')
  const sort_by = searchParams.get('sort_by') || 'created_at'
  const sort_order = searchParams.get('sort_order') || 'desc'

  let query = supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(*),
      assignee:profiles!tasks_assigned_to_fkey(*),
      category:task_categories(*)
    `)
    .eq('is_deleted', false)

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (category_id) query = query.eq('category_id', category_id)
  if (assigned_to) query = query.eq('assigned_to', assigned_to)
  if (search) query = query.ilike('title', `%${search}%`)

  query = query.order(sort_by, { ascending: sort_order === 'asc' })

  const { data: tasks, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, priority, status, due_date, category_id, assigned_to } = body

  if (!title || title.length < 3) {
    return NextResponse.json(
      { error: 'Title must be at least 3 characters' },
      { status: 400 }
    )
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description: description || '',
      priority: priority || 'medium',
      status: status || 'todo',
      due_date: due_date || null,
      category_id: category_id || null,
      assigned_to: assigned_to || null,
      created_by: user.id,
    })
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

  // Log creation in history
  await supabase.from('task_history').insert({
    task_id: task.id,
    changed_by: user.id,
    field_name: 'created',
    old_value: null,
    new_value: title,
  })

  return NextResponse.json(task, { status: 201 })
}
