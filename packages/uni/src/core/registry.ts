import { reactive } from 'vue'
import { ConditionSource } from '@when-hooks/core'
import { WatchConfig, WatchConfigCollection } from '../types'
import { getValueByPath } from '../utils'
import { fromGetter } from './condition-source'

/**
 * 监听注册表:把 init 的配置翻译成 core 的 ConditionSource。
 * 不再有 promiseCache/promiseMap/track —— 条件即响应式 getter,
 * 状态翻转、嵌套属性、初始值全部由 Vue 响应式系统处理。
 */
class WatchRegistry {
  private sources = new Map<string, ConditionSource>()
  private globalState: Record<string, any> = reactive({})

  /**
   * 创建全局响应式状态。
   * 基于 Vue reactive,嵌套属性赋值(globalData.userInfo.name = 'x')天然可被监听。
   */
  createProxy<T extends AnyObject>(target: T): T {
    const proxy = reactive(target) as T
    this.globalState = proxy
    return proxy
  }

  /** 注册监听配置,可多次调用(后注册的同名 key 覆盖先注册的) */
  register(configs: WatchConfigCollection): void {
    Object.entries(configs).forEach(([name, config]) => {
      if (!config.key) {
        console.error(`init 方法无效的监听配置【${name}】:缺少 key 属性`)
        return
      }
      this.sources.set(name, this.toSource(config))
    })
  }

  private toSource(config: WatchConfig): ConditionSource {
    // root 在 getter 内惰性解析:createProxy 与 init 的调用顺序不再有时序约束
    const getRoot = () => (config.type === 'pinia' ? config.store.$state : this.globalState)
    return fromGetter(() => getValueByPath(getRoot(), config.key), config.onUpdate)
  }

  /** 取已注册的条件源,未注册返回 undefined */
  getSource(name: string): ConditionSource | undefined {
    return this.sources.get(name)
  }

  has(name: string): boolean {
    return this.sources.has(name)
  }
}

export const registry = new WatchRegistry()

/**
 * 注册监听配置
 * @param watchObject 监听配置集合,key 为监听名,value 为 WatchConfig
 */
export function init(watchObject: WatchConfigCollection) {
  registry.register(watchObject)
}

/** 创建全局响应式状态对象(基于 Vue reactive) */
export const createProxy = <T extends AnyObject>(target: T): T => registry.createProxy(target)

/** @deprecated 即将被弃用,请使用 createProxy 方法 */
export const proxyData = <T extends AnyObject>(target: T): T => createProxy(target)
