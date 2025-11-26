import { WatchConfig, WatchConfigCollection } from '../types'
import { generatePiniaKey, watchs } from '../utils'

/**
 * 监听配置管理器
 * 负责存储和管理所有监听配置
 */
export class WatchConfigManager {
  private watchConfigs: WatchConfigCollection = {}

  /**
   * 注册监听配置
   */
  registerConfigs(configs: WatchConfigCollection) {
    this.watchConfigs = Object.assign({}, configs)
  }

  /**
   * 获取所有监听配置
   */
  getConfigs(): WatchConfigCollection {
    return this.watchConfigs
  }

  /**
   * 获取指定 key 的配置
   */
  getConfig(key: string): WatchConfig | undefined {
    return this.watchConfigs[key]
  }

  /**
   * 获取所有配置项
   */
  getAllConfigItems(): WatchConfig[] {
    return Object.values(this.watchConfigs)
  }

  /**
   * 处理 Pinia 配置，返回处理后的 key
   */
  processPiniaConfig(config: WatchConfig, originalKey: string): string {
    if (config.type === 'pinia') {
      const piniaKey = generatePiniaKey(originalKey, config.store)
      config.key = piniaKey
      return piniaKey
    }
    return config.key
  }

  /**
   * 设置 Pinia store 监听
   */
  setupPiniaWatch(
    config: WatchConfig,
    originalKey: string,
    onStateChange: (key: string, newValue: any) => void
  ) {
    if (config.type === 'pinia' && config.store) {
      const piniaKey = config.key
      watchs(config.store, originalKey, (newValue: any) => {
        onStateChange(piniaKey, newValue)
      })
    }
  }
}