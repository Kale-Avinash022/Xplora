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

export async function GET() {
  const session = getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const response = NextResponse.json({ user }, { status: 200 })

    // Refresh cookie with fresh DB data (ensures user.image is updated across devices)
    response.cookies.set({
      name: 'xplora_user',
      value: JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }),
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('Error fetching user session:', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
