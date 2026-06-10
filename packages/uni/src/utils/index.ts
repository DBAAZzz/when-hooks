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
