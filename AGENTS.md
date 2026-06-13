# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

when-hooks 是一个条件生命周期钩子库:在「生命周期到达」+「自定义状态满足」两个条件同时成立时执行代码,例如 `Login 状态满足` + `onShow 生命周期` 时触发 `onShowWhen(['Login'], cb)`。

仓库为 pnpm workspace monorepo:

- **packages/core**(`@when-hooks/core`)— 框架无关内核,纯 JS 零依赖
- **packages/uni**(`@when-hooks/uni`)— uniapp / Vue3 适配层,依赖 core(`workspace:^`)

## 常用命令

```bash
pnpm build          # 构建全部包(unbuild)
pnpm test           # vitest watch 模式
pnpm test:run       # 运行全部测试一次
pnpm typecheck      # 全部包 tsc --noEmit
pnpm check-publish  # publint 校验发布配置
```

## 核心架构

### core 包(契约与算法)

- **src/types.ts** — 两个核心契约:
  - `ConditionSource`:`{ get(): boolean, subscribe(onChange): unsubscribe }`,条件源
  - `LifecycleWindow`:`{ onOpen(cb), onClose(cb) }`,生命周期窗口
- **src/when-all.ts** — `whenAll(sources, signal?)`:等待全部条件满足,本质是 watch 一个合成布尔,支持 AbortSignal 取消
- **src/lifecycle-window.ts** — `runInWindow(window, sources, cb)`:窗口开启时等待条件、执行回调;窗口关闭取消本轮等待。sources 支持惰性解析(函数形式),允许 init 晚于钩子注册
- **src/abort.ts** — `createAbortController` 兜底实现(部分小程序 JS 引擎无原生 AbortController)

### uni 包(Vue/uniapp 适配)

- **src/core/condition-source.ts** — `fromGetter(getter, predicate?)`:用 `watch(isMet, ..., { flush: 'sync' })` 把响应式 getter 翻译成 `ConditionSource`
- **src/core/windows.ts** — 六个生命周期窗口工厂(onShow 开启/onHide+onUnload 关闭等)
- **src/core/registry.ts** — `WatchRegistry`:`createProxy` 即 Vue `reactive()`;`init` 把 `WatchConfig`(default/pinia 两种)翻译成条件源存入 Map,root 在 getter 内惰性解析
- **src/hooks/global.ts** — `onLaunchWhen` / `onLoadWhen` / `onShowWhen` / `onCreatedWhen` / `onMountedWhen` / `onReadyWhen`,签名 `(keys, cb)`;旧名 `onCustomXxx(cb, keys)` 保留为 `@deprecated` 别名
- **src/hooks/local.ts** — `onLoadWhenLocal` 等局部钩子,签名 `(options, cb)`,直接监听组件内 ref/reactive;旧名 `onLocalCustomXxx(cb, options)` 为 `@deprecated` 别名

### 构建与发布

- 每包一个 **build.config.ts**(unbuild),产物 `dist/index.mjs` + `dist/index.d.mts`
- package.json 开发态指向 `src/index.ts`,`publishConfig` 切换到 dist;uni 包的 vue/uni-app/core 均为 external 不打入产物

### 测试

统一 vitest(根 vitest.workspace.ts 聚合 `packages/*/vitest.config.ts`):

- core:node 环境纯单元测试(test/when-all.test.ts、test/lifecycle-window.test.ts)
- uni:happy-dom + @vue/test-utils 组件测试(test/index.test.ts,挂载 example/index.vue)
- 注意:example/global.ts 的 globalData 是模块级单例,测试 beforeEach 需调用 `resetGlobalData()`

## 开发注意事项

- 条件即响应式 getter:嵌套属性赋值(`globalData.userInfo.name = 'x'`)天然可监听,无需手动扁平化
- 窗口关闭通过 AbortSignal 取消等待,取消异常(`isAbortError`)与用户回调异常严格区分,后者不吞
- 设计文档在 docs/ 目录:架构重构方案、命名方案、多包工程组织方案、测试方案
