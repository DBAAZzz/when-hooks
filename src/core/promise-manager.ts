import { PromiseMapValue, PromiseStatus, WatchConfig } from '../types'

/**
 * Promise 状态管理器
 * 负责管理所有监听键的 Promise 状态
 */
export class PromiseManager {
  private promiseCache = new Map<string, Promise<any>>()
  private promiseMap = new Map<string, PromiseMapValue>()

  /**
   * 创建一个 Pending 状态的 Promise
   */
  createPendingPromise(watch: WatchConfig): Promise<any> {
    return new Promise((resolve) => {
      this.promiseMap.set(watch.key, {
        status: PromiseStatus.PENDING,
        resolve,
        type: watch.type,
        onUpdate: watch.onUpdate,
      })
    })
  }

  /**
   * 设置 Promise 缓存
   */
  setPromiseCache(key: string, promise: Promise<any>) {
    this.promiseCache.set(key, promise)
  }

  /**
   * 获取 Promise 缓存
   */
  getPromiseCache() {
    return this.promiseCache
  }

  /**
   * 获取 Promise 状态映射
   */
  getPromiseMap() {
    return this.promiseMap
  }

  /**
   * 获取指定 key 的 Promise 条目
   */
  getPromiseEntry(key: string): PromiseMapValue | undefined {
    return this.promiseMap.get(key)
  }

  /**
   * 更新 Promise 状态为 FULFILLED
   */
  fulfillPromise(key: string, value: any) {
    const entry = this.promiseMap.get(key)
    if (entry && entry.status === PromiseStatus.PENDING) {
      entry.status = PromiseStatus.FULFILLED
      entry.resolve(value)
    }
  }

  /**
   * 重置 Promise 状态为 PENDING
   */
  resetPromise(key: string, watch: WatchConfig) {
    const newPromise = this.createPendingPromise(watch)
    this.promiseCache.set(key, newPromise)
  }
}