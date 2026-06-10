import { watch } from 'vue'
/**
 * 生成唯一uuid
 * @returns
 */
export function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function flattenObject(obj: any, parentKey = ''): string[] {
  let keys: string[] = []
  for (const key in obj) {
    const newKey = parentKey ? `${parentKey}.${key}` : key
    keys.push(newKey)
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(flattenObject(obj[key], newKey))
    }
  }
  return keys
}

/**
 * 比较两个数组的共同子集
 * @param arr1
 * @param arr2
 * @returns
 */
export function findCommonSubset(arr1: string[], arr2: string[]) {
  const set1 = new Set(arr1)
  const result = arr2.filter((item) => set1.has(item))
  return result
}

/**
 * 通过字符串路径获取对象值
 */
export function getValueByPath(obj: Record<string, any>, path: string, defaultValue = undefined) {
  const keys = path.split('.')
  const result = keys.reduce((current, key) => {
    return current ? current[key] : undefined
  }, obj)

  return result === undefined ? defaultValue : result
}

export function getSharedKey(watchKey: string[] | string, uuid: string): string {
  if (!Array.isArray(watchKey)) {
    watchKey = [watchKey]
  }
  return watchKey.join('-') + `-${uuid}`
}

export function generatePiniaKey(key: string, store: any): string {
  return `[pinia|${store.$id}]-${key}`
}

export function restoreKey({ key, type }: any) {
  if (type === 'pinia') {
    key = key.split('-')[1]
  }
  return getFirstSegmentAfterDot(key)
}

function getFirstSegmentAfterDot(path: string) {
  const parts = path.split('.')
  return parts.length > 1 ? parts.slice(1).join('.') : path
}

export function watchs(store: any, key: string, callback: Function) {
  const parentKey = key.split('.')[0] || key

  return watch(
    () => store.$state[parentKey],
    (newVal) => {
      callback(newVal)
    },
    {
      immediate: false,
      deep: true,
    },
  )
}
