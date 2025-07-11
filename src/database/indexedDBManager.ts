interface DBSchema {
  transactions: SecureTransaction
  campaigns: Campaign
  validations: EmailValidation
  notifications: SecureNotification
  userProfiles: User
  stakingPositions: StakingPosition
}

interface StakingPosition {
  id: string
  userId: string
  amount: number
  duration: number
  apy: number
  startDate: number
  endDate: number
  status: 'active' | 'completed' | 'withdrawn'
}

export class IndexedDBManager {
  private db: IDBDatabase | null = null
  private dbName = 'EmailChainDB'
  private version = 2
  private isInitialized = false
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log('IndexedDB initialized successfully')
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.createObjectStores(db)
      }
    })
  }
  
  private createObjectStores(db: IDBDatabase): void {
    // Transactions store
    if (!db.objectStoreNames.contains('transactions')) {
      const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' })
      transactionStore.createIndex('userId', 'from', { unique: false })
      transactionStore.createIndex('timestamp', 'timestamp', { unique: false })
      transactionStore.createIndex('type', 'type', { unique: false })
      transactionStore.createIndex('status', 'status', { unique: false })
    }
    
    // Campaigns store
    if (!db.objectStoreNames.contains('campaigns')) {
      const campaignStore = db.createObjectStore('campaigns', { keyPath: 'id' })
      campaignStore.createIndex('userId', 'userId', { unique: false })
      campaignStore.createIndex('status', 'status', { unique: false })
      campaignStore.createIndex('createdAt', 'createdAt', { unique: false })
    }
    
    // Validations store
    if (!db.objectStoreNames.contains('validations')) {
      const validationStore = db.createObjectStore('validations', { keyPath: 'id' })
      validationStore.createIndex('validatorId', 'validatorId', { unique: false })
      validationStore.createIndex('status', 'status', { unique: false })
      validationStore.createIndex('timestamp', 'timestamp', { unique: false })
    }
    
    // Notifications store
    if (!db.objectStoreNames.contains('notifications')) {
      const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' })
      notificationStore.createIndex('userId', 'userId', { unique: false })
      notificationStore.createIndex('read', 'read', { unique: false })
      notificationStore.createIndex('timestamp', 'timestamp', { unique: false })
      notificationStore.createIndex('priority', 'priority', { unique: false })
    }
    
    // User profiles store
    if (!db.objectStoreNames.contains('userProfiles')) {
      const userStore = db.createObjectStore('userProfiles', { keyPath: 'id' })
      userStore.createIndex('address', 'address', { unique: true })
      userStore.createIndex('tier', 'tier', { unique: false })
    }
    
    // Staking positions store
    if (!db.objectStoreNames.contains('stakingPositions')) {
      const stakingStore = db.createObjectStore('stakingPositions', { keyPath: 'id' })
      stakingStore.createIndex('userId', 'userId', { unique: false })
      stakingStore.createIndex('status', 'status', { unique: false })
      stakingStore.createIndex('endDate', 'endDate', { unique: false })
    }
  }
  
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
  }
  
  // Generic CRUD operations
  private async save<K extends keyof DBSchema>(
    storeName: K,
    data: DBSchema[K]
  ): Promise<void> {
    this.ensureInitialized()
    
    const transaction = this.db!.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  private async get<K extends keyof DBSchema>(
    storeName: K,
    id: string
  ): Promise<DBSchema[K] | undefined> {
    this.ensureInitialized()
    
    const transaction = this.db!.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  private async getAll<K extends keyof DBSchema>(
    storeName: K,
    indexName?: string,
    query?: IDBValidKey | IDBKeyRange
  ): Promise<DBSchema[K][]> {
    this.ensureInitialized()
    
    const transaction = this.db!.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const source = indexName ? store.index(indexName) : store
    
    return new Promise((resolve, reject) => {
      const request = query ? source.getAll(query) : source.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  private async delete<K extends keyof DBSchema>(
    storeName: K,
    id: string
  ): Promise<void> {
    this.ensureInitialized()
    
    const transaction = this.db!.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  // Transaction operations
  async saveTransaction(transaction: SecureTransaction): Promise<void> {
    return this.save('transactions', transaction)
  }
  
  async getTransaction(id: string): Promise<SecureTransaction | undefined> {
    return this.get('transactions', id)
  }
  
  async getTransactions(
    userId: string,
    limit = 50,
    offset = 0,
    filters?: { type?: string; status?: string }
  ): Promise<SecureTransaction[]> {
    this.ensureInitialized()
    
    const transaction = this.db!.transaction('transactions', 'readonly')
    const store = transaction.objectStore('transactions')
    const index = store.index('userId')
    
    return new Promise((resolve, reject) => {
      const transactions: SecureTransaction[] = []
      const request = index.openCursor(IDBKeyRange.only(userId))
      let count = 0
      let skipped = 0
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor && count < limit) {
          const txn = cursor.value as SecureTransaction
          
          // Apply filters
          if (filters?.type && txn.type !== filters.type) {
            cursor.continue()
            return
          }
          if (filters?.status && txn.status !== filters.status) {
            cursor.continue()
            return
          }
          
          if (skipped < offset) {
            skipped++
            cursor.continue()
            return
          }
          
          transactions.push(txn)
          count++
          cursor.continue()
        } else {
          // Sort by timestamp descending
          transactions.sort((a, b) => b.timestamp - a.timestamp)
          resolve(transactions)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  // Campaign operations
  async saveCampaign(campaign: Campaign): Promise<void> {
    return this.save('campaigns', campaign)
  }
  
  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.get('campaigns', id)
  }
  
  async getCampaigns(userId: string): Promise<Campaign[]> {
    const campaigns = await this.getAll('campaigns', 'userId', IDBKeyRange.only(userId))
    return campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  async deleteCampaign(id: string): Promise<void> {
    return this.delete('campaigns', id)
  }
  
  // Validation operations
  async saveValidation(validation: EmailValidation): Promise<void> {
    return this.save('validations', validation)
  }
  
  async getValidations(validatorId: string): Promise<EmailValidation[]> {
    return this.getAll('validations', 'validatorId', IDBKeyRange.only(validatorId))
  }
  
  // Notification operations
  async saveNotification(notification: SecureNotification): Promise<void> {
    return this.save('notifications', notification)
  }
  
  async getNotifications(userId: string, unreadOnly = false): Promise<SecureNotification[]> {
    this.ensureInitialized()
    
    const transaction = this.db!.transaction('notifications', 'readonly')
    const store = transaction.objectStore('notifications')
    const userIndex = store.index('userId')
    
    return new Promise((resolve, reject) => {
      const notifications: SecureNotification[] = []
      const request = userIndex.openCursor(IDBKeyRange.only(userId))
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const notification = cursor.value as SecureNotification
          
          if (!unreadOnly || !notification.read) {
            notifications.push(notification)
          }
          
          cursor.continue()
        } else {
          // Sort by timestamp descending
          notifications.sort((a, b) => b.timestamp - a.timestamp)
          resolve(notifications)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  async markNotificationRead(id: string): Promise<void> {
    const notification = await this.get('notifications', id)
    if (notification) {
      notification.read = true
      await this.save('notifications', notification)
    }
  }
  
  // User profile operations
  async saveUserProfile(user: User): Promise<void> {
    return this.save('userProfiles', user)
  }
  
  async getUserProfile(id: string): Promise<User | undefined> {
    return this.get('userProfiles', id)
  }
  
  async getUserByAddress(address: string): Promise<User | undefined> {
    const users = await this.getAll('userProfiles', 'address', IDBKeyRange.only(address))
    return users[0]
  }
  
  // Staking operations
  async saveStakingPosition(position: StakingPosition): Promise<void> {
    return this.save('stakingPositions', position)
  }
  
  async getStakingPositions(userId: string): Promise<StakingPosition[]> {
    return this.getAll('stakingPositions', 'userId', IDBKeyRange.only(userId))
  }
  
  // Cleanup operations
  async clearExpiredNotifications(): Promise<void> {
    this.ensureInitialized()
    
    const transaction = this.db!.transaction('notifications', 'readwrite')
    const store = transaction.objectStore('notifications')
    const now = Date.now()
    
    return new Promise((resolve, reject) => {
      const request = store.openCursor()
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const notification = cursor.value as SecureNotification
          if (notification.expiresAt && notification.expiresAt < now) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    return { used: 0, quota: 0 }
  }
  
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
    }
  }
}

// Export singleton instance
export const dbManager = new IndexedDBManager()