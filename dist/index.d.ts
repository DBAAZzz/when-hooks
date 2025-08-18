/// <reference types="@dcloudio/types" />

export declare const createProxy: <T extends AnyObject>(target: T) => T;

declare type CustomHook = (cb: (options?: any) => void, watchKey: string[] | string) => void;

declare class CustomHooks {
    private watchConfigs;
    private promiseCache;
    private promiseMap;
    private proxyTarget;
    private createPendingPromise;
    private track;
    createProxy<T extends AnyObject>(target: T): T;
    init(watchObject: WatchConfigCollection): void;
    getPromiseCache(): Map<string, Promise<any>>;
    getPromiseMap(): Map<string, PromiseMapValue>;
    getWatchConfigs(): WatchConfigCollection;
}

export declare const customHooks: CustomHooks;

declare type DefaultWatchConfig = {
    key: string;
    type?: 'default';
    onUpdate?: (val: any) => boolean;
};

/**
 *
 * @param watchObject 监听的键
 * @param target 传入的store
 * @returns
 */
export declare function init(watchObject: WatchConfigCollection): void;

export declare const onCustomCreated: CustomHook;

export declare const onCustomLaunch: CustomHook;

export declare const onCustomLoad: CustomHook;

export declare const onCustomMounted: CustomHook;

export declare const onCustomReady: CustomHook;

export declare const onCustomShow: CustomHook;

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

/**
 * @deprecated 即将被弃用，请使用`createProxy`方法
 * @see 点击查看createProxy方法 {@link createProxy}
 */
export declare const proxyData: <T extends AnyObject>(target: T) => T;

declare type WatchConfig = PiniaWatchConfig | DefaultWatchConfig;

declare type WatchConfigCollection = {
    [key: string]: WatchConfig;
};

export { }
