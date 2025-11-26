export class ProxyManager {
  private proxyTarget: Record<string, any> = {}

  /**
   * 创建响应式代理对象
   * @param target 目标对象
   * @param onPropertyChange 属性变化回调
   */
  createProxy<T extends AnyObject>(
    target: T,
    onPropertyChange: (key: string, newValue: any) => void
  ): T {
    this.proxyTarget = target

    return new Proxy(target, {
      get: (obj, prop: string, receiver) => {
        return Reflect.get(obj, prop, receiver)
      },
      set: (obj, prop: string, newValue) => {
        const oldValue = target[prop]
        if (oldValue === newValue) return true

        const result = Reflect.set(obj, prop, newValue)
        // 通知外部属性变化
        onPropertyChange(prop, newValue)
        return result
      },
    })
  }

  /**
   * 获取代理目标对象
   */
  getProxyTarget() {
    return this.proxyTarget
  }
}