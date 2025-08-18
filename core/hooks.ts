import { customHooks } from './init'
import { _onLaunch, _onLoad, _onShow, _onReady, _onMounted, _onCreated } from './rewrite'
import { generateUUIDv4, getSharedKey } from '../utils'
import { CustomHook, HookFunction, PromiseStatus } from '../types'

const shared: AnyObject = {}

function getValidWatchKeys(watchKey: string | string[], method: string): string[] {
  const keys = Array.isArray(watchKey) ? watchKey : [watchKey];
  const watchConfigs = customHooks.getWatchConfigs()

  return keys.filter(key => {
    if (key in watchConfigs) return true;
    console.error(`Method: ${method}, Error: 监听的值【${key}】未注册！！！请检查init方法`);
    return false;
  });
}

function resetCallback(watchKey: string[] | string, uuid: string) {
  const key = getSharedKey(watchKey, uuid)
  const current = shared[key];
  if (current && typeof current.reject === 'function') {
    current.reject(new Error(`Cancelled: ${key}`));
  }
  delete shared[key];
}

function createHookPromise(watchKey: string[] | string, uuid: string, method: string) {
  // 通过 watchKey + uuid 生成唯一 key
  const sharedKey = getSharedKey(watchKey, uuid)
  shared[sharedKey] = {}
  shared[sharedKey].promise = new Promise((_, reject) => {
    shared[sharedKey].reject = reject
  })

  // 获取有效的注册过的key
  const _watchKey = getValidWatchKeys(watchKey, method)
  const promiseMap = customHooks.getPromiseMap()
  const watchConfigs = customHooks.getWatchConfigs()
  const promiseCache = customHooks.getPromiseCache()

  // 如果监听的有效值为空，则返回一个失败的 promise
  if (_watchKey.length == 0) {
    return Promise.reject()
  }

  // 根据 key 生成 promise iterable
  const iterable = _watchKey.map((i) => {
    const promiseKey = watchConfigs[i].key
    return promiseMap.get(promiseKey)!.status == PromiseStatus.FULFILLED
      ? Promise.resolve()
      : promiseCache.get(promiseKey)
  })

  const current = shared[sharedKey]; // 记录本轮条目
  const promise = Promise.race([Promise.all(iterable), shared[sharedKey].promise])
    .finally(() => {
      if (shared[sharedKey] === current) { // 身份校验，避免误删后续新条目
        delete shared[sharedKey];
      }
    });
  
  return promise
}

function createCustomHook(
  hookFn: HookFunction,
  cb: (options?: any) => void,
  watchKey: string[] | string,
  methodName: string
) {
  const uuid = generateUUIDv4()
  hookFn(
    () => { },
    async (options) => {
      try {
        await createHookPromise(watchKey, uuid, methodName)
        cb(options)
      } catch (e) { }
    },
    () => {
      resetCallback(watchKey, uuid)
    }
  )
}

const createNamedHook = (hookFn: HookFunction, methodName: string): CustomHook =>
  (cb, watchKey) => createCustomHook(hookFn, cb, watchKey, methodName);

export const onCustomLaunch = createNamedHook(_onLaunch, 'onCustomLaunch');
export const onCustomLoad = createNamedHook(_onLoad, 'onCustomLoad');
export const onCustomShow = createNamedHook(_onShow, 'onCustomShow');
export const onCustomCreated = createNamedHook(_onCreated, 'onCustomCreated');
export const onCustomMounted = createNamedHook(_onMounted, 'onCustomMounted');
export const onCustomReady = createNamedHook(_onReady, 'onCustomReady');
