import { ConditionSource, LifecycleWindow, runInWindow } from '@when-hooks/core'
import { registry } from '../core/registry'
import {
  launchWindow,
  loadWindow,
  showWindow,
  createdWindow,
  mountedWindow,
  readyWindow,
} from '../core/windows'
import { WhenHook, CustomHook } from '../types'

/**
 * 解析 watchKey 为已注册的条件源,过滤未注册的 key。
 * 全部未注册时返回 null(本轮不等待)。
 */
function resolveSources(watchKey: string | string[], method: string): ConditionSource[] | null {
  const keys = Array.isArray(watchKey) ? watchKey : [watchKey]
  const sources: ConditionSource[] = []

  keys.forEach((key) => {
    const source = registry.getSource(key)
    if (source) {
      sources.push(source)
    } else {
      console.error(`Method: ${method}, Error: 监听的值【${key}】未注册！！！请检查init方法`)
    }
  })

  return sources.length > 0 ? sources : null
}

/**
 * 创建命名的条件钩子:窗口开启时等待全部条件满足,执行回调;窗口关闭取消等待。
 * 条件解析延迟到窗口开启时,允许 init 在钩子注册之后调用。
 */
const createWhenHook =
  (windowFactory: () => LifecycleWindow, methodName: string): WhenHook =>
  (watchKey, cb) => {
    runInWindow(windowFactory(), () => resolveSources(watchKey, methodName), cb)
  }

/** 把新签名 (keys, cb) 包装回旧签名 (cb, keys),供 deprecated 别名使用 */
const toLegacy =
  (hook: WhenHook): CustomHook =>
  (cb, watchKey) =>
    hook(watchKey, cb)

/**
 * 在 uniapp 的 onLaunch 生命周期 + 全局状态满足条件时触发
 * @param watchKey 监听的全局状态键(通过 init 方法注册)
 * @param cb 回调函数
 * @example
 * ```ts
 * onLaunchWhen('Login', () => {
 *   console.log('应用启动且 token 已准备好');
 * });
 * ```
 */
export const onLaunchWhen = createWhenHook(launchWindow, 'onLaunchWhen')

/**
 * 在 uniapp 的 onLoad 生命周期 + 全局状态满足条件时触发
 * @param watchKey 监听的全局状态键(通过 init 方法注册)
 * @param cb 回调函数
 * @example
 * ```ts
 * onLoadWhen('UserInfo', () => {
 *   console.log('页面加载且用户信息已准备好');
 * });
 * ```
 */
export const onLoadWhen = createWhenHook(loadWindow, 'onLoadWhen')

/**
 * 在 uniapp 的 onShow 生命周期 + 全局状态满足条件时触发
 * @param watchKey 监听的全局状态键(通过 init 方法注册)
 * @param cb 回调函数
 * @example
 * ```ts
 * onShowWhen(['Login', 'UserInfo'], () => {
 *   console.log('页面显示且 token 和 userInfo 都已准备好');
 * });
 * ```
 */
export const onShowWhen = createWhenHook(showWindow, 'onShowWhen')

/**
 * 在 Vue 的 created 时机(setup 同步阶段)+ 全局状态满足条件时触发
 * @param watchKey 监听的全局状态键(通过 init 方法注册)
 * @param cb 回调函数
 */
export const onCreatedWhen = createWhenHook(createdWindow, 'onCreatedWhen')

/**
 * 在 Vue 的 onMounted 生命周期 + 全局状态满足条件时触发
 * @param watchKey 监听的全局状态键(通过 init 方法注册)
 * @param cb 回调函数
 * @example
 * ```ts
 * onMountedWhen('Login', () => {
 *   console.log('组件挂载且全局状态已准备好');
 * });
 * ```
 */
export const onMountedWhen = createWhenHook(mountedWindow, 'onMountedWhen')

/**
 * 在 uniapp 的 onReady 生命周期 + 全局状态满足条件时触发
 * @param watchKey 监听的全局状态键(通过 init 方法注册)
 * @param cb 回调函数
 */
export const onReadyWhen = createWhenHook(readyWindow, 'onReadyWhen')

/** @deprecated 请使用 onLaunchWhen(keys, cb),注意参数顺序已调整为条件前置 */
export const onCustomLaunch = toLegacy(onLaunchWhen)

/** @deprecated 请使用 onLoadWhen(keys, cb),注意参数顺序已调整为条件前置 */
export const onCustomLoad = toLegacy(onLoadWhen)

/** @deprecated 请使用 onShowWhen(keys, cb),注意参数顺序已调整为条件前置 */
export const onCustomShow = toLegacy(onShowWhen)

/** @deprecated 请使用 onCreatedWhen(keys, cb),注意参数顺序已调整为条件前置 */
export const onCustomCreated = toLegacy(onCreatedWhen)

/** @deprecated 请使用 onMountedWhen(keys, cb),注意参数顺序已调整为条件前置 */
export const onCustomMounted = toLegacy(onMountedWhen)

/** @deprecated 请使用 onReadyWhen(keys, cb),注意参数顺序已调整为条件前置 */
export const onCustomReady = toLegacy(onReadyWhen)
