/// <reference types="@dcloudio/types" />

import { WatchSource } from 'vue';

export declare const createProxy: <T extends AnyObject>(target: T) => T;

declare type CustomHook = (cb: (options?: any) => void, watchKey: string[] | string) => void;

/**
 * CustomHooks 协调器
 */
declare class CustomHooks {
    private proxyManager;
    private promiseManager;
    private watchConfigManager;
    private stateTracker;
    constructor();
    /**
     * 创建响应式代理
     */
    createProxy<T extends AnyObject>(target: T): T;
    /**
     * 初始化监听配置
     */
    init(watchObject: WatchConfigCollection): void;
    /**
     * 获取 Promise 缓存（向后兼容）
     */
    getPromiseCache(): Map<string, Promise<any>>;
    /**
     * 获取 Promise 映射（向后兼容）
     */
    getPromiseMap(): Map<string, PromiseMapValue>;
    /**
     * 获取监听配置（向后兼容）
     */
    getWatchConfigs(): WatchConfigCollection;
}

export declare const customHooks: CustomHooks;

declare type DefaultWatchConfig = {
    key: string;
    type?: 'default';
    onUpdate?: (val: any) => boolean;
};

export declare function init(watchObject: WatchConfigCollection): void;

/**
 * 局部自定义钩子类型
 */
declare type LocalCustomHook = (callback: LocalHookCallback, options: LocalHookOptions) => void;

/**
 * 局部自定义钩子的回调函数类型
 */
declare type LocalHookCallback = (options?: any) => void;

/**
 * 局部变量监听配置选项
 */
declare interface LocalHookOptions {
    /**
     * 监听的响应式变量（ref、reactive、computed 等）
     * 可以是单个 WatchSource 或数组
     */
    watchSource: WatchSource<any> | WatchSource<any>[];
    /**
     * 条件判断函数
     * @param value 当前值
     * @returns 是否满足条件，返回 true 时触发回调
     * @default 默认判断：非 null/undefined/false/0/'' 即为满足
     */
    condition?: (value: any) => boolean;
    /**
     * 是否在变量变化时也触发回调
     * @default false - 默认只在生命周期触发一次
     *
     * - false: 只在生命周期（如 onShow）时检查条件并触发
     * - true: 在生命周期触发后，变量每次变化时都重新检查条件
     */
    triggerOnChange?: boolean;
    /**
     * 是否立即执行（仅在 triggerOnChange 为 true 时有效）
     * @default false
     */
    immediate?: boolean;
}

/**
 * 全局状态监听的自定义 onCreated 钩子
 * 在 Vue 的 created 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 */
export declare const onCustomCreated: CustomHook;

/**
 * 全局状态监听的自定义 onLaunch 钩子
 * 在 uniapp 的 onLaunch 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 * @example
 * ```ts
 * onCustomLaunch(() => {
 *   console.log('应用启动且 token 已准备好');
 * }, 'Login');
 * ```
 */
export declare const onCustomLaunch: CustomHook;

/**
 * 全局状态监听的自定义 onLoad 钩子
 * 在 uniapp 的 onLoad 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 * @example
 * ```ts
 * onCustomLoad(() => {
 *   console.log('页面加载且用户信息已准备好');
 * }, 'UserInfo');
 * ```
 */
export declare const onCustomLoad: CustomHook;

/**
 * 全局状态监听的自定义 onMounted 钩子
 * 在 Vue 的 onMounted 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 * @example
 * ```ts
 * onCustomMounted(() => {
 *   console.log('组件挂载且全局状态已准备好');
 * }, 'Login');
 * ```
 */
export declare const onCustomMounted: CustomHook;

/**
 * 全局状态监听的自定义 onReady 钩子
 * 在 uniapp 的 onReady 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 */
export declare const onCustomReady: CustomHook;

/**
 * 全局状态监听的自定义 onShow 钩子
 * 在 uniapp 的 onShow 生命周期 + 全局状态满足条件时触发
 * @param cb 回调函数
 * @param watchKey 监听的全局状态键（通过 init 方法注册）
 * @example
 * ```ts
 * onCustomShow(() => {
 *   console.log('页面显示且 token 和 userInfo 都已准备好');
 * }, ['Login', 'UserInfo']);
 * ```
 */
