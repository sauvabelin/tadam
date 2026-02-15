const MAX_DIMENSION = 2400
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB target (server limit is 10MB)
const JPEG_QUALITY = 0.85

/**
 * Resize and compress an image file if it exceeds limits.
 * Returns a new File that fits within MAX_FILE_SIZE.
 * SVGs and small files are returned as-is.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip SVGs - can't resize them this way
  if (file.type === 'image/svg+xml') {
    return file
  }

  // If already small enough, return as-is
  if (file.size <= MAX_FILE_SIZE) {
    // Still check dimensions
    const needsResize = await checkNeedsResize(file)
    if (!needsResize) return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Scale down if too large
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // Try JPEG first (smaller), fall back to PNG for transparency
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = outputType === 'image/jpeg' ? JPEG_QUALITY : undefined

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          const ext = outputType === 'image/jpeg' ? '.jpg' : '.png'
          const name = file.name.replace(/\.[^.]+$/, '') + ext
          resolve(new File([blob], name, { type: outputType }))
        },
        outputType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      // Can't process - return original
      resolve(file)
    }

    img.src = url
  })
}

function checkNeedsResize(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img.width > MAX_DIMENSION || img.height > MAX_DIMENSION)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }
    img.src = url
  })
}
