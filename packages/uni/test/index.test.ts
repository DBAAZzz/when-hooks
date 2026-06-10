import { beforeEach, describe, expect, it, test } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
// @ts-ignore
import Index from '../example/index.vue'
import { resetGlobalData } from '../example/global'

describe('use when-hooks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // globalData 是模块级单例,跨用例共享,需要逐用例还原
    resetGlobalData()
  })

  it('pinia的token发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()

    setTimeout(() => {
      // @ts-ignore
      expect(wrapper.vm.customMountedLogin).toBe(true)
    }, 0);
  })

  it('pinia的name发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()

    setTimeout(() => {
      // @ts-ignore
      const { customMountedLoginName } = wrapper.vm
      expect(customMountedLoginName).toBe(false)
    }, 0);
  })


  it('pinia的year发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
      // @ts-ignore

    expect(wrapper.vm.customMountedYear).toBe(false)
    await wrapper.find('#button5').trigger('click')
    setTimeout(() => {
      // @ts-ignore
      expect(wrapper.vm.customMountedYear).toBe(true)
    }, 0);
  })


  it('pinia的name和token都发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    expect(wrapper.vm.customMountedLoginName).toBe(false)

    await wrapper.find('#button').trigger('click')
    setTimeout(() => {
      // @ts-ignore
      expect(wrapper.vm.customMountedLoginName).toBe(true)
    }, 0);
  })

  it('global的token发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalLogin).toBe(false)
    await wrapper.find('#button2').trigger('click')
    setTimeout(() => {
      // @ts-ignore
      expect(wrapper.vm.customMountedGlobalLogin).toBe(true)
    }, 0);
  })

  it('global的age，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    setTimeout(() => {
      // @ts-ignore
      expect(wrapper.vm.customMountedGlobalAge).toBe(true)
    }, 0);
  })

  it('global的user对象发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalUserInfo).toBe(false)
    await wrapper.find('#button3').trigger('click')
    setTimeout(() => {
      // @ts-ignore
      expect(wrapper.vm.customMountedGlobalUserInfo).toBe(true)
    }, 0);
  })

  it('global的user对象的key值发生变化，执行mounted', async () => {
    const wrapper = mount(Index)
    await wrapper.vm.$nextTick()
    // @ts-ignore
    expect(wrapper.vm.customMountedGlobalUserInfo).toBe(false)
    await wrapper.find('#button3').trigger('click')
    // @ts-ignore
    setTimeout(async () => {
      // @ts-ignore
      expect(wrapper.vm.customMountedGlobalUserInfoA).toBe(false)
      await wrapper.find('#button4').trigger('click')
      setTimeout(() => {
        // @ts-ignore
        expect(wrapper.vm.customMountedGlobalUserInfoA).toBe(true)
      }, 0);
    }, 0);
  })
})

