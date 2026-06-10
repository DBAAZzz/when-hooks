import { ref, watch } from 'vue'
import { onShow, onHide, onLoad, onUnload, onReady } from '@dcloudio/uni-app'
import { onMounted, onUnmounted } from 'vue'
import { LocalHookOptions, LocalHookCallback, LocalCustomHook } from '../types/local-hooks'

/**
 * 创建局部变量监听的自定义钩子
 * @param lifecycleHook 生命周期钩子函数
 * @param resetHooks 需要重置的生命周期钩子（页面隐藏、卸载时）
 * @param hookName 钩子名称（用于调试）
 * @returns 自定义钩子函数
 */
function createLocalCustomHook(
  lifecycleHook: Function,
  resetHooks: Function[],
  hookName: string,
): LocalCustomHook {
  return (callback: LocalHookCallback, options: LocalHookOptions) => {
    const { watchSource, condition, triggerOnChange = false, immediate = false } = options

    const isPageActive = ref(false)
    const hasExecuted = ref(false)

    let stopWatch: (() => void) | null = null // watch 清理函数
    let lifecycleOptions: any = null // 存储生命周期参数

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
      return source.value
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
    const executeCallback = (callbackOptions?: any) => {
      if (!isPageActive.value) {
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

    // 生命周期钩子触发
    lifecycleHook((options?: any) => {
      lifecycleOptions = options // 保存生命周期参数
      isPageActive.value = true

      // 如果启用了 triggerOnChange 且 immediate，避免重复执行
      // 让 watch 的 immediate 来处理首次执行
      if (!(triggerOnChange && immediate)) {
        executeCallback(options)
      }
    })

    // 监听变量变化
    if (triggerOnChange) {
      stopWatch = watch(
        watchSource,
        () => {
          if (isPageActive.value) {
            hasExecuted.value = false // 允许重复触发
            executeCallback(lifecycleOptions) // 传递生命周期参数
          }
        },
        {
          deep: true,
          immediate,
        },
      )
    }

    // 重置钩子：清理状态和停止监听
    resetHooks.forEach((resetHook) => {
      resetHook(() => {
        isPageActive.value = false
        hasExecuted.value = false

        // 停止 watch 监听，防止内存泄漏
        if (stopWatch) {
          stopWatch()
          stopWatch = null
        }
      })
    })
  }
}

/**
 * 局部变量监听的自定义 onLoad 钩子
 * 在 uniapp 的 onLoad 生命周期 + 局部变量满足条件时触发
 *
 * @param callback 回调函数
 * @param options 监听配置
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onLocalCustomLoad } from 'custom-hooks-plus'
 *
 * const pageData = ref(null)
 *
 * // 页面加载时，如果 pageData 不为空，则执行回调
 * onLocalCustomLoad(() => {
 *   console.log('页面加载且数据已准备好', pageData.value)
 * }, {
 *   watchSource: pageData
 * })
 *
 * // 支持多个变量
 * const token = ref('')
 * const userInfo = ref(null)
 * onLocalCustomLoad(() => {
 *   console.log('token 和 userInfo 都准备好了')
 * }, {
 *   watchSource: [token, userInfo]
 * })
 *
 * // 支持自定义条件
 * const count = ref(0)
 * onLocalCustomLoad(() => {
 *   console.log('count 达到 10')
 * }, {
 *   watchSource: count,
 *   condition: (val) => val >= 10
 * })
 * ```
 */
export const onLocalCustomLoad = createLocalCustomHook(onLoad, [onUnload], 'onLocalCustomLoad')

/**
 * 局部变量监听的自定义 onShow 钩子
 * 在 uniapp 的 onShow 生命周期 + 局部变量满足条件时触发
 *
 * @param callback 回调函数
 * @param options 监听配置
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onLocalCustomShow } from 'custom-hooks-plus'
 *
 * const pageData = ref(null)
 *
 * // 每次页面显示时，如果 pageData 不为空，则执行回调
 * onLocalCustomShow(() => {
 *   console.log('页面显示且数据已准备好', pageData.value)
 * }, {
 *   watchSource: pageData
 * })
 *
 * // 监听变化并重复触发
 * onLocalCustomShow(() => {
 *   console.log('pageData 变化了')
 * }, {
 *   watchSource: pageData,
 *   triggerOnChange: true // 变量变化时也触发
 * })
 * ```
 */
export const onLocalCustomShow = createLocalCustomHook(
  onShow,
  [onHide, onUnload],
  'onLocalCustomShow',
)

/**
 * 局部变量监听的自定义 onMounted 钩子
 * 在 Vue 的 onMounted 生命周期 + 局部变量满足条件时触发
 *
 * @param callback 回调函数
 * @param options 监听配置
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onLocalCustomMounted } from 'custom-hooks-plus'
 *
 * const apiData = ref(null)
 *
 * onLocalCustomMounted(() => {
 *   console.log('组件挂载且 API 数据已返回')
 * }, {
 *   watchSource: apiData
 * })
 * ```
 */
export const onLocalCustomMounted = createLocalCustomHook(
  onMounted,
  [onUnmounted],
  'onLocalCustomMounted',
)

/**
 * 局部变量监听的自定义 onReady 钩子
 * 在 uniapp 的 onReady 生命周期 + 局部变量满足条件时触发
 *
 * @param callback 回调函数
 * @param options 监听配置
 *
 * @example
 * ```ts
 * import { ref, computed } from 'vue'
 * import { onLocalCustomReady } from 'custom-hooks-plus'
 *
 * const pageData = ref(null)
 * const isReady = computed(() => pageData.value !== null)
 *
 * onLocalCustomReady(() => {
 *   console.log('页面渲染完成且数据已准备好')
 * }, {
 *   watchSource: isReady
 * })
 * ```
 */
export const onLocalCustomReady = createLocalCustomHook(onReady, [onUnload], 'onLocalCustomReady')
