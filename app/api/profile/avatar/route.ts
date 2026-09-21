import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

interface SessionUser {
  id: string
  name: string
  email: string
  image?: string | null
}

function getSession(): SessionUser | null {
  const raw = cookies().get('xplora_user')?.value
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'name' in parsed &&
      'email' in parsed &&
      typeof (parsed as Record<string, unknown>).id === 'string' &&
      typeof (parsed as Record<string, unknown>).name === 'string' &&
      typeof (parsed as Record<string, unknown>).email === 'string'
    ) {
      return parsed as SessionUser
    }
    return null
  } catch {
    return null
  }
}

// In-memory sliding-window rate limiter: max 5 uploads per minute per user
const uploadTimestamps = new Map<string, number[]>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000
  const timestamps = uploadTimestamps.get(userId) || []
  const recent = timestamps.filter((t) => now - t < windowMs)
  if (recent.length >= 5) {
    uploadTimestamps.set(userId, recent)
    return false
  }
  recent.push(now)
  uploadTimestamps.set(userId, recent)
  return true
}

/**
 * Validates binary magic bytes to guarantee true file type:
 * - JPEG: FF D8 FF
 * - PNG:  89 50 4E 47
 * - WebP: 'RIFF' at 0 and 'WEBP' at 8
 */
function detectMimeType(buf: Buffer): string | null {
  if (buf.length < 12) return null

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png'
  }

  // WebP: RIFF ... WEBP
  const riff = buf.toString('ascii', 0, 4)
  const webp = buf.toString('ascii', 8, 12)
  if (riff === 'RIFF' && webp === 'WEBP') {
    return 'image/webp'
  }

  return null
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(session.id)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 5 uploads per minute.' },
      { status: 429 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart/form-data request' }, { status: 400 })
  }

  const file = formData.get('avatar')
  if (!file || typeof file === 'string' || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing avatar file' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const sizeBytes = buffer.length

  // Max 512 KB
  if (sizeBytes > 512 * 1024) {
    return NextResponse.json(
      { error: 'File size exceeds maximum allowed limit of 512 KB' },
      { status: 413 }
    )
  }

  // Verify real file type by magic bytes (reject SVG / unknown)
  const mimeType = detectMimeType(buffer)
  if (!mimeType) {
    return NextResponse.json(
      { error: 'Unsupported file type. Only JPEG, PNG, and WebP are allowed.' },
      { status: 415 }
    )
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Upsert UserAvatar row
      const avatar = await tx.userAvatar.upsert({
        where: { userId: session.id },
        create: {
          userId: session.id,
          data: buffer,
          mimeType,
          sizeBytes,
        },
        update: {
          data: buffer,
          mimeType,
          sizeBytes,
        },
      })

      const imageUrl = `/api/avatar/${avatar.id}?v=${avatar.updatedAt.getTime()}`

      const updatedUser = await tx.user.update({
        where: { id: session.id },
        data: { image: imageUrl },
        select: { id: true, name: true, email: true, image: true },
      })

      return { avatar, imageUrl, user: updatedUser }
    })

    const response = NextResponse.json({ image: result.imageUrl }, { status: 200 })

    // Refresh session cookie with new image
    response.cookies.set({
      name: 'xplora_user',
      value: JSON.stringify({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        image: result.user.image,
      }),
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('Avatar upload transaction error:', err)
    return NextResponse.json({ error: 'Failed to save avatar image' }, { status: 500 })
  }
}

export async function DELETE() {
  const session = getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userAvatar.deleteMany({
        where: { userId: session.id },
      })
      await tx.user.update({
        where: { id: session.id },
        data: { image: null },
      })
    })

    const response = new NextResponse(null, { status: 204 })

    // Refresh session cookie with null image
    response.cookies.set({
      name: 'xplora_user',
      value: JSON.stringify({
        id: session.id,
        name: session.name,
        email: session.email,
        image: null,
      }),
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('Avatar delete transaction error:', err)
    return NextResponse.json({ error: 'Failed to delete avatar image' }, { status: 500 })
  }
}
