import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WishlistItem } from '@/lib/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const rows = await (prisma as any).wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const items: WishlistItem[] = rows.map((row: any) => ({
      itemKey: row.itemKey,
      title: row.title,
      destination: row.destination,
      durationDays: row.durationDays,
      totalBudget: row.budget,
      currency: row.currency || 'INR',
      travelStyle: row.travelStyle || 'General',
      savedAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      plan: typeof row.plan === 'string' ? JSON.parse(row.plan) : row.plan,
    }))

    return NextResponse.json({ items }, { status: 200 })
  } catch (error: any) {
    console.error('Wishlist GET API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, item } = body

    if (!userId || !item || !item.itemKey || !item.destination || !item.plan) {
      return NextResponse.json(
        { error: 'Invalid payload: userId and complete item are required.' },
        { status: 400 }
      )
    }

    const upserted = await (prisma as any).wishlistItem.upsert({
      where: {
        userId_itemKey: {
          userId,
          itemKey: item.itemKey,
        },
      },
      create: {
        userId,
        itemKey: item.itemKey,
        title: item.title || `Trip to ${item.destination}`,
        destination: item.destination,
        durationDays: Number(item.durationDays) || 1,
        budget: Number(item.totalBudget ?? item.budget ?? 0),
        currency: item.currency || 'INR',
        travelStyle: item.travelStyle || 'General',
        plan: typeof item.plan === 'object' ? JSON.stringify(item.plan) : String(item.plan),
      },
      update: {
        title: item.title || `Trip to ${item.destination}`,
        destination: item.destination,
        durationDays: Number(item.durationDays) || 1,
        budget: Number(item.totalBudget ?? item.budget ?? 0),
        currency: item.currency || 'INR',
        travelStyle: item.travelStyle || 'General',
        plan: typeof item.plan === 'object' ? JSON.stringify(item.plan) : String(item.plan),
      },
    })

    const mappedItem: WishlistItem = {
      itemKey: upserted.itemKey,
      title: upserted.title,
      destination: upserted.destination,
      durationDays: upserted.durationDays,
      totalBudget: upserted.budget,
      currency: upserted.currency,
      travelStyle: upserted.travelStyle,
      savedAt: upserted.createdAt ? new Date(upserted.createdAt).toISOString() : new Date().toISOString(),
      plan: typeof upserted.plan === 'string' ? JSON.parse(upserted.plan) : upserted.plan,
    }

    return NextResponse.json({ item: mappedItem }, { status: 200 })
  } catch (error: any) {
    console.error('Wishlist POST API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to upsert wishlist item' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const itemKey = searchParams.get('itemKey')
    const all = searchParams.get('all') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    if (all) {
      await (prisma as any).wishlistItem.deleteMany({
        where: { userId },
      })
      return NextResponse.json({ success: true, cleared: true }, { status: 200 })
    }

    if (!itemKey) {
      return NextResponse.json(
        { error: 'Missing itemKey parameter' },
        { status: 400 }
      )
    }

    await (prisma as any).wishlistItem.deleteMany({
      where: {
        userId,
        itemKey,
      },
    })

    return NextResponse.json({ success: true, itemKey }, { status: 200 })
  } catch (error: any) {
    console.error('Wishlist DELETE API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete wishlist item' },
      { status: 500 }
    )
  }
}
