import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
// @ts-ignore
import Index from '../example/index.vue'
import { resetGlobalData } from '../example/global'
import { init, onMountedWhen, onMountedWhenLocal } from '../src'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

enableAutoUnmount(afterEach)

describe('use when-hooks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // globalData 是模块级单例,跨用例共享,需要逐用例还原
    resetGlobalData()
  })

  it('pinia的token发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    await tick()

    // @ts-ignore
    expect(wrapper.vm.customMountedLogin).toBe(true)
  })

  it('pinia的name发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    await tick()

    // @ts-ignore
    const { customMountedLoginName } = wrapper.vm
    expect(customMountedLoginName).toBe(false)
  })


  it('pinia的year发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
      // @ts-ignore

    expect(wrapper.vm.customMountedYear).toBe(false)
    await wrapper.find('#button5').trigger('click')
    await tick()

    // @ts-ignore
    expect(wrapper.vm.customMountedYear).toBe(true)
  })


  it('pinia的name和token都发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    expect(wrapper.vm.customMountedLoginName).toBe(false)

    await wrapper.find('#button').trigger('click')
    await tick()

    // @ts-ignore
    expect(wrapper.vm.customMountedLoginName).toBe(true)
  })

  it('global的token发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalLogin).toBe(false)
    await wrapper.find('#button2').trigger('click')
    await tick()

    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalLogin).toBe(true)
  })

  it('global的age，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    await tick()

    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalAge).toBe(true)
  })

  it('global的user对象发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalUserInfo).toBe(false)
    await wrapper.find('#button3').trigger('click')
    await tick()

    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalUserInfo).toBe(true)
  })

  it('global的user对象的key值发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalUserInfo).toBe(false)
    await wrapper.find('#button3').trigger('click')
    await tick()

    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalUserInfoA).toBe(false)
    await wrapper.find('#button4').trigger('click')
    await tick()

    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalUserInfoA).toBe(true)
  })

  it('全局钩子包含未注册 key 时整组不执行', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    init({
      RegisteredForMissingKeyTest: {
        key: 'age',
      },
    })

    const Component = defineComponent({
      setup() {
        const called = ref(false)
        onMountedWhen(['RegisteredForMissingKeyTest', 'MissingKeyForTest'], () => {
          called.value = true
        })
        return { called }
      },
      template: '<div />',
    })

    const wrapper = mount(Component)
    await wrapper.vm.$nextTick()
    await tick()

    expect(wrapper.vm.called).toBe(false)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('局部钩子 immediate 首次触发后 mounted 不重复触发,active 后变化可再次触发', async () => {
    const Component = defineComponent({
      setup() {
        const source = ref('ready')
        const called = ref(0)
        onMountedWhenLocal(
          { watchSource: source, triggerOnChange: true, immediate: true },
          () => {
            called.value += 1
          },
        )
        return { called, source }
      },
      template: '<div />',
    })

    const wrapper = mount(Component)
    await wrapper.vm.$nextTick()
    await tick()

    expect(wrapper.vm.called).toBe(1)

    wrapper.vm.source = 'changed'
    await wrapper.vm.$nextTick()
    await tick()

    expect(wrapper.vm.called).toBe(2)
  })
})
