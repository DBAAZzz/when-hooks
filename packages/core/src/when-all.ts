import { ConditionSource, WhenAllAbortError } from './types'
import { AbortSignalLike } from './abort'

/**
 * 等待全部条件满足。
 * - 订阅所有条件源,任一变化时重新检查;全部为 true 时 resolve 并清理订阅
 * - signal 中止时 reject(WhenAllAbortError)并清理订阅
 * - 调用时条件已全部满足则同步 resolve(微任务内)
 */
export function whenAll(sources: ConditionSource[], signal?: AbortSignalLike): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(toAbortError(signal.reason))
      return
    }

    let settled = false
    const unsubs: Array<() => void> = []

    const cleanup = () => {
      unsubs.forEach((u) => u())
      unsubs.length = 0
      signal?.removeEventListener('abort', onAbort)
    }

    const check = () => {
      if (settled) return
      if (sources.every((s) => s.get())) {
        settled = true
        cleanup()
        resolve()
      }
    }

    const onAbort = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(toAbortError(signal?.reason))
    }

    signal?.addEventListener('abort', onAbort)
    sources.forEach((s) => unsubs.push(s.subscribe(check)))
    check()
  })
}

function toAbortError(reason: unknown): WhenAllAbortError {
  if (reason instanceof WhenAllAbortError) return reason
  return new WhenAllAbortError(typeof reason === 'string' ? reason : undefined)
}

/** 判断错误是否为 whenAll 的取消信号(用户回调里的异常不属于它,应照常抛出) */
export function isAbortError(e: unknown): e is WhenAllAbortError {
  return e instanceof WhenAllAbortError
}
