import { describe, expect, it } from 'vitest'
import { whenAll, isAbortError, WhenAllAbortError } from '../src'
import { fakeSource } from './helpers'

describe('whenAll', () => {
  it('调用时条件已全部满足 → 立即 resolve', async () => {
    const a = fakeSource(true)
    const b = fakeSource(true)
    await expect(whenAll([a, b])).resolves.toBeUndefined()
  })

  it('部分条件未满足 → 等待,全部满足后 resolve', async () => {
    const a = fakeSource(false)
    const b = fakeSource(true)
    const p = whenAll([a, b])

    a.set(true)
    await expect(p).resolves.toBeUndefined()
  })

  it('条件翻转(满足→不满足→满足)不会导致永久挂起', async () => {
    const a = fakeSource(false)
    const b = fakeSource(true)
    const p = whenAll([a, b])

    b.set(false) // 翻转
    a.set(true)  // 此时 b 不满足,不应 resolve
    let resolved = false
    p.then(() => (resolved = true))
    await new Promise((r) => setTimeout(r, 0))
    expect(resolved).toBe(false)

    b.set(true) // 再次全部满足
    await expect(p).resolves.toBeUndefined()
  })

  it('abort → reject(WhenAllAbortError),且 isAbortError 可识别', async () => {
    const a = fakeSource(false)
    const ac = new AbortController()
    const p = whenAll([a], ac.signal)

    ac.abort()
    await expect(p).rejects.toBeInstanceOf(WhenAllAbortError)
    await p.catch((e) => expect(isAbortError(e)).toBe(true))
  })

  it('传入已 abort 的 signal → 立即 reject', async () => {
    const a = fakeSource(true)
    const ac = new AbortController()
    ac.abort()
    await expect(whenAll([a], ac.signal)).rejects.toBeInstanceOf(WhenAllAbortError)
  })

  it('resolve 后清理所有订阅(无泄漏)', async () => {
    const a = fakeSource(false)
    const p = whenAll([a])
    expect(a.listenerCount()).toBe(1)

    a.set(true)
    await p
    expect(a.listenerCount()).toBe(0)
  })

  it('abort 后清理所有订阅(无泄漏)', async () => {
    const a = fakeSource(false)
    const ac = new AbortController()
    const p = whenAll([a], ac.signal)
    expect(a.listenerCount()).toBe(1)

    ac.abort()
    await p.catch(() => {})
    expect(a.listenerCount()).toBe(0)
  })

  it('空条件列表 → 立即 resolve', async () => {
    await expect(whenAll([])).resolves.toBeUndefined()
  })
})