export declare const onCustomShow: CustomHook;

/**
 * 局部变量监听的自定义 onLoad 钩子
 * 在 uniapp 的 onLoad 生命周期 + 局部变量满足条件时触发
 *
 * @param callback 回调函数
 * @param options 监听配置
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onLocalCustomLoad } from 'custom-hooks-plus'
 *
 * const pageData = ref(null)
 *
 * // 页面加载时，如果 pageData 不为空，则执行回调
 * onLocalCustomLoad(() => {
 *   console.log('页面加载且数据已准备好', pageData.value)
 * }, {
 *   watchSource: pageData
 * })
 *
 * // 支持多个变量
 * const token = ref('')
 * const userInfo = ref(null)
 * onLocalCustomLoad(() => {
 *   console.log('token 和 userInfo 都准备好了')
 * }, {
 *   watchSource: [token, userInfo]
 * })
 *
 * // 支持自定义条件
 * const count = ref(0)
 * onLocalCustomLoad(() => {
 *   console.log('count 达到 10')
 * }, {
 *   watchSource: count,
 *   condition: (val) => val >= 10
 * })
 * ```
 */
export declare const onLocalCustomLoad: LocalCustomHook;

/**
 * 局部变量监听的自定义 onMounted 钩子
 * 在 Vue 的 onMounted 生命周期 + 局部变量满足条件时触发
 *
 * @param callback 回调函数
 * @param options 监听配置
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onLocalCustomMounted } from 'custom-hooks-plus'
 *
 * const apiData = ref(null)
 *
 * onLocalCustomMounted(() => {
 *   console.log('组件挂载且 API 数据已返回')
 * }, {
 *   watchSource: apiData
 * })
 * ```
 */
export declare const onLocalCustomMounted: LocalCustomHook;

/**
 * 局部变量监听的自定义 onReady 钩子
 * 在 uniapp 的 onReady 生命周期 + 局部变量满足条件时触发
 *
 * @param callback 回调函数
 * @param options 监听配置
 *
 * @example
 * ```ts
 * import { ref, computed } from 'vue'
 * import { onLocalCustomReady } from 'custom-hooks-plus'
 *
 * const pageData = ref(null)
 * const isReady = computed(() => pageData.value !== null)
 *
 * onLocalCustomReady(() => {
 *   console.log('页面渲染完成且数据已准备好')
 * }, {
 *   watchSource: isReady
 * })
 * ```
 */
export declare const onLocalCustomReady: LocalCustomHook;

/**
 * 局部变量监听的自定义 onShow 钩子
 * 在 uniapp 的 onShow 生命周期 + 局部变量满足条件时触发
 *
 * @param callback 回调函数
 * @param options 监听配置
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { onLocalCustomShow } from 'custom-hooks-plus'
 *
 * const pageData = ref(null)
 *
 * // 每次页面显示时，如果 pageData 不为空，则执行回调
 * onLocalCustomShow(() => {
 *   console.log('页面显示且数据已准备好', pageData.value)
 * }, {
 *   watchSource: pageData
 * })
 *
 * // 监听变化并重复触发
 * onLocalCustomShow(() => {
 *   console.log('pageData 变化了')
 * }, {
 *   watchSource: pageData,
 *   triggerOnChange: true // 变量变化时也触发
 * })
 * ```
 */
export declare const onLocalCustomShow: LocalCustomHook;

declare type PiniaWatchConfig = {
    key: string;
    type: 'pinia';
    store: any;
    onUpdate?: (val: any) => boolean;
};

declare type PromiseEntry = {
    status: PromiseStatus;
    resolve: Function;
    type?: 'pinia' | 'default';
    onUpdate?: (val: any) => boolean;
};

declare type PromiseMapValue = PromiseEntry & Partial<WatchConfig>;

declare enum PromiseStatus {
    /** 加载状态 */
    PENDING = "pending",
    /** 已完成 */
    FULFILLED = "fulfilled"
}

/** @deprecated */
export declare const proxyData: <T extends AnyObject>(target: T) => T;

declare type WatchConfig = PiniaWatchConfig | DefaultWatchConfig;

declare type WatchConfigCollection = {
    [key: string]: WatchConfig;
};

export { }
