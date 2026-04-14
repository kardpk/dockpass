import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'

  // Rate limit: 5 uploads per IP per 10 minutes
  const limited = await rateLimit(req, {
    max: 5,
    window: 600,
    key: `upload-fwc:${ip}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many uploads. Try again later.' },
      { status: 429 }
    )
  }

  // Parse multipart form data
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
      { status: 400 }
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5 MB.' },
      { status: 400 }
    )
  }

  // Verify trip exists
  const supabase = createServiceClient()
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('slug', slug)
    .neq('status', 'cancelled')
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Generate unique path and upload to Supabase Storage
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${slug}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('guest-documents')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload-fwc] storage error:', uploadError)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('guest-documents')
    .getPublicUrl(fileName)

  return NextResponse.json({
    data: { url: urlData.publicUrl },
  })
}
