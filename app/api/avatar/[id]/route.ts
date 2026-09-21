import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// cuid check: typically starts with 'c', 20-32 alphanumeric chars
function isValidCuid(id: string): boolean {
  return /^c[a-z0-9]{20,32}$/i.test(id)
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!id || !isValidCuid(id)) {
    return NextResponse.json({ error: 'Invalid avatar id' }, { status: 400 })
  }

  try {
    const avatar = await prisma.userAvatar.findUnique({
      where: { id },
      select: {
        data: true,
        mimeType: true,
        updatedAt: true,
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // Generate ETag from id + timestamp in ms
    const etag = `W/"${id}-${avatar.updatedAt.getTime()}"`

    // Check If-None-Match for 304 Not Modified
    const clientEtag = req.headers.get('if-none-match')
    if (clientEtag && (clientEtag === etag || clientEtag.includes(etag))) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    return new NextResponse(new Uint8Array(avatar.data), {
      status: 200,
      headers: {
        'Content-Type': avatar.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etag,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('Error serving avatar:', err)
    return NextResponse.json({ error: 'Failed to retrieve avatar' }, { status: 500 })
  }
}
