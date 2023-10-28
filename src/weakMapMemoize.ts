// Original source:
// - https://github.com/facebook/react/blob/0b974418c9a56f6c560298560265dcf4b65784bc/packages/react/src/ReactCache.js

import type { AnyFunction } from './types'

const UNTERMINATED = 0
const TERMINATED = 1

interface UnterminatedCacheNode<T> {
  s: 0
  v: void
  o: null | WeakMap<Function | Object, CacheNode<T>>
  p: null | Map<string | number | null | void | symbol | boolean, CacheNode<T>>
}

interface TerminatedCacheNode<T> {
  s: 1
  v: T
  o: null | WeakMap<Function | Object, CacheNode<T>>
  p: null | Map<string | number | null | void | symbol | boolean, CacheNode<T>>
}

type CacheNode<T> = TerminatedCacheNode<T> | UnterminatedCacheNode<T>

function createCacheNode<T>(): CacheNode<T> {
  return {
    s: UNTERMINATED, // status, represents whether the cached computation returned a value or threw an error
    v: undefined, // value, either the cached result or an error, depending on s
    o: null, // object cache, a WeakMap where non-primitive arguments are stored
    p: null // primitive cache, a regular Map where primitive arguments are stored.
  }
}

export function weakMapMemoize<F extends AnyFunction>(func: F) {
  // we reference arguments instead of spreading them for performance reasons

  let fnNode = createCacheNode()

  function memoized() {
    let cacheNode = fnNode

    for (let i = 0, l = arguments.length; i < l; i++) {
      const arg = arguments[i]
      if (
        typeof arg === 'function' ||
        (typeof arg === 'object' && arg !== null)
      ) {
        // Objects go into a WeakMap
        let objectCache = cacheNode.o
        if (objectCache === null) {
          cacheNode.o = objectCache = new WeakMap()
        }
        const objectNode = objectCache.get(arg)
        if (objectNode === undefined) {
          cacheNode = createCacheNode()
          objectCache.set(arg, cacheNode)
        } else {
          cacheNode = objectNode
        }
      } else {
        // Primitives go into a regular Map
        let primitiveCache = cacheNode.p
        if (primitiveCache === null) {
          cacheNode.p = primitiveCache = new Map()
        }
        const primitiveNode = primitiveCache.get(arg)
        if (primitiveNode === undefined) {
          cacheNode = createCacheNode()
          primitiveCache.set(arg, cacheNode)
        } else {
          cacheNode = primitiveNode
        }
      }
    }
    if (cacheNode.s === TERMINATED) {
      return cacheNode.v
    }
    // Allow errors to propagate
    const result = func.apply(null, arguments as unknown as any[])
    const terminatedNode = cacheNode as unknown as TerminatedCacheNode<any>
    terminatedNode.s = TERMINATED
    terminatedNode.v = result
    return result
  }

  memoized.clearCache = () => {
    fnNode = createCacheNode()
  }

  return memoized as F & { clearCache: () => void }
}
