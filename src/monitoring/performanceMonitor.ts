interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  category: string
  metadata?: Record<string, any>
}

interface PerformanceThreshold {
  metric: string
  warning: number
  critical: number
}

interface MonitoringConfig {
  enabled: boolean
  sampleRate: number // 0-1, percentage of events to capture
  bufferSize: number
  flushInterval: number // milliseconds
  endpoint?: string
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private observers: PerformanceObserver[] = []
  private config: MonitoringConfig
  private flushTimer: NodeJS.Timeout | null = null
  private isInitialized = false
  
  private readonly thresholds: PerformanceThreshold[] = [
    { metric: 'page_load', warning: 3000, critical: 5000 },
    { metric: 'largest_contentful_paint', warning: 2500, critical: 4000 },
    { metric: 'first_input_delay', warning: 100, critical: 300 },
    { metric: 'cumulative_layout_shift', warning: 0.1, critical: 0.25 },
    { metric: 'heap_used', warning: 50, critical: 100 }, // MB
    { metric: 'api_response_time', warning: 1000, critical: 3000 }
  ]
  
  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      bufferSize: 100,
      flushInterval: 30000, // 30 seconds
      ...config
    }
  }
  
  initialize(): void {
    if (!this.config.enabled || this.isInitialized) return
    
    this.initializeObservers()
    this.startMemoryMonitoring()
    this.startFlushTimer()
    this.isInitialized = true
    
    console.log('Performance monitoring initialized')
  }
  
  private initializeObservers(): void {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              this.recordMetric('navigation', 'page_load', navEntry.loadEventEnd - navEntry.fetchStart, {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                firstByte: navEntry.responseStart - navEntry.fetchStart,
                domInteractive: navEntry.domInteractive - navEntry.fetchStart
              })
            }
          }
        })
        navObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navObserver)
      } catch (error) {
        console.warn('Navigation timing observer failed:', error)
      }
      
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('lcp', 'largest_contentful_paint', entry.startTime, {
              element: (entry as any).element?.tagName,
              url: (entry as any).url
            })
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (error) {
        console.warn('LCP observer failed:', error)
      }
      
      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('fid', 'first_input_delay', (entry as any).processingStart - entry.startTime, {
              eventType: (entry as any).name
            })
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (error) {
        console.warn('FID observer failed:', error)
      }
      
      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          if (clsValue > 0) {
            this.recordMetric('cls', 'cumulative_layout_shift', clsValue)
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (error) {
        console.warn('CLS observer failed:', error)
      }
      
      // Resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming
            if (resourceEntry.name.includes('/api/')) {
              this.recordMetric('api', 'api_response_time', resourceEntry.duration, {
                url: resourceEntry.name,
                method: 'GET', // Default, would need to be tracked separately for other methods
                status: 'unknown' // Would need to be tracked separately
              })
            }
          }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (error) {
        console.warn('Resource observer failed:', error)
      }
    }
  }
  
  private startMemoryMonitoring(): void {
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.recordMetric('memory', 'heap_used', memory.usedJSHeapSize / 1024 / 1024, {
          heapTotal: memory.totalJSHeapSize / 1024 / 1024,
          heapLimit: memory.jsHeapSizeLimit / 1024 / 1024
        })
      }
    }
    
    // Initial measurement
    monitorMemory()
    
    // Monitor every 10 seconds
    setInterval(monitorMemory, 10000)
  }
  
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }
  
  recordMetric(
    category: string,
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled) return
    
    // Sample rate check
    if (Math.random() > this.config.sampleRate) return
    
    const metric: PerformanceMetric = {
      category,
      name,
      value,
      timestamp: Date.now(),
      metadata
    }
    
    // Store metric
    const key = `${category}.${name}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    const categoryMetrics = this.metrics.get(key)!
    categoryMetrics.push(metric)
    
    // Keep only recent metrics
    if (categoryMetrics.length > this.config.bufferSize) {
      categoryMetrics.shift()
    }
    
    // Check thresholds
    this.checkThresholds(metric)
  }
  
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find(t => t.metric === metric.name)
    if (!threshold) return
    
    let severity: 'warning' | 'critical' | null = null
    
    if (metric.value > threshold.critical) {
      severity = 'critical'
    } else if (metric.value > threshold.warning) {
      severity = 'warning'
    }
    
    if (severity) {
      this.sendAlert(metric, severity, threshold)
    }
  }
  
  private sendAlert(
    metric: PerformanceMetric,
    severity: 'warning' | 'critical',
    threshold: PerformanceThreshold
  ): void {
    const alert = {
      type: 'performance_alert',
      severity,
      metric: metric.name,
      value: metric.value,
      threshold: severity === 'critical' ? threshold.critical : threshold.warning,
      timestamp: metric.timestamp,
      metadata: metric.metadata,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    console.warn(`Performance ${severity}:`, alert)
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('performanceAlert', { detail: alert }))
    
    // Send to external monitoring service
    this.sendToMonitoringService(alert)
  }
  
  private async sendToMonitoringService(data: any): Promise<void> {
    if (!this.config.endpoint) return
    
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to send monitoring data:', error)
    }
  }
  
  // Custom timing measurements
  startTiming(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric('custom', name, duration)
    }
  }
  
  // Mark significant events
  mark(name: string, metadata?: Record<string, any>): void {
    performance.mark(name)
    this.recordMetric('mark', name, performance.now(), metadata)
  }
  
  // Measure between marks
  measure(name: string, startMark: string, endMark?: string): void {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name, 'measure')[0]
      this.recordMetric('measure', name, measure.duration)
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error)
    }
  }
  
  // Get metrics
  getMetrics(category?: string): Map<string, PerformanceMetric[]> | PerformanceMetric[] {
    if (category) {
      const categoryMetrics: PerformanceMetric[] = []
      for (const [key, metrics] of this.metrics) {
        if (key.startsWith(`${category}.`)) {
          categoryMetrics.push(...metrics)
        }
      }
      return categoryMetrics
    }
    return this.metrics
  }
  
  // Get performance summary
  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    for (const [key, metrics] of this.metrics) {
      if (metrics.length === 0) continue
      
      const values = metrics.map(m => m.value)
      summary[key] = {
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      }
    }
    
    return summary
  }
  
  // Flush metrics to external service
  async flush(): Promise<void> {
    if (this.metrics.size === 0) return
    
    const metricsToSend = new Map(this.metrics)
    this.metrics.clear()
    
    if (this.config.endpoint) {
      try {
        const payload = {
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metrics: Object.fromEntries(metricsToSend)
        }
        
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      } catch (error) {
        console.error('Failed to flush metrics:', error)
        // Restore metrics on failure
        for (const [key, metrics] of metricsToSend) {
          this.metrics.set(key, metrics)
        }
      }
    }
  }
  
  // Cleanup
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    
    this.metrics.clear()
    this.isInitialized = false
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor({
  endpoint: import.meta.env.VITE_MONITORING_ENDPOINT
})