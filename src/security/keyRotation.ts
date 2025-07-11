interface KeyRotationConfig {
  rotationInterval: number // milliseconds
  keyVersions: number // how many versions to keep
  autoRotation: boolean
}

interface KeyVersion {
  version: number
  key: string
  createdAt: number
  expiresAt: number
}

export class KeyRotationManager {
  private currentKeyVersion: number = 1
  private keys: Map<number, KeyVersion> = new Map()
  private rotationTimer: NodeJS.Timeout | null = null
  private listeners: Set<(newVersion: number) => void> = new Set()
  
  constructor(private config: KeyRotationConfig) {
    this.initializeKeys()
    if (config.autoRotation) {
      this.startAutoRotation()
    }
  }
  
  private initializeKeys(): void {
    const initialKey = this.generateSecureKey()
    const now = Date.now()
    
    this.keys.set(this.currentKeyVersion, {
      version: this.currentKeyVersion,
      key: initialKey,
      createdAt: now,
      expiresAt: now + this.config.rotationInterval
    })
  }
  
  private generateSecureKey(): string {
    const array = new Uint8Array(32) // 256 bits
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  async rotateKey(): Promise<void> {
    const newVersion = this.currentKeyVersion + 1
    const newKey = this.generateSecureKey()
    const now = Date.now()
    
    // Store new key
    this.keys.set(newVersion, {
      version: newVersion,
      key: newKey,
      createdAt: now,
      expiresAt: now + this.config.rotationInterval
    })
    
    // Update current version
    this.currentKeyVersion = newVersion
    
    // Clean old keys (keep only configured number of versions)
    const versionsToKeep = Array.from(this.keys.keys())
      .sort((a, b) => b - a)
      .slice(0, this.config.keyVersions)
    
    for (const [version] of this.keys) {
      if (!versionsToKeep.includes(version)) {
        this.keys.delete(version)
      }
    }
    
    // Notify listeners of key rotation
    this.notifyKeyRotation(newVersion)
    
    // Log rotation event
    console.log(`Key rotated to version ${newVersion} at ${new Date().toISOString()}`)
  }
  
  getCurrentKey(): string {
    const keyVersion = this.keys.get(this.currentKeyVersion)
    if (!keyVersion) {
      throw new Error('No current key available')
    }
    return keyVersion.key
  }
  
  getKey(version: number): string | undefined {
    return this.keys.get(version)?.key
  }
  
  getCurrentVersion(): number {
    return this.currentKeyVersion
  }
  
  isKeyExpired(version: number): boolean {
    const keyVersion = this.keys.get(version)
    if (!keyVersion) return true
    return Date.now() > keyVersion.expiresAt
  }
  
  private startAutoRotation(): void {
    this.rotationTimer = setInterval(() => {
      this.rotateKey().catch(error => {
        console.error('Key rotation failed:', error)
        this.notifyRotationError(error)
      })
    }, this.config.rotationInterval)
  }
  
  private notifyKeyRotation(newVersion: number): void {
    this.listeners.forEach(listener => {
      try {
        listener(newVersion)
      } catch (error) {
        console.error('Key rotation listener error:', error)
      }
    })
    
    // Dispatch global event
    window.dispatchEvent(new CustomEvent('keyRotated', { 
      detail: { newVersion, timestamp: Date.now() } 
    }))
  }
  
  private notifyRotationError(error: Error): void {
    window.dispatchEvent(new CustomEvent('keyRotationError', {
      detail: { error: error.message, timestamp: Date.now() }
    }))
  }
  
  addRotationListener(listener: (newVersion: number) => void): void {
    this.listeners.add(listener)
  }
  
  removeRotationListener(listener: (newVersion: number) => void): void {
    this.listeners.delete(listener)
  }
  
  stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer)
      this.rotationTimer = null
    }
  }
  
  getKeyInfo(): Array<{ version: number; createdAt: number; expiresAt: number; isCurrent: boolean }> {
    return Array.from(this.keys.values()).map(keyVersion => ({
      version: keyVersion.version,
      createdAt: keyVersion.createdAt,
      expiresAt: keyVersion.expiresAt,
      isCurrent: keyVersion.version === this.currentKeyVersion
    }))
  }
}