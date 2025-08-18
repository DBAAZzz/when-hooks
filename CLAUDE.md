# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个为 Vue3 和 UniApp 开发的自定义生命周期钩子库。该库允许开发者在特定的状态变化组合下执行代码，例如在 `Username 不为空` + `onShow 生命周期` 时触发钩子。

## 常用命令

### 构建与打包
```bash
# 完整构建流程
pnpm run build

# 构建 bundle
pnpm run build-bundle

# 生成类型定义
pnpm run build-types

# TypeScript 编译
pnpm run ts-build
```

### 测试
```bash
# 运行测试
pnpm test
```

## 核心架构

### 主要模块结构

- **core/init.ts** - `CustomHooks` 类，核心状态管理系统
  - 管理 `promiseCache`、`promiseMap` 和 `watchConfigs`
  - 提供 `createProxy()` 方法创建响应式代理对象
  - 实现 `init()` 方法注册监听配置

- **core/hooks.ts** - 自定义钩子实现
  - 提供 `onCustomShow`、`onCustomLoad`、`onCustomMounted` 等钩子
  - 通过 `createHookPromise()` 管理异步状态

- **core/rewrite.ts** - 生命周期重写层
  - 包装原生 Vue/UniApp 生命周期钩子

### 关键设计模式

1. **Promise-based 状态管理**
   - 使用 `PromiseStatus.PENDING/FULFILLED` 跟踪状态变化
   - 通过 `Promise.race([Promise.all(iterable), sharedPromise])` 实现条件触发

2. **Proxy 响应式系统**
   - `createProxy()` 创建响应式对象，监听属性变化
   - `track()` 方法处理嵌套对象的扁平化监听

3. **类型系统**
   - `WatchConfig` 支持 default 和 pinia 两种类型
   - `onUpdate` 函数提供自定义更新条件

### 构建配置

- **rollup.config.mjs** - 使用 Rollup 打包为 ESM 格式
- **api-extractor.json** - 使用 Microsoft API Extractor 生成统一的类型定义
- **tsconfig.types.json** - 专门用于类型生成的 TypeScript 配置

### 测试策略

使用 Vitest + Vue Test Utils 进行组件测试，测试场景包括：
- Pinia store 状态变化触发钩子
- Global 对象属性变化触发钩子  
- 嵌套对象属性变化监听
- 多条件组合触发

## 开发注意事项

- 该库设计为双模式支持：Vue3 全局状态和 Pinia store 状态
- 扁平化处理确保深层对象属性变化也能被正确监听
- Promise 机制保证钩子只在所有监听条件满足时才执行
- 支持 onUpdate 自定义条件判断函数