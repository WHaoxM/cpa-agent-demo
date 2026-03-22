/**
 * 通用 ResizeObserver composable
 * 监听目标元素尺寸变化，触发回调（如 chart.resize()）
 * 自动在 onBeforeUnmount 时断开观察
 */
import { watch, onBeforeUnmount, type Ref } from 'vue'

export function useResizeObserver(
  target: Ref<HTMLElement | undefined>,
  callback: (entry: ResizeObserverEntry) => void,
  options?: { debounceMs?: number },
) {
  let observer: ResizeObserver | null = null
  let timer: number | null = null
  const debounceMs = options?.debounceMs ?? 0

  function createObserver(el: HTMLElement) {
    disconnect()
    observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      if (debounceMs > 0) {
        if (timer != null) clearTimeout(timer)
        timer = window.setTimeout(() => callback(entry), debounceMs)
      } else {
        callback(entry)
      }
    })
    observer.observe(el)
  }

  function disconnect() {
    if (timer != null) { clearTimeout(timer); timer = null }
    if (observer) { observer.disconnect(); observer = null }
  }

  watch(target, (el) => {
    if (el) createObserver(el)
    else disconnect()
  }, { immediate: true })

  onBeforeUnmount(disconnect)

  return { disconnect }
}
