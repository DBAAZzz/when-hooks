import { WatchSource } from 'vue'

/**
 * 局部变量监听配置选项
 */
export interface LocalHookOptions {
  /**
   * 监听的响应式变量（ref、reactive、computed 等）
   * 可以是单个 WatchSource 或数组
   */
  watchSource: WatchSource<any> | WatchSource<any>[]

  /**
   * 条件判断函数
   * @param value 当前值
   * @returns 是否满足条件，返回 true 时触发回调
   * @default 默认判断：非 null/undefined/false/0/'' 即为满足
   */
  condition?: (value: any) => boolean

  /**
   * 是否在变量变化时也触发回调
   * @default false - 默认只在生命周期触发一次
   *
   * - false: 只在生命周期（如 onShow）时检查条件并触发
   * - true: 在生命周期触发后，变量每次变化时都重新检查条件
   */
  triggerOnChange?: boolean

  /**
   * 是否立即执行（仅在 triggerOnChange 为 true 时有效）
   * @default false
   */
  immediate?: boolean
}

/**
 * 局部自定义钩子的回调函数类型
 */
export type LocalHookCallback = (options?: any) => void

/**
 * 局部自定义钩子类型
 */
export type LocalCustomHook = (callback: LocalHookCallback, options: LocalHookOptions) => void
