# when-hooks

**条件生命周期钩子** — 在「生命周期到达」与「自定义状态满足」两个条件同时成立时执行回调。

```ts
onShowWhen(['Login'], () => {
  console.log('已登录且页面 onShow，才会执行这里')
})
```

适用于 **uniapp + Vue 3**，基于响应式订阅实现条件等待，无轮询、无 setTimeout。

## 安装

```bash
npm i @when-hooks/uni
```

## 快速开始

### 1. 创建响应式全局状态

`createProxy` 将对象包装为响应式代理（底层即 Vue `reactive`），嵌套属性变更也可被钩子监听。

```ts
// global.ts
import { createProxy } from '@when-hooks/uni'

interface GlobalData {
  token: string
  userInfo: { name: string } | null
}

export const globalData = createProxy<GlobalData>({
  token: '',
  userInfo: null,
})
```

### 2. 注册条件监听

`init` 声明每个条件名对应的状态路径及满足判断。

```ts
// App.vue
import { init } from '@when-hooks/uni'
import { useCounterStore } from '@/store/index'

init({
  Login: {
    key: 'token',
    onUpdate: (val) => !!val,          // 自定义条件：token 非空字符串即为"已登录"
  },
  UserInfo: {
    key: 'userInfo',                    // 默认条件：值真值即为满足
  },
  Name: {
    key: 'userInfo.name',               // 支持嵌套路径
  },
  Count: {
    key: 'counter',
    type: 'pinia',
    store: useCounterStore(),
    onUpdate: (val) => val === 2,       // Pinia store 示例
  },
})
```

### 3. 在页面中使用钩子

条件键在前、回调在后。传入多个 key 时，所有条件均满足且生命周期到达后才执行回调。

```vue
<script setup lang="ts">
import { onLoadWhen, onShowWhen } from '@when-hooks/uni'

onLoadWhen(['Login', 'UserInfo'], (options) => {
  console.log('onLoad + Login + UserInfo 全部就绪', options)
})

onShowWhen(['Login'], () => {
  console.log('每次 onShow 只要 Login 已满足就会执行')
})
</script>
```

页面离开（`onUnload` / `onHide`）时自动取消本轮等待，下次进入重新开始。

## API 参考

### 全局状态钩子

需配合 `init` 注册的全局 / Pinia 状态使用，签名为 `(keys: string[], cb: Function)`：

| 钩子 | 生命周期窗口 |
| --- | --- |
| `onLaunchWhen` | `onLaunch` 开启 → `onHide` 关闭 |
| `onLoadWhen` | `onLoad` 开启 → `onUnload` 关闭 |
| `onShowWhen` | `onShow` 开启 → `onHide` / `onUnload` 关闭 |
| `onCreatedWhen` | `setup` 同步阶段开启（对应 Vue 2 created）→ 卸载关闭 |
| `onMountedWhen` | `onMounted` 开启 → `onUnmounted` 关闭 |
| `onReadyWhen` | `onReady` 开启 → `onUnload` 关闭 |

### 局部状态钩子

不依赖 `init`，直接监听组件内 `ref` / `reactive` / `computed`，签名为 `(options, cb)`：

```ts
import { ref } from 'vue'
import { onShowWhenLocal } from '@when-hooks/uni'

const userInfo = ref<{ name: string } | null>(null)

onShowWhenLocal({ watchSource: userInfo }, () => {
  console.log('onShow 已触发，且 userInfo 不为空')
})
```

可用钩子：`onLoadWhenLocal`、`onShowWhenLocal`、`onMountedWhenLocal`、`onReadyWhenLocal`。

#### 局部钩子配置项

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `watchSource` | `Ref \| ComputedRef \| () => any` | 被监听的值或 getter |
| `condition` | `(val: any) => boolean` | 自定义满足条件，默认真值判断 |
| `triggerOnChange` | `boolean` | 条件满足后，值再次变化是否重复触发 |
| `immediate` | `boolean` | 就绪时是否立即执行（不等生命周期） |

## 从 custom-hooks-plus 迁移

旧 API 仍可使用（标记为 `@deprecated`），建议尽快迁移。改名同时统一参数顺序为**条件前置、回调在后**：

| 旧 API（回调前置） | 新 API（条件前置） |
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

`init`、`createProxy` 名称不变；`proxyData` 已弃用，请使用 `createProxy`。

## 设计原理

### 核心思想

页面开发中的常见痛点：某个操作需要**两个条件同时成立**——例如"用户已登录"且"页面 onShow 了"。传统做法是手动维护标志位 + watch + if 判断，条件一多极易出错。

**when-hooks** 把这个模式抽象为 `whenAll(conditions) ∩ lifecycleWindow`：

```text
条件源（ConditionSource）  ──┐
                             ├── whenAll ──→ 执行回调
生命周期窗口（LifecycleWindow）──┘
```

### 架构分层

本仓库为 **pnpm workspace monorepo**，遵循 core / adapter 分层：

| 包 | 说明 |
| --- | --- |
| `@when-hooks/core` | 框架无关内核 —— `ConditionSource` 契约、`whenAll`、`LifecycleWindow`、取消语义。**纯 JS，零依赖** |
| `@when-hooks/uni` | uniapp / Vue 3 适配层 —— 基于 `reactive` / `watch` 将响应式状态翻译为条件源，uni 生命周期翻译为窗口 |

内核面向两个最小契约编程，与框架解耦：

- **`ConditionSource`**：`{ get(): boolean; subscribe(onChange): () => void }` — 可订阅的布尔条件源，各框架适配器负责把自身状态翻译为此契约
- **`LifecycleWindow`**：`{ onOpen(cb); onClose(cb) }` — 生命周期窗口，适配器将 `onShow` / `useDidShow` 等接入

窗口关闭时通过 `AbortSignal` 取消条件等待，"窗口关闭取消"与"用户回调异常"严格区分，回调中的错误不会被静默吞掉。

### 典型应用场景

1. **登录态网关**：`onShowWhen(['Login'], cb)` — 每次页面可见且已登录才执行业务逻辑
2. **多依赖就绪**：`onLoadWhen(['Login', 'UserInfo', 'Permissions'], cb)` — 页面加载且三个前置数据全部到位后初始化
3. **Pinia 状态联动**：监听 Pinia store 中的计算态（如"计数器等于 2"），结合生命周期触发副作用
4. **局部组件条件**：`onMountedWhenLocal({ watchSource: elementRef }, cb)` — DOM 元素挂载且引用就绪后操作

更多设计决策与架构细节见 [docs/](docs/)。

## 开发

```bash
pnpm install

pnpm build          # 构建全部包（unbuild）
pnpm test:run       # 运行全部测试（core 单元测试 + uni 组件测试）
pnpm typecheck      # 全部包类型检查
pnpm check-publish  # 发布前校验
```

## 许可证

ISC
