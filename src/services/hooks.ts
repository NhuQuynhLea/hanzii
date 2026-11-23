/**
 * Cross-cutting hook registry — replaces the original codebase's
 * `try{ globalFn() }catch(e){}` calls between decoupled globals.
 * Feature modules register implementations; core services call them
 * without import cycles.
 */

type HookFn = (...args: unknown[]) => unknown;

const registry = new Map<string, HookFn>();

export function registerHook(name: string, fn: HookFn): void {
  registry.set(name, fn);
}

/** True when an implementation is registered (replaces `typeof fn === "function"`). */
export function hasHook(name: string): boolean {
  return registry.has(name);
}

export function callHook<T = unknown>(name: string, ...args: unknown[]): T | undefined {
  const fn = registry.get(name);
  if (!fn) return undefined;
  try {
    return fn(...args) as T;
  } catch {
    return undefined;
  }
}

/** Emit to every listener registered for `name` (fire-and-forget). */
const listeners = new Map<string, Set<HookFn>>();

export function onHook(name: string, fn: HookFn): () => void {
  let set = listeners.get(name);
  if (!set) listeners.set(name, (set = new Set()));
  set.add(fn);
  return () => set!.delete(fn);
}

export function emitHook(name: string, ...args: unknown[]): void {
  const set = listeners.get(name);
  if (!set) return;
  set.forEach((fn) => {
    try {
      fn(...args);
    } catch {
      /* isolate listener failures, like the original try/catch */
    }
  });
}
