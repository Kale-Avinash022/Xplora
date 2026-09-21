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

export async function DELETE() {
  const session = getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
  }

  try {
    /**
     * The schema already has onDelete: Cascade on all relations:
     *   User → Itinerary → DayPlan → Activity
     * So deleting the User cascades everything automatically.
     * We still wrap it in a transaction for atomicity.
     */
    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: session.id } })
    })

    // Clear the session cookie
    const response = NextResponse.json({ message: 'Account deleted successfully.' }, { status: 200 })
    response.cookies.set({
      name: 'xplora_user',
      value: '',
      httpOnly: false,
      path: '/',
      maxAge: 0, // expire immediately
    })
    return response
  } catch (err) {
    console.error('delete-account error:', err)
    return NextResponse.json(
      { error: 'Failed to delete account. No data was removed. Please try again.' },
      { status: 500 }
    )
  }
}
