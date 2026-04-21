/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 格式化数字
 * @param num 数字
 * @param digits 小数位数
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number, digits: number = 1): string {
  return (Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits)).toFixed(digits)
}

/**
 * 格式化时间
 * @param minutes 分钟数
 * @returns 格式化后的时间字符串
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}小时`
  }
  
  return `${hours}小时${remainingMinutes}分钟`
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 生成随机ID
 * @param prefix 前缀
 * @returns 随机ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * 获取颜色值
 * @param type 类型
 * @returns 颜色值
 */
export function getColor(type: string): string {
  const colors: Record<string, string> = {
    primary: '#409EFF',
    success: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C',
    info: '#909399'
  }
  return colors[type] || '#909399'
}

/**
 * 计算百分比
 * @param value 数值
 * @param total 总数
 * @param digits 小数位数
 * @returns 百分比
 */
export function calculatePercentage(value: number, total: number, digits: number = 1): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100 * Math.pow(10, digits)) / Math.pow(10, digits)
}
