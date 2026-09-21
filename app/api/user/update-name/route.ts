import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

interface SessionUser {
  id: string
  name: string
  email: string
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

export async function PATCH(req: Request) {
  const session = getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('name' in body) ||
    typeof (body as Record<string, unknown>).name !== 'string'
  ) {
    return NextResponse.json({ error: 'Field "name" is required and must be a string.' }, { status: 400 })
  }

  const newName = ((body as Record<string, unknown>).name as string).trim()

  if (newName.length === 0) {
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 422 })
  }
  if (newName.length > 80) {
    return NextResponse.json({ error: 'Name must be 80 characters or fewer.' }, { status: 422 })
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.id },
      data: { name: newName },
      select: { id: true, name: true, email: true, image: true },
    })

    // Refresh the session cookie with the new name and existing image
    const response = NextResponse.json({ user: updated }, { status: 200 })
    response.cookies.set({
      name: 'xplora_user',
      value: JSON.stringify({ id: updated.id, name: updated.name, email: updated.email, image: updated.image }),
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (err) {
    console.error('update-name error:', err)
    return NextResponse.json({ error: 'Failed to update name. Please try again.' }, { status: 500 })
  }
}
