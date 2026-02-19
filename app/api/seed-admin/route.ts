import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'admin@taskflow.com'
const ADMIN_PASSWORD = 'admin123456'
const ADMIN_NAME = 'Admin User'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    )
  }

  // Use admin client with service role key to bypass RLS
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check if admin already exists in profiles
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .single()

  if (existingProfile) {
    return NextResponse.json({ message: 'Admin already exists', seeded: false })
  }

  // Create the admin user via Supabase Auth Admin API
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // auto-confirm so they can log in immediately
      user_metadata: {
        full_name: ADMIN_NAME,
        role: 'admin',
      },
    })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // The trigger will auto-create the profile with role=admin from metadata.
  // But let's ensure it's set correctly just in case.
  if (authData.user) {
    await adminClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id)
  }

  return NextResponse.json({
    message: 'Default admin created successfully',
    seeded: true,
    credentials: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })
}
