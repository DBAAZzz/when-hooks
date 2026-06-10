/**
 * 一个可订阅的布尔条件源。
 * 各框架适配器负责把自己的状态(Vue reactive、Pinia、zustand 等)翻译成它,
 * 契约与 React useSyncExternalStore 同构。
 */
export interface ConditionSource {
  /** 当前条件是否满足 */
  get(): boolean
  /** 订阅条件变化,返回取消订阅函数 */
  subscribe(onChange: () => void): () => void
}

/**
 * 生命周期窗口:一段"开启 → 关闭"的时间区间。
 * 适配器把框架生命周期接进来,如 uni 的 onShow/onHide、Taro 的 useDidShow/useDidHide。
 */
export interface LifecycleWindow {
  /** 窗口开启(如 onShow);options 为生命周期参数(如 onLoad 的页面参数),会透传给用户回调 */
  onOpen(cb: (options?: unknown) => void): void
  /** 窗口关闭(如 onHide/onUnload) */
  onClose(cb: () => void): void
}

/** whenAll 被窗口关闭等原因取消时,promise 以该错误 reject */
export class WhenAllAbortError extends Error {
  constructor(reason?: string) {
    super(reason ?? 'whenAll aborted')
    this.name = 'WhenAllAbortError'
  }
}
