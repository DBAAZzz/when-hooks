import { describe, expect, it, vi } from 'vitest'
import { runInWindow } from '../src'
import { fakeSource, fakeWindow, tick } from './helpers'

describe('runInWindow', () => {
  it('窗口开启且条件满足 → 执行回调', async () => {
    const { window, open } = fakeWindow()
    const cond = fakeSource(true)
    const cb = vi.fn()

    runInWindow(window, [cond], cb)
    open()
    await tick()
    expect(cb).toHaveBeenCalledOnce()
  })

  it('窗口开启但条件未满足 → 不执行;条件满足后执行', async () => {
    const { window, open } = fakeWindow()
    const cond = fakeSource(false)
    const cb = vi.fn()

    runInWindow(window, [cond], cb)
    open()
    await tick()
    expect(cb).not.toHaveBeenCalled()

    cond.set(true)
    await tick()
    expect(cb).toHaveBeenCalledOnce()
  })

  it('窗口关闭取消本轮等待,关闭后条件满足不执行', async () => {
    const { window, open, close } = fakeWindow()
    const cond = fakeSource(false)
    const cb = vi.fn()

    runInWindow(window, [cond], cb)
    open()
    close()
    cond.set(true)
    await tick()
    expect(cb).not.toHaveBeenCalled()
  })

  it('每次窗口开启都是新的一轮', async () => {
    const { window, open, close } = fakeWindow()
    const cond = fakeSource(true)
    const cb = vi.fn()

    runInWindow(window, [cond], cb)
    open()
    await tick()
    close()
    open()
    await tick()
    expect(cb).toHaveBeenCalledTimes(2)
  })
})
