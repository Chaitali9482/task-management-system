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

  const { data: comments, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(comments)
}

export async function POST(
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

  if (!body.comment_text || body.comment_text.trim().length === 0) {
    return NextResponse.json(
      { error: 'Comment cannot be empty' },
      { status: 400 }
    )
  }

  const { data: comment, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: id,
      user_id: user.id,
      comment_text: body.comment_text.trim(),
    })
    .select(`
      *,
      user:profiles(*)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(comment, { status: 201 })
}
