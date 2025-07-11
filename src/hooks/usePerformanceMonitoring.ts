import { useEffect, useCallback } from 'react'
import { performanceMonitor } from '../monitoring/performanceMonitor'

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.initialize()
    
    // Setup performance alert listener
    const handlePerformanceAlert = (event: CustomEvent) => {
      const { severity, metric, value, threshold } = event.detail
      
      // Show user notification for critical performance issues
      if (severity === 'critical') {
        console.warn(`Critical performance issue: ${metric} = ${value}ms (threshold: ${threshold}ms)`)
        // Could show toast notification here
      }
    }
    
    window.addEventListener('performanceAlert', handlePerformanceAlert as EventListener)
    
    return () => {
      window.removeEventListener('performanceAlert', handlePerformanceAlert as EventListener)
      performanceMonitor.destroy()
    }
  }, [])
  
  const startTiming = useCallback((name: string) => {
    return performanceMonitor.startTiming(name)
  }, [])
  
  const mark = useCallback((name: string, metadata?: Record<string, any>) => {
    performanceMonitor.mark(name, metadata)
  }, [])
  
  const measure = useCallback((name: string, startMark: string, endMark?: string) => {
    performanceMonitor.measure(name, startMark, endMark)
  }, [])
  
  const recordMetric = useCallback((category: string, name: string, value: number, metadata?: Record<string, any>) => {
    performanceMonitor.recordMetric(category, name, value, metadata)
  }, [])
  
  const getMetrics = useCallback((category?: string) => {
    return performanceMonitor.getMetrics(category)
  }, [])
  
  const getSummary = useCallback(() => {
    return performanceMonitor.getSummary()
  }, [])
  
  return {
    startTiming,
    mark,
    measure,
    recordMetric,
    getMetrics,
    getSummary
  }
}