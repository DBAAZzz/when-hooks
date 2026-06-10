import { ConditionSource, LifecycleWindow } from '../src'

/** 测试用 fake 条件源 —— 也是适配器实现 ConditionSource 的最小参考 */
export function fakeSource(initial: boolean) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    set(v: boolean) {
      value = v
      listeners.forEach((fn) => fn())
    },
    listenerCount: () => listeners.size
  } satisfies ConditionSource & Record<string, unknown>
}

/** 测试用 fake 生命周期窗口 */
export function fakeWindow() {
  const openCbs: Array<() => void> = []
  const closeCbs: Array<() => void> = []
  const window: LifecycleWindow = {
    onOpen: (cb) => openCbs.push(cb),
    onClose: (cb) => closeCbs.push(cb)
  }
  return {
    window,
    open: () => openCbs.forEach((cb) => cb()),
    close: () => closeCbs.forEach((cb) => cb())
  }
}

export const tick = () => new Promise<void>((r) => setTimeout(r, 0))
