# TODO: 页面级变量监听实现方案

## 推荐方案

**方案 3：直接传入 Ref（或 Reactive/Computed）**

### 关键理由

- **API 简洁**：调用方式与 Vue 原生 `watch` 类似，零学习成本。
- **完美兼容**：不影响现有全局 `init` 监听，保持向后兼容。
- **TypeScript 自动推断**：`Ref`、`ComputedRef`、`Reactive` 都能得到正确的类型。
- **实现复杂度适中**：只需在 `hooks.ts` 中添加类型分支并使用 Vue `watch`，不必额外的页面级 `init` 机制。

## API 设计示例

```ts
import { ref, computed } from "vue";
import { onCustomShow } from "custom-hooks-plus";

// 方式 1：传入单个 ref
const pageData = ref(null);
onCustomShow(() => {
  console.log("页面数据准备好了", pageData.value);
}, pageData);

// 方式 2：传入多个 ref（数组）
const token = ref("");
const userInfo = ref(null);
onCustomShow(() => {
  console.log("登录状态+用户信息都准备好了");
}, [token, userInfo]);

// 方式 3：带条件判断（对象配置）
const count = ref(0);
onCustomShow(
  () => {
    console.log("count 达到 10 了");
  },
  {
    watch: count,
    condition: (val) => val >= 10,
  }
);

// 方式 4：兼容现有全局监听（字符串）
onCustomShow(() => {
  console.log("全局 token 变化");
}, "Login");

// 方式 5：computed 也支持
const isReady = computed(() => pageData.value !== null);
onCustomShow(() => {
  console.log("computed 条件满足");
}, isReady);
```

## 实现步骤

1. **工具函数扩展**
   - 在 `utils/index.ts` 新增 `isRef`, `isReactive`, `isComputed` 判断函数。
2. **核心 Hook 改造** (`core/hooks.ts`)
   - 在 `createCustomHook` 中加入类型分支：
     - `string | string[]` → 走现有全局 `init` 逻辑。
     - `Ref | Reactive | ComputedRef` → 使用 Vue `watch` 创建局部监听。
     - 对象 `{ watch, condition }` → 同上，额外在回调前执行 `condition`。
   - 为每个局部监听生成唯一 `uuid`（与全局保持相同机制），并在页面 `onHide/onUnload` 时自动 `unwatch`。
3. **生命周期清理**
   - 在 `rewrite.ts` 中的 `handleLifecycleEvent` 为局部监听注册 `resetCallback`，在页面卸载时调用 `unwatch` 并删除对应的 Promise 缓存。
4. **类型声明更新** (`types.d.ts` 或 `index.d.ts`)
   - 新增 `CustomHookWatchKey = string | string[] | Ref | Ref[] | ComputedRef | { watch: Ref | Ref[]; condition?: (val:any)=>boolean }`。
   - 保持向后兼容。
5. **文档与示例**
   - 在 `README.md` 添加 “页面级变量监听” 示例章节。
   - 在 `example/` 中提供一个使用局部 `ref` 的页面示例。
6. **测试**
   - 编写单元测试：
     - 同时在两个页面使用相同 `ref`，确保互不干扰。
     - 页面卸载后 Promise 正确 `reject` 并清理缓存。
     - 条件函数 `condition` 正常工作。

## 里程碑（可在项目 Issue 中拆分）

- [ ] 完成工具函数扩展（1 天）
- [ ] 实现局部监听核心逻辑（2 天）
- [ ] 生命周期自动清理（1 天）
- [ ] 类型声明与文档更新（1 天）
- [ ] 示例页面与单元测试（2 天）
- [ ] 代码评审 & 合并（1 天）

---

**备注**：实现后，`onCustomShow`、`onCustomLoad`、`onCustomMounted` 等所有自定义钩子均可接受上述局部变量形式，保持 API 统一性。
