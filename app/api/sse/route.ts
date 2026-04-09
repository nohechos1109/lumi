import { getSession, unauthorized } from '@/lib/auth-guard'
import { addListener, removeListener } from '@/lib/sse'

export const dynamic = 'force-dynamic'

const HEARTBEAT_MS = 25_000

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const { userId } = session
  let controller!: ReadableStreamDefaultController<Uint8Array>
  let heartbeatTimer: ReturnType<typeof setInterval>

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl
      addListener(userId, controller)

      controller.enqueue(
        new TextEncoder().encode(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`)
      )

      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeatTimer)
        }
      }, HEARTBEAT_MS)
    },

    cancel() {
      clearInterval(heartbeatTimer)
      removeListener(userId, controller)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
