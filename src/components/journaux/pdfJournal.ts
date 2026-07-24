import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Map reading position -> half-image index for a 2-up booklet-imposed PDF.
 * Half index 2*p = left half of PDF page p, 2*p+1 = right half (0-based).
 * For a proper booklet (even PDF page count) this de-imposes to reading order;
 * otherwise it falls back to a plain sequential left->right split.
 *
 * Example: 2 PDF pages ([4|1],[2|3]) -> [1,2,3,0] i.e. R0,L1,R1,L0 = pages 1,2,3,4.
 */
export function deimposeOrder(pdfPageCount: number): number[] {
  const S = pdfPageCount
  const P = 2 * S
  if (S % 2 !== 0) {
    return Array.from({ length: P }, (_, i) => i)
  }
  const n = S / 2
  const order = new Array<number>(P)
  const L = (p: number) => p * 2
  const R = (p: number) => p * 2 + 1
  for (let k = 0; k < n; k++) {
    order[2 * k] = R(2 * k)
    order[P - 1 - 2 * k] = L(2 * k)
    order[2 * k + 1] = L(2 * k + 1)
    order[P - 2 - 2 * k] = R(2 * k + 1)
  }
  return order
}

/** Render one PDF page to a canvas at the given scale. */
async function renderPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvas, viewport }).promise
  return canvas
}

/** Crop the left (or right) half of a canvas to a JPEG data URL. */
function cropHalf(canvas: HTMLCanvasElement, side: 'left' | 'right'): string {
  const halfW = Math.floor(canvas.width / 2)
  const out = document.createElement('canvas')
  out.width = halfW
  out.height = canvas.height
  const ctx = out.getContext('2d')!
  const sx = side === 'left' ? 0 : canvas.width - halfW
  ctx.drawImage(canvas, sx, 0, halfW, canvas.height, 0, 0, halfW, canvas.height)
  return out.toDataURL('image/jpeg', 0.85)
}

/**
 * Load all journal pages as image data URLs in reading order.
 */
export async function loadJournalPages(url: string, scale = 2): Promise<string[]> {
  const pdf = await pdfjsLib.getDocument(url).promise
  const halves: string[] = [] // [L0, R0, L1, R1, ...]
  for (let p = 1; p <= pdf.numPages; p++) {
    const canvas = await renderPageToCanvas(pdf, p, scale)
    halves.push(cropHalf(canvas, 'left'))
    halves.push(cropHalf(canvas, 'right'))
  }
  const order = deimposeOrder(pdf.numPages)
  return order.map((i) => halves[i])
}

/**
 * Load just the cover (logical page 1). For a booklet that is the right half of
 * the first PDF page; renders only page 1 so grid thumbnails stay cheap.
 */
export async function loadJournalCover(url: string, scale = 1.5): Promise<string> {
  const pdf = await pdfjsLib.getDocument(url).promise
  const canvas = await renderPageToCanvas(pdf, 1, scale)
  // deimposeOrder(pdf.numPages)[0] is the half index of logical page 1; for a
  // booklet it is R0 (right half). Fall back to the left half for a single
  // non-split page (sequential fallback puts logical 1 at L0).
  const first = deimposeOrder(pdf.numPages)[0]
  if (first === 0 && pdf.numPages % 2 !== 0) return cropHalf(canvas, 'left')
  return cropHalf(canvas, 'right')
}
