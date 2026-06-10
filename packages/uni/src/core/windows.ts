import { onLaunch, onLoad, onShow, onReady, onHide, onUnload } from '@dcloudio/uni-app'
import { onMounted, onUnmounted } from 'vue'
import { LifecycleWindow } from '@when-hooks/core'

/**
 * 把 uni-app / Vue 生命周期翻译成 core 的 LifecycleWindow。
 * 窗口工厂必须在 setup 中调用(内部注册组合式生命周期钩子)。
 */

export const launchWindow = (): LifecycleWindow => ({
  onOpen: (cb) => onLaunch(cb),
  onClose: (cb) => onHide(cb)
})

export const loadWindow = (): LifecycleWindow => ({
  onOpen: (cb) => onLoad(cb),
  onClose: (cb) => onUnload(cb)
})

export const showWindow = (): LifecycleWindow => ({
  onOpen: (cb) => onShow(cb),
  onClose: (cb) => {
    onHide(cb)
    onUnload(cb)
  }
})

/** created 没有组合式钩子,注册即视为窗口开启(与原 _onCreated 行为一致) */
export const createdWindow = (): LifecycleWindow => ({
  onOpen: (cb) => cb(),
  onClose: (cb) => {
    onUnmounted(cb)
    onUnload(cb)
  }
})

export const mountedWindow = (): LifecycleWindow => ({
  onOpen: (cb) => onMounted(() => cb()),
  onClose: (cb) => onUnmounted(cb)
})

export const readyWindow = (): LifecycleWindow => ({
  onOpen: (cb) => onReady(cb),
  onClose: (cb) => onUnload(cb)
})
