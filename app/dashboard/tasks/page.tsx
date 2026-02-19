import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TasksView } from '@/components/tasks-view'

export default async function TasksPage() {
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

  return <TasksView currentUserId={user.id} isAdmin={profile.role === 'admin'} />
}
