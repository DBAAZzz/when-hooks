import { WhenAllAbortError } from './types'

/**
 * AbortSignal 的结构化子集。
 * 小程序 JS 引擎不保证存在全局 AbortController,core 只依赖这个接口;
 * 原生 AbortSignal 结构兼容,可直接传入。
 */
export interface AbortSignalLike {
  readonly aborted: boolean
  readonly reason?: unknown
  addEventListener(type: 'abort', listener: () => void): void
  removeEventListener(type: 'abort', listener: () => void): void
}

export interface AbortControllerLike {
  readonly signal: AbortSignalLike
  abort(reason?: unknown): void
}

/** 环境有原生 AbortController 则用原生,否则用内置最小实现 */
export function createAbortController(): AbortControllerLike {
  if (typeof AbortController !== 'undefined') {
    return new AbortController()
  }

  let aborted = false
  let reason: unknown
  const listeners = new Set<() => void>()

  return {
    signal: {
      get aborted() {
        return aborted
      },
      get reason() {
        return reason
      },
      addEventListener(_type, listener) {
        listeners.add(listener)
      },
      removeEventListener(_type, listener) {
        listeners.delete(listener)
      }
    },
    abort(abortReason?: unknown) {
      if (aborted) return
      aborted = true
      reason = abortReason ?? new WhenAllAbortError()
      listeners.forEach((fn) => fn())
      listeners.clear()
    }
  }
}
