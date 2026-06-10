# when-hooks

适用于 uniapp、Vue3 的**条件生命周期钩子**库:在「生命周期到达」+「自定义状态满足」两个条件同时成立时执行代码。

如下面这个钩子的触发时机为 `Login 对应的状态满足条件` + `uniapp 的 onShow 生命周期`:

```ts
onShowWhen(['Login'], () => {
  console.log('已登录且页面 onShow,才会执行这里')
})
```

- [when-hooks](#when-hooks)
  - [仓库结构](#仓库结构)
  - [下载和使用](#下载和使用)
    - [下载](#下载)
    - [createProxy 的作用](#createproxy-的作用)
    - [init 的作用](#init-的作用)
    - [在页面中使用钩子](#在页面中使用钩子)
  - [可用的条件钩子](#可用的条件钩子)
    - [全局状态钩子](#全局状态钩子)
    - [局部状态钩子](#局部状态钩子)
  - [从 custom-hooks-plus 迁移](#从-custom-hooks-plus-迁移)
  - [开发](#开发)
  - [联系作者](#联系作者)

## 仓库结构

本仓库为 pnpm workspace monorepo:

| 包 | 说明 |
| --- | --- |
| [`@when-hooks/core`](packages/core) | 框架无关内核:`ConditionSource`(条件源契约)、`LifecycleWindow`(生命周期窗口契约)、`whenAll`、`runInWindow`、取消语义。纯 JS,零依赖 |
| [`@when-hooks/uni`](packages/uni) | uniapp / Vue3 适配层:基于 Vue `reactive`/`watch` 与 uniapp 生命周期实现条件源和窗口,导出 `init`、`createProxy` 与全部钩子 |

设计文档见 [docs/架构重构方案.md](docs/架构重构方案.md)、[docs/命名方案.md](docs/命名方案.md)。

## 下载和使用

### 下载

```bash
npm i @when-hooks/uni
```

### createProxy 的作用

`createProxy` 把传入对象变为响应式对象(内部即 Vue 的 `reactive`),其属性变化(包括**嵌套属性**)都可以被钩子监听。

```ts
// global.ts 文件
import { createProxy } from '@when-hooks/uni'

interface GlobalData {
  token: string
  userInfo: { name: string } | null
}

export const globalData = createProxy<GlobalData>({
  token: '',
  userInfo: null,
})

export function set<K extends keyof GlobalData>(key: K, val: GlobalData[K]) {
  globalData[key] = val
}

export function get<K extends keyof GlobalData>(key: K): GlobalData[K] {
  return globalData[key]
}
```

### init 的作用

`init` 注册监听配置:为每个名字(如 `Login`)声明它监听哪个状态、以及满足条件的判断方式。

```ts
type WatchConfig =
  | {
      key: string // 监听 createProxy 对象上的路径,支持 'a.b.c' 嵌套路径
      type?: 'default'
      onUpdate?: (val: any) => boolean // 自定义满足条件,缺省为真值判断
    }
  | {
      key: string // 监听 pinia store $state 上的路径
      type: 'pinia'
      store: any // pinia store 实例
      onUpdate?: (val: any) => boolean
    }

declare function init(watchObject: Record<string, WatchConfig>): void
```

具体用法:

```ts
// App.vue 中使用
import { init } from '@when-hooks/uni'
import { useCounterStore } from '@/store/index'

init({
  Login: {
    key: 'token', // 监听 globalData.token
    onUpdate: (val) => !!val,
  },
  UserInfo: {
    key: 'userInfo', // 监听 globalData.userInfo
  },
  Name: {
    key: 'userInfo.name', // 监听嵌套属性 globalData.userInfo.name
  },
  Count: {
    key: 'counter', // 监听 useCounterStore 中 state 的 counter
    type: 'pinia',
    store: useCounterStore(), // type 为 pinia 时需要传入 store 实例
    onUpdate: (val) => val === 2, // 满足条件为 val 等于 2
  },
})
```

### 在页面中使用钩子

条件键前置、回调在后。传入多个 key 时,**所有条件都满足**且生命周期到达后才执行回调;页面离开(如 onUnload/onHide)会取消本轮等待,下次进入重新开始。

```vue
<script setup lang="ts">
import { onLoadWhen, onShowWhen } from '@when-hooks/uni'

onLoadWhen(['Login', 'UserInfo'], (options) => {
  console.log('onLoad 已触发,且 Login、UserInfo 条件都满足', options)
})

onShowWhen(['Login', 'UserInfo'], () => {
  console.log('onShow 已触发,且 Login、UserInfo 条件都满足')
})

onShowWhen(['Login'], () => {
  console.log('onShow 已触发,且 Login 条件满足')
})
</script>
```

## 可用的条件钩子

### 全局状态钩子

配合 `init` 注册的全局/pinia 状态使用,签名为 `(keys, cb)`:

| 钩子 | 生命周期窗口 |
| --- | --- |
| onLaunchWhen | onLaunch 开启 / onHide 关闭 |
| onLoadWhen | onLoad 开启 / onUnload 关闭 |
| onCreatedWhen | setup 同步阶段开启(对应 Vue2 的 created 时机)/ 卸载关闭 |
| onShowWhen | onShow 开启 / onHide、onUnload 关闭 |
| onMountedWhen | onMounted 开启 / onUnmounted 关闭 |
| onReadyWhen | onReady 开启 / onUnload 关闭 |

### 局部状态钩子

不依赖 `init`,直接监听组件内的 ref/reactive/computed,签名为 `(options, cb)`:

```ts
import { ref } from 'vue'
import { onShowWhenLocal } from '@when-hooks/uni'

const userInfo = ref<{ name: string } | null>(null)

onShowWhenLocal({ watchSource: userInfo }, () => {
  console.log('onShow 已触发,且 userInfo 不为空')
})
```

可用:`onLoadWhenLocal`、`onShowWhenLocal`、`onMountedWhenLocal`、`onReadyWhenLocal`。配置项支持 `condition`(自定义条件)、`triggerOnChange`(满足后变量再变化是否重复触发)、`immediate`。

## 从 custom-hooks-plus 迁移

旧 API 仍然导出(标注 `@deprecated`),但建议尽快迁移。改名的同时参数顺序统一为**条件前置、回调在后**:

| 旧 API(回调前置) | 新 API(条件前置) |
| --- | --- |
| `onCustomLaunch(cb, keys)` | `onLaunchWhen(keys, cb)` |
| `onCustomLoad(cb, keys)` | `onLoadWhen(keys, cb)` |
| `onCustomShow(cb, keys)` | `onShowWhen(keys, cb)` |
| `onCustomCreated(cb, keys)` | `onCreatedWhen(keys, cb)` |
| `onCustomMounted(cb, keys)` | `onMountedWhen(keys, cb)` |
| `onCustomReady(cb, keys)` | `onReadyWhen(keys, cb)` |
| `onLocalCustomLoad(cb, options)` | `onLoadWhenLocal(options, cb)` |
| `onLocalCustomShow(cb, options)` | `onShowWhenLocal(options, cb)` |
| `onLocalCustomMounted(cb, options)` | `onMountedWhenLocal(options, cb)` |
| `onLocalCustomReady(cb, options)` | `onReadyWhenLocal(options, cb)` |

`init`、`createProxy` 名称不变;`proxyData` 已标注 deprecated,请使用 `createProxy`。

## 开发

```bash
pnpm install

pnpm build       # 构建全部包(unbuild)
pnpm test:run    # 运行全部测试(vitest:core 单元测试 + uni 组件测试)
pnpm typecheck   # 全部包类型检查
pnpm check-publish # publint 校验发布配置
```

## 联系作者

![图 0](images/2024-12-20%2000-35-25%2032efc6bee36652fea47fe4dc284d68eaaa9b9cab09b0d497e28ea2e1adb585e4.png)
