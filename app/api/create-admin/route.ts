import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { email, password, full_name } = await request.json()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message }, { status: 400 })
  }

  await supabaseAdmin.from('admins').insert({
    id: data.user.id,
    full_name,
    email,
    role: 'admin'
  })

  return NextResponse.json({ success: true })
}