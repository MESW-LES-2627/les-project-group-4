/**
 * US-08 AT-7: only the newest request may update the list. start() aborts the previous
 * request and returns a ticket; a response is applied only while ticket.isLatest() is true,
 * so an older response that arrives last never replaces newer results.
 */
export function createLatestRequest() {
  let latest = 0
  let controller: AbortController | null = null

  return {
    start() {
      controller?.abort()
      controller = new AbortController()
      const id = ++latest
      return { signal: controller.signal, isLatest: () => id === latest }
    },
    /** Aborts the request in flight and makes sure no response is applied (on unmount). */
    cancel() {
      controller?.abort()
      latest++
    },
  }
}

export type LatestRequests = ReturnType<typeof createLatestRequest>

/**
 * US-08 AT-7: runs one request through the latest-wins guard. `apply` is called only if no
 * newer request started while this one was in flight. useCatalogItems uses exactly this
 * function, so the AT-7 test exercises the same code path as the UI.
 */
export async function runLatest<T>(
  requests: LatestRequests,
  send: (signal: AbortSignal) => Promise<T>,
  apply: (result: T) => void,
): Promise<void> {
  const ticket = requests.start()
  const result = await send(ticket.signal)
  if (ticket.isLatest()) {
    apply(result)
  }
}
