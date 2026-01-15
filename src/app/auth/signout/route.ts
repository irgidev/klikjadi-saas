import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  // 1. Hapus Session di Server (Logout)
  await supabase.auth.signOut()

  // 2. Tendang user kembali ke halaman Login (atau Landing Page)
  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 301,
  })
}