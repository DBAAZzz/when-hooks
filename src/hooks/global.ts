import { customHooks } from '../core/init'
import { _onLaunch, _onLoad, _onShow, _onReady, _onMounted, _onCreated } from '../core/rewrite'
import { generateUUIDv4, getSharedKey } from '../utils'
import { CustomHook, HookFunction, PromiseStatus } from '../types'

const shared: AnyObject = {}

const WATCH_KEY_NOT_REGISTERED_ERROR_MESSAGE = 'watchKey 未注册'

/**
 * 获取有效的已注册的 watchKey
 * @param watchKey 监听的键（字符串或字符串数组）
 * @param method 调用的方法名
 * @returns 有效的键数组
 */
function getValidWatchKeys(watchKey: string | string[], method: string): string[] {
  const keys = Array.isArray(watchKey) ? watchKey : [watchKey]
  const watchConfigs = customHooks.getWatchConfigs()

  return keys.filter((key) => {
    if (key in watchConfigs) return true
    console.error(`Method: ${method}, Error: 监听的值【${key}】未注册！！！请检查init方法`)
    return false
  })
}

/**
 * 重置回调，清理 Promise 缓存
 * @param watchKey 监听的键
 * @param uuid 唯一标识符
 */
function resetCallback(watchKey: string[] | string, uuid: string) {
  const key = getSharedKey(watchKey, uuid)
  const current = shared[key]
  if (current && typeof current.reject === 'function') {
    current.reject(new Error(`Cancelled: ${key}`))
  }
  delete shared[key]
}

/**
 * 创建全局状态监听的 Promise
 * @param watchKey 监听的键
 * @param uuid 唯一标识符
 * @param method 方法名
 * @returns Promise 对象
 */
function createHookPromise(watchKey: string[] | string, uuid: string, method: string) {
  // 通过 watchKey + uuid 生成唯一 key
  const sharedKey = getSharedKey(watchKey, uuid)
  shared[sharedKey] = {}
  shared[sharedKey].promise = new Promise((_, reject) => {
    shared[sharedKey].reject = reject
  })

  // 获取有效的注册过的key
  const _watchKey = getValidWatchKeys(watchKey, method)
  const promiseMap = customHooks.getPromiseMap()
  const watchConfigs = customHooks.getWatchConfigs()
  const promiseCache = customHooks.getPromiseCache()

  // 如果监听的有效值为空，则返回一个失败的 promise
  if (_watchKey.length == 0) {
    return Promise.reject(new Error(WATCH_KEY_NOT_REGISTERED_ERROR_MESSAGE))
  }

  // 根据 key 生成 promise iterable
  const iterable = _watchKey.map((i) => {
    const promiseKey = watchConfigs[i].key
    return promiseMap.get(promiseKey)!.status == PromiseStatus.FULFILLED
      ? Promise.resolve()
      : promiseCache.get(promiseKey)
  })

  const current = shared[sharedKey] // 记录本轮条目
  const promise = Promise.race([Promise.all(iterable), shared[sharedKey].promise]).finally(() => {
    if (shared[sharedKey] === current) {
      // 身份校验，避免误删后续新条目
      delete shared[sharedKey]
    }
  })

  return promise
}

/**
 * 创建自定义全局状态监听钩子
 * @param hookFn 生命周期钩子函数
 * @param cb 用户回调函数
 * @param watchKey 监听的键
 * @param methodName 方法名
 */
function createCustomHook(
  hookFn: HookFunction,
  cb: (options?: any) => void,
  watchKey: string[] | string,
  methodName: string,
) {
  const uuid = generateUUIDv4()
  hookFn(
    () => { },
    async (options) => {
      try {
        await createHookPromise(watchKey, uuid, methodName)
        cb(options)
      } catch (e: any) {
        const isExpectedRejection =
          e?.message?.startsWith('Cancelled:') ||
          e?.message === WATCH_KEY_NOT_REGISTERED_ERROR_MESSAGE

        if (!isExpectedRejection) {
          console.error(`[${methodName}] 意外错误:`, e)
        }
      }
    },
    () => {
      resetCallback(watchKey, uuid)
    },
  )
}

/**
 * 创建命名的自定义钩子
 * @param hookFn 生命周期钩子函数
 * @param methodName 方法名
 * @returns 自定义钩子函数
 */
const createNamedHook =
  (hookFn: HookFunction, methodName: string): CustomHook =>
    (cb, watchKey) =>
      createCustomHook(hookFn, cb, watchKey, methodName)

/**
 * 全局状态监听的自定义 onLaunch 钩子
 * 在 uniapp 的 onLaunch 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 * @example
 * ```ts
 * onCustomLaunch(() => {
 *   console.log('应用启动且 token 已准备好');
 * }, 'Login');
 * ```
 */
export const onCustomLaunch = createNamedHook(_onLaunch, 'onCustomLaunch')

/**
 * 全局状态监听的自定义 onLoad 钩子
 * 在 uniapp 的 onLoad 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 * @example
 * ```ts
 * onCustomLoad(() => {
 *   console.log('页面加载且用户信息已准备好');
 * }, 'UserInfo');
 * ```
 */
export const onCustomLoad = createNamedHook(_onLoad, 'onCustomLoad')

/**
 * 全局状态监听的自定义 onShow 钩子
 * 在 uniapp 的 onShow 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 * @example
 * ```ts
 * onCustomShow(() => {
 *   console.log('页面显示且 token 和 userInfo 都已准备好');
 * }, ['Login', 'UserInfo']);
 * ```
 */
export const onCustomShow = createNamedHook(_onShow, 'onCustomShow')

/**
 * 全局状态监听的自定义 onCreated 钩子
 * 在 Vue 的 created 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 */
export const onCustomCreated = createNamedHook(_onCreated, 'onCustomCreated')

/**
 * 全局状态监听的自定义 onMounted 钩子
 * 在 Vue 的 onMounted 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 * @example
 * ```ts
 * onCustomMounted(() => {
 *   console.log('组件挂载且全局状态已准备好');
 * }, 'Login');
 * ```
 */
export const onCustomMounted = createNamedHook(_onMounted, 'onCustomMounted')

/**
 * 全局状态监听的自定义 onReady 钩子
 * 在 uniapp 的 onReady 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 */
export const onCustomReady = createNamedHook(_onReady, 'onCustomReady')
