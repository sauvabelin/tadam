const MAX_DIMENSION = 2400
// Hard limit enforced server-side by ImageController::MAX_FILE_SIZE (5 MB).
// Keep the client target at the same value so a compressed image is never
// rejected by the server after an apparently successful resize.
const MAX_FILE_SIZE = 5 * 1024 * 1024
const JPEG_QUALITY = 0.85
const MIN_JPEG_QUALITY = 0.4

/**
 * Resize and compress an image file so it fits within MAX_DIMENSION and
 * MAX_FILE_SIZE. Returns a new File, or the original when no work is needed.
 * SVGs are returned as-is (vector — nothing to rasterize).
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/svg+xml') {
    return file
  }

  // Decode with EXIF orientation applied. Drawing a plain <img> to a canvas
  // discards the orientation tag, so portrait phone photos would come out
  // rotated; createImageBitmap with 'from-image' bakes the rotation in.
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Image invalide ou corrompue')
  }

  try {
    let { width, height } = bitmap
    const oversized = width > MAX_DIMENSION || height > MAX_DIMENSION

    // Already within both the dimension and byte budgets — nothing to do.
    if (!oversized && file.size <= MAX_FILE_SIZE) {
      return file
    }

    if (oversized) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas non supporté')
    }
    ctx.drawImage(bitmap, 0, 0, width, height)

    // PNG inputs stay PNG to keep transparency; everything else becomes JPEG
    // (far smaller for photos). PNG is lossless, so the dimension downscale
    // above is its only size lever.
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const ext = outputType === 'image/png' ? '.png' : '.jpg'
    const name = file.name.replace(/\.[^.]+$/, '') + ext

    // For JPEG, step quality down until the encoded blob fits the server cap.
    let quality = outputType === 'image/jpeg' ? JPEG_QUALITY : undefined
    let blob = await canvasToBlob(canvas, outputType, quality)
    while (
      outputType === 'image/jpeg' &&
      blob.size > MAX_FILE_SIZE &&
      quality !== undefined &&
      quality > MIN_JPEG_QUALITY
    ) {
      quality = Math.max(MIN_JPEG_QUALITY, quality - 0.15)
      blob = await canvasToBlob(canvas, outputType, quality)
    }

    return new File([blob], name, { type: outputType })
  } finally {
    bitmap.close()
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number | undefined
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to compress image'))),
      type,
      quality
    )
  })
}
