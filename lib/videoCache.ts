interface CachedVideo {
  url: string
  blob: Blob
  timestamp: number
}

class VideoCache {
  private cache: Map<string, CachedVideo> = new Map()
  private maxCacheSize = 10
  private downloadingUrls: Map<string, Promise<string | null>> = new Map()

  async getVideo(instagramUrl: string): Promise<string | null> {
    // Check if already cached
    const cached = this.cache.get(instagramUrl)
    if (cached) {
      console.log('Video cache HIT:', instagramUrl)
      return URL.createObjectURL(cached.blob)
    }

    // Check if already downloading - return same promise
    const existingDownload = this.downloadingUrls.get(instagramUrl)
    if (existingDownload) {
      console.log('Video already downloading, waiting...:', instagramUrl)
      return existingDownload
    }

    // Start new download
    console.log('Video cache MISS, downloading:', instagramUrl)
    return this.downloadAndCache(instagramUrl)
  }

  async downloadAndCache(instagramUrl: string): Promise<string | null> {
    // Create download promise and store it
    const downloadPromise = this._performDownload(instagramUrl)
    this.downloadingUrls.set(instagramUrl, downloadPromise)
    
    try {
      const result = await downloadPromise
      return result
    } finally {
      this.downloadingUrls.delete(instagramUrl)
    }
  }

  private async _performDownload(instagramUrl: string): Promise<string | null> {
    try {
      console.log('Starting download:', instagramUrl)
      const startTime = Date.now()

      const response = await fetch('/api/download-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instagramUrl }),
      })

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`)
      }

      const blob = await response.blob()
      const downloadTime = Date.now() - startTime
      console.log(`Download complete in ${downloadTime}ms:`, instagramUrl, `Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`)
      
      // Add to cache
      this.cache.set(instagramUrl, {
        url: instagramUrl,
        blob: blob,
        timestamp: Date.now(),
      })

      // Evict old entries if cache is too large
      this.evictOldEntries()

      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Error downloading video:', error)
      return null
    }
  }

  private evictOldEntries() {
    if (this.cache.size <= this.maxCacheSize) return

    console.log(`Cache size ${this.cache.size} exceeds max ${this.maxCacheSize}, evicting old entries`)

    // Sort by timestamp and remove oldest
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toRemove = entries.slice(0, entries.length - this.maxCacheSize)
    toRemove.forEach(([key, value]) => {
      URL.revokeObjectURL(URL.createObjectURL(value.blob))
      this.cache.delete(key)
      console.log('Evicted from cache:', key)
    })
  }

  prefetch(instagramUrls: string[]) {
    // Prefetch videos in the background
    console.log('Prefetching videos:', instagramUrls.length)
    instagramUrls.forEach(url => {
      if (!this.cache.has(url) && !this.downloadingUrls.has(url)) {
        // Don't await - let it happen in background
        this.downloadAndCache(url).catch(err => {
          console.error('Prefetch failed for:', url, err)
        })
      }
    })
  }

  clear() {
    this.cache.forEach(cached => {
      URL.revokeObjectURL(URL.createObjectURL(cached.blob))
    })
    this.cache.clear()
    this.downloadingUrls.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }

  getCacheStats() {
    const totalSize = Array.from(this.cache.values()).reduce((sum, item) => sum + item.blob.size, 0)
    return {
      count: this.cache.size,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      downloading: this.downloadingUrls.size
    }
  }
}

export const videoCache = new VideoCache()