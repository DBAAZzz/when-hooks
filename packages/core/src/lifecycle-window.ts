import { ConditionSource, LifecycleWindow } from './types'
import { whenAll, isAbortError } from './when-all'
import { AbortControllerLike, createAbortController } from './abort'

/**
 * 本库的核心语义:窗口开启时开始等待条件,全部满足则执行回调;
 * 窗口关闭时取消本轮等待(条件未满足的回调不再执行)。
 * 每次窗口开启都是新的一轮,互不串扰。
 *
 * sources 可传函数实现惰性解析:每次窗口开启时调用,返回 null 表示本轮跳过
 * (适配器用它做"watchKey 是否已注册"的运行时校验)。
 */
export function runInWindow(
  window: LifecycleWindow,
  sources: ConditionSource[] | (() => ConditionSource[] | null),
  cb: (options?: unknown) => void
): void {
  let controller: AbortControllerLike | null = null

  window.onOpen((options) => {
    const resolved = typeof sources === 'function' ? sources() : sources
    if (!resolved) return

    // 上一轮未结束(理论上 onClose 必先于下一次 onOpen,防御性兜底)
    controller?.abort()
    controller = createAbortController()

    whenAll(resolved, controller.signal).then(
      () => cb(options),
      (e) => {
        // 只吞掉取消信号;其他异常(不应存在)继续抛出便于排查
        if (!isAbortError(e)) throw e
      }
    )
  })

  window.onClose(() => {
    controller?.abort()
    controller = null
  })
}
