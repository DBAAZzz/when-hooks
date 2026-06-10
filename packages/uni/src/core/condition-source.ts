import { watch } from 'vue'
import { ConditionSource } from '@when-hooks/core'

/**
 * 把 Vue 响应式 getter 翻译成 core 的 ConditionSource。
 * predicate 缺省时按 truthy 判断(与原 onUpdate 语义一致)。
 */
export function fromGetter(
  getter: () => unknown,
  predicate?: (val: any) => boolean
): ConditionSource {
  const isMet = () => {
    const val = getter()
    if (predicate) {
      try {
        return !!predicate(val)
      } catch (e) {
        console.error('[when-hooks] onUpdate 执行出错:', e)
        return false
      }
    }
    return !!val
  }

  return {
    get: isMet,
    subscribe(onChange) {
      // sync flush:条件翻转立即通知,不依赖组件渲染时机
      return watch(isMet, () => onChange(), { flush: 'sync' })
    }
  }
}
