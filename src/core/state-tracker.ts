import { PromiseStatus } from '../types'
import { flattenObject, getValueByPath, restoreKey } from '../utils'
import { PromiseManager } from './promise-manager'

/**
 * 状态变更追踪器
 * 负责追踪状态变化并触发相应的 Promise 更新
 */
export class StateTracker {
  constructor(private promiseManager: PromiseManager) { }

  /**
   * 追踪状态变化
   * @param key 变化的键
   * @param value 新值
   */
  track(key: string, value: any) {
    let valueType = 'base'
    const promiseMap = this.promiseManager.getPromiseMap()
    const flattenKeys = [key]

    // 处理对象类型值
    if (typeof value === 'object' && value !== null) {
      valueType = 'object'
      flattenKeys.push(...flattenObject(value, key))
    }

    const watchedKeys = flattenKeys.filter(k => promiseMap.has(k))

    watchedKeys.forEach((watchKey) => {
      this.updatePromiseStatus(watchKey, value, valueType)
    })
  }

  /**
   * 更新 Promise 状态
   */
  private updatePromiseStatus(watchKey: string, value: any, valueType: string) {
    const promiseItem = this.promiseManager.getPromiseEntry(watchKey)
    if (!promiseItem) return

    // 获取实际值
    let assignValue = value
    if (valueType === 'object') {
      const pathKey = restoreKey({ ...promiseItem, key: watchKey })
      assignValue = getValueByPath(value, pathKey, value)
    }

    // 处理带有自定义更新条件的情况
    if (promiseItem.onUpdate) {
      this.handleCustomCondition(watchKey, assignValue, promiseItem)
    } else {
      // 处理简单值判断
      this.handleSimpleCondition(watchKey, assignValue, promiseItem)
    }
  }

  /**
   * 处理自定义条件
   */
  private handleCustomCondition(watchKey: string, value: any, promiseItem: any) {
    const shouldFulfill = promiseItem.onUpdate?.(value)

    if (shouldFulfill && promiseItem.status === PromiseStatus.PENDING) {
      this.promiseManager.fulfillPromise(watchKey, value)
    } else if (!shouldFulfill && promiseItem.status === PromiseStatus.FULFILLED) {
      this.promiseManager.resetPromise(watchKey, {
        key: watchKey,
        onUpdate: promiseItem.onUpdate,
      })
    }
  }

  /**
   * 处理简单条件（truthy 判断）
   */
  private handleSimpleCondition(watchKey: string, value: any, promiseItem: any) {
    if (value && promiseItem.status === PromiseStatus.PENDING) {
      this.promiseManager.fulfillPromise(watchKey, value)
    } else if (!value && promiseItem.status === PromiseStatus.FULFILLED) {
      this.promiseManager.resetPromise(watchKey, {
        key: watchKey,
        onUpdate: promiseItem.onUpdate,
      })
    }
  }
}