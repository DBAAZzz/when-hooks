import { onLaunch, onLoad, onShow, onReady, onHide, onUnload } from '@dcloudio/uni-app'
import { onMounted, onUnmounted } from 'vue'

// 通用的辅助函数用于处理回调
function handleLifecycleEvent(
  eventHook: Function,
  callback: (options?: any) => void,
  customCallback?: (options?: any) => void,
  resetCallback?: () => void,
  resetHooks: Function[] = [],
) {
  resetCallback && resetHooks.forEach((hook) => hook(resetCallback))
  eventHook((options?: any) => {
    callback(options)
    customCallback?.(options)
  })
}

export const _onLaunch = function (
  callback: (options?: App.LaunchShowOption) => void,
  customCallback?: (options?: any) => void,
  resetCallback?: () => void,
) {
  handleLifecycleEvent(onLaunch, callback, customCallback, resetCallback, [onHide])
}

export const _onLoad = function (
  callback: (options?: AnyObject) => void,
  customCallback?: (options?: any) => void,
  resetCallback?: () => void,
) {
  handleLifecycleEvent(onLoad, callback, customCallback, resetCallback, [onUnload])
}

export const _onShow = function (
  callback: () => void,
  customCallback?: () => any,
  resetCallback?: () => void,
) {
  handleLifecycleEvent(onShow, callback, customCallback, resetCallback, [onHide, onUnload])
}

export const _onCreated = function (
  callback: () => void,
  customCallback?: () => any,
  resetCallback?: () => void,
) {
  callback()
  customCallback?.()
  resetCallback && [onUnmounted, onUnload].forEach((hook) => hook(resetCallback))
}

export const _onMounted = function (
  callback: () => void,
  customCallback?: () => any,
  resetCallback?: () => void,
) {
  handleLifecycleEvent(onMounted, callback, customCallback, resetCallback, [onUnmounted])
}

export const _onReady = function (
  callback: () => void,
  customCallback?: () => void,
  resetCallback?: () => void,
) {
  handleLifecycleEvent(onReady, callback, customCallback, resetCallback, [onUnload])
}
