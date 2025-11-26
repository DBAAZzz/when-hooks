import { createProxy } from "../src/core/init"

interface GlobalData {
  token: string
  userInfo: {
    name: string,
    like: {
      fuck: number,
      unfuck: number
    }
  },
  age: number
}

export const globalData = createProxy({
  token: '',
  userInfo: {
    name: '',
    like: {
      fuck: 1,
      unfuck: 2
    }
  },
  age: 13
})

export function set<K extends keyof GlobalData>(key: K, val: GlobalData[K]) {
  globalData[key] = val
}

export function get<K extends keyof GlobalData>(key: K): GlobalData[K] {
  return globalData[key]
}
