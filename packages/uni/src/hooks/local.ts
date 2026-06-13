import { isRef, ref, watch, type WatchStopHandle } from 'vue'
import { onShow, onHide, onLoad, onUnload, onReady } from '@dcloudio/uni-app'
import { onMounted, onUnmounted } from 'vue'
import {
  LocalHookOptions,
  LocalHookCallback,
  LocalWhenHook,
  LocalCustomHook,
} from '../types/local-hooks'

/**
 * 创建局部变量监听的条件钩子
 * @param lifecycleHook 生命周期钩子函数
 * @param resetHooks 需要重置的生命周期钩子（页面隐藏、卸载时）
 * @param hookName 钩子名称（用于调试）
 * @returns 条件钩子函数
 */
function createLocalWhenHook(
  lifecycleHook: Function,
  resetHooks: Function[],
  hookName: string,
): LocalWhenHook {
  return (options: LocalHookOptions, callback: LocalHookCallback) => {
    const { watchSource, condition, triggerOnChange = false, immediate = false } = options

    const isPageActive = ref(false)
    const hasExecuted = ref(false)

    let stopWatch: WatchStopHandle | null = null // watch 清理函数
    let lifecycleOptions: any = null // 存储生命周期参数
    let hasOpened = false

    /**
     * 检查单个值是否满足条件
     */
    const checkCondition = (value: any): boolean => {
      if (condition) {
        try {
          return condition(value)
        } catch (error) {
          console.error(`[${hookName}] Condition check error:`, error)
          return false
        }
      }
      return !!value
    }

    /**
     * 获取 WatchSource 的当前值
     */
    const getSourceValue = (source: any): any => {
      if (typeof source === 'function') {
        return source()
      }
      if (isRef(source)) {
        return source.value
      }
      return source
    }

    /**
     * 检查所有监听源是否都满足条件
     */
    const checkAllConditions = (): boolean => {
      const sources = Array.isArray(watchSource) ? watchSource : [watchSource]

      // 边界检查：空数组情况
      if (sources.length === 0) {
        console.warn(`[${hookName}] watchSource is empty array`)
        return false
      }

      return sources.every((source) => {
        const value = getSourceValue(source)
        return checkCondition(value)
      })
    }

    /**
     * 执行回调函数（带条件检查和防重复逻辑）
     */
    const executeCallback = (callbackOptions?: any, requireActive = true) => {
      if (requireActive && !isPageActive.value) {
        return
      }

      const allConditionsMet = checkAllConditions()

      if (allConditionsMet && !hasExecuted.value) {
        try {
          callback(callbackOptions)
          hasExecuted.value = true
        } catch (error) {
          console.error(`[${hookName}] Callback execution error:`, error)
        }
      }
    }

    const ensureWatch = () => {
      if (!triggerOnChange || stopWatch) return

      stopWatch = watch(
        watchSource,
        () => {
          if (isPageActive.value) {
            hasExecuted.value = false // 允许 active 窗口内的变化重复触发
            executeCallback(lifecycleOptions)
            return
          }

          // immediate 只允许首次生命周期打开前抢跑;关闭后的等待仍交还给生命周期窗口。
          if (immediate && !hasOpened) {
            executeCallback(lifecycleOptions, false)
          }
        },
        {
          deep: true,
          immediate,
        },
      )
    }

    ensureWatch()

    // 生命周期钩子触发
    lifecycleHook((options?: any) => {
      lifecycleOptions = options // 保存生命周期参数
      hasOpened = true
      isPageActive.value = true
      ensureWatch()

      executeCallback(options)
    })

    // 重置钩子：清理状态和停止监听
    resetHooks.forEach((resetHook) => {
      resetHook(() => {
        isPageActive.value = false
        hasExecuted.value = false
        lifecycleOptions = null

        if (stopWatch) {
          stopWatch()
          stopWatch = null
        }
      })
    })
  }
}

/** 把新签名 (options, cb) 包装回旧签名 (cb, options),供 deprecated 别名使用 */
const toLegacy =
  (hook: LocalWhenHook): LocalCustomHook =>
  (callback, options) =>
    hook(options, callback)

/**
 * 局部变量监听的条件 onLoad 钩子
 * 在 uniapp 的 onLoad 生命周期 + 局部变量满足条件时触发
 *
 * @param options 监听配置
 * @param callback 回调函数
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onLoadWhenLocal } from '@when-hooks/uni'
 *
 * const pageData = ref(null)
 *
 * // 页面加载时，如果 pageData 不为空，则执行回调
 * onLoadWhenLocal({ watchSource: pageData }, () => {
 *   console.log('页面加载且数据已准备好', pageData.value)
 * })
 *
 * // 支持多个变量
 * const token = ref('')
 * const userInfo = ref(null)
 * onLoadWhenLocal({ watchSource: [token, userInfo] }, () => {
 *   console.log('token 和 userInfo 都准备好了')
 * })
 *
 * // 支持自定义条件
 * const count = ref(0)
 * onLoadWhenLocal({ watchSource: count, condition: (val) => val >= 10 }, () => {
 *   console.log('count 达到 10')
 * })
 * ```
 */
export const onLoadWhenLocal = createLocalWhenHook(onLoad, [onUnload], 'onLoadWhenLocal')

/**
 * 局部变量监听的条件 onShow 钩子
 * 在 uniapp 的 onShow 生命周期 + 局部变量满足条件时触发
 *
 * @param options 监听配置
 * @param callback 回调函数
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onShowWhenLocal } from '@when-hooks/uni'
 *
 * const pageData = ref(null)
 *
 * // 每次页面显示时，如果 pageData 不为空，则执行回调
 * onShowWhenLocal({ watchSource: pageData }, () => {
 *   console.log('页面显示且数据已准备好', pageData.value)
 * })
 *
 * // 监听变化并重复触发
 * onShowWhenLocal({ watchSource: pageData, triggerOnChange: true }, () => {
 *   console.log('pageData 变化了')
 * })
 * ```
 */
export const onShowWhenLocal = createLocalWhenHook(onShow, [onHide, onUnload], 'onShowWhenLocal')

/**
 * 局部变量监听的条件 onMounted 钩子
 * 在 Vue 的 onMounted 生命周期 + 局部变量满足条件时触发
 *
 * @param options 监听配置
 * @param callback 回调函数
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onMountedWhenLocal } from '@when-hooks/uni'
 *
 * const apiData = ref(null)
 *
 * onMountedWhenLocal({ watchSource: apiData }, () => {
 *   console.log('组件挂载且 API 数据已返回')
 * })
 * ```
 */
export const onMountedWhenLocal = createLocalWhenHook(
  onMounted,
  [onUnmounted],
  'onMountedWhenLocal',
)

/**
 * 局部变量监听的条件 onReady 钩子
 * 在 uniapp 的 onReady 生命周期 + 局部变量满足条件时触发
 *
 * @param options 监听配置
 * @param callback 回调函数
 *
 * @example
 * ```ts
 * import { ref, computed } from 'vue'
 * import { onReadyWhenLocal } from '@when-hooks/uni'
 *
 * const pageData = ref(null)
 * const isReady = computed(() => pageData.value !== null)
 *
 * onReadyWhenLocal({ watchSource: isReady }, () => {
 *   console.log('页面渲染完成且数据已准备好')
 * })
 * ```
 */
export const onReadyWhenLocal = createLocalWhenHook(onReady, [onUnload], 'onReadyWhenLocal')

/** @deprecated 请使用 onLoadWhenLocal(options, cb),注意参数顺序已调整为配置前置 */
export const onLocalCustomLoad = toLegacy(onLoadWhenLocal)

/** @deprecated 请使用 onShowWhenLocal(options, cb),注意参数顺序已调整为配置前置 */
export const onLocalCustomShow = toLegacy(onShowWhenLocal)

/** @deprecated 请使用 onMountedWhenLocal(options, cb),注意参数顺序已调整为配置前置 */
export const onLocalCustomMounted = toLegacy(onMountedWhenLocal)

/** @deprecated 请使用 onReadyWhenLocal(options, cb),注意参数顺序已调整为配置前置 */
export const onLocalCustomReady = toLegacy(onReadyWhenLocal)
