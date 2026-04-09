// lib/sse.ts
type SSEController = ReadableStreamDefaultController<Uint8Array>

const listeners = new Map<string, Set<SSEController>>()

export function addListener(userId: string, controller: SSEController): void {
  if (!listeners.has(userId)) listeners.set(userId, new Set())
  listeners.get(userId)!.add(controller)
}

export function removeListener(userId: string, controller: SSEController): void {
  const set = listeners.get(userId)
  if (!set) return
  set.delete(controller)
  if (set.size === 0) listeners.delete(userId)
}

function sendToController(controller: SSEController, data: string): void {
  try {
    controller.enqueue(new TextEncoder().encode(data))
  } catch {
    // Controller already closed — ignore
  }
}

export function broadcastToUser(userId: string, event: string, payload: unknown): void {
  const set = listeners.get(userId)
  if (!set || set.size === 0) return
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
  for (const controller of set) sendToController(controller, data)
}

export function broadcastToUsers(userIds: string[], event: string, payload: unknown): void {
  for (const userId of userIds) broadcastToUser(userId, event, payload)
}
