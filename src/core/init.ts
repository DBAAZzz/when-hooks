import { getValueByPath } from '../utils'
import { ProxyManager } from './proxy-manager'
import { PromiseManager } from './promise-manager'
import { WatchConfigManager } from './watch-config-manager'
import { StateTracker } from './state-tracker'
import { WatchConfigCollection } from '../types'

/**
 * CustomHooks 协调器
 */
class CustomHooks {
  private proxyManager: ProxyManager
  private promiseManager: PromiseManager
  private watchConfigManager: WatchConfigManager
  private stateTracker: StateTracker

  constructor() {
    this.proxyManager = new ProxyManager()
    this.promiseManager = new PromiseManager()
    this.watchConfigManager = new WatchConfigManager()
    this.stateTracker = new StateTracker(this.promiseManager)
  }

  /**
   * 创建响应式代理
   */
  createProxy<T extends AnyObject>(target: T): T {
    return this.proxyManager.createProxy(target, (key, value) => {
      // 代理变化时，通知状态追踪器
      this.stateTracker.track(key, value)
    })
  }

  /**
   * 初始化监听配置
   */
  init(watchObject: WatchConfigCollection): void {
    this.watchConfigManager.registerConfigs(watchObject)
    const watchItems = this.watchConfigManager.getAllConfigItems()

    watchItems.forEach((config) => {
      const originalKey = config.key

      // 获取初始值
      const defaultVal = getValueByPath(
        config.type === 'pinia' ? config.store.$state : this.proxyManager.getProxyTarget(),
        originalKey
      )

      // 处理 Pinia 配置
      if (config.type === 'pinia') {
        this.watchConfigManager.processPiniaConfig(config, originalKey)
        this.watchConfigManager.setupPiniaWatch(config, originalKey, (key, value) => {
          this.stateTracker.track(key, value)
        })
      }

      // 创建 Promise 并初始化追踪
      if (config.key) {
        const promise = this.promiseManager.createPendingPromise(config)
        this.promiseManager.setPromiseCache(config.key, promise)
        this.stateTracker.track(config.key, defaultVal)
      } else {
        console.error('init 方法无效的监听配置：缺少 key 属性')
      }
    })
  }

  /**
   * 获取 Promise 缓存（向后兼容）
   */
  getPromiseCache() {
    return this.promiseManager.getPromiseCache()
  }

  /**
   * 获取 Promise 映射（向后兼容）
   */
  getPromiseMap() {
    return this.promiseManager.getPromiseMap()
  }

  /**
   * 获取监听配置（向后兼容）
   */
  getWatchConfigs() {
    return this.watchConfigManager.getConfigs()
  }
}

export const customHooks = new CustomHooks()

// 导出的公共 API 保持不变
export function init(watchObject: WatchConfigCollection) {
  customHooks.init(watchObject)
}

export const createProxy = <T extends AnyObject>(target: T): T =>
  customHooks.createProxy(target)

/** @deprecated */
export const proxyData = <T extends AnyObject>(target: T): T =>
  createProxy(target)