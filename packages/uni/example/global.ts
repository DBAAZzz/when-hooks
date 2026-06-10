import { createProxy } from "../src"

interface GlobalData {
  token: string
  userInfo: Record<string, any> | null
  age: number
}

export const globalData = createProxy<GlobalData>({
  token: '',
  // 初始为空:条件不满足,点击设置后才触发监听 userInfo 的钩子
  userInfo: null,
  age: 13
})

/** 测试用:恢复初始状态(模块级单例跨测试用例共享) */
export function resetGlobalData() {
  globalData.token = ''
  globalData.userInfo = null
  globalData.age = 13
}

export function set<K extends keyof GlobalData>(key: K, val: GlobalData[K]) {
  globalData[key] = val
}

export function get<K extends keyof GlobalData>(key: K): GlobalData[K] {
  return globalData[key]
}
