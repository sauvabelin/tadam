import type { Role } from '../data/troupes'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const AUTH_STORAGE_KEY = 'tadam-admin-token'

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(AUTH_STORAGE_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface PostcardBackground {
  id: number
  image_id: number
  label: string | null
  sort_order: number
  active: boolean
  image_url: string
  created_at: string
}

export interface Postcard {
  id: number
  background_id: number
  background_label: string | null
  background_image_url: string | null
  message: string
  role: Role
  name: string
  troupe: string | null
  patrouille: string | null
  created_at: string
}

export interface PostcardSubmission {
  background_id: number
  message: string
  role: Role
  name: string
  troupe?: string
  patrouille?: string
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number }

interface JsonRequest extends Omit<RequestInit, 'body'> {
  body?: unknown
}

async function apiRequest(path: string, init: JsonRequest): Promise<Response | Result<never>> {
  const { body, headers, ...rest } = init
  const hasBody = body !== undefined
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...getAuthHeaders(),
        ...headers,
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    console.error('postcardApi network error', path, err)
    return { ok: false, error: 'Erreur de connexion', status: 0 }
  }
}

async function extractError(response: Response): Promise<string> {
  try {
    const payload = await response.clone().json()
    if (payload?.error) return String(payload.error)
  } catch {
    // not JSON; fall through
  }
  return `HTTP ${response.status}`
}

async function apiJson<T>(path: string, init: JsonRequest = {}): Promise<Result<T>> {
  const response = await apiRequest(path, init)
  if (!(response instanceof Response)) return response

  if (!response.ok) {
    const error = await extractError(response)
    console.error('postcardApi', path, response.status, error)
    return { ok: false, error, status: response.status }
  }

  if (response.status === 204) {
    return { ok: true, data: undefined as T }
  }

  return { ok: true, data: (await response.json()) as T }
}

async function apiBlob(path: string, init: JsonRequest = {}): Promise<Result<Blob>> {
  const response = await apiRequest(path, init)
  if (!(response instanceof Response)) return response

  if (!response.ok) {
    const error = await extractError(response)
    console.error('postcardApi', path, response.status, error)
    return { ok: false, error, status: response.status }
  }

  return { ok: true, data: await response.blob() }
}

// PUBLIC

export function getPostcardBackgrounds(): Promise<Result<PostcardBackground[]>> {
  return apiJson('/postcards/backgrounds')
}

export function submitPostcard(data: PostcardSubmission): Promise<Result<{ id: number; success: true }>> {
  return apiJson('/postcards', { method: 'POST', body: data })
}

export function getPostcardPreview(data: PostcardSubmission): Promise<Result<Blob>> {
  return apiBlob('/postcards/preview', { method: 'POST', body: data })
}

// ADMIN

export function listAllBackgrounds(): Promise<Result<PostcardBackground[]>> {
  return apiJson('/postcards/backgrounds/all')
}

export function addBackground(imageId: number, label?: string): Promise<Result<PostcardBackground>> {
  return apiJson('/postcards/backgrounds', {
    method: 'POST',
    body: { image_id: imageId, label: label || null },
  })
}

export function updateBackground(
  id: number,
  data: { label?: string; active?: boolean; sort_order?: number }
): Promise<Result<PostcardBackground>> {
  return apiJson(`/postcards/backgrounds/${id}`, { method: 'POST', body: data })
}

export function deleteBackground(id: number): Promise<Result<void>> {
  return apiJson(`/postcards/backgrounds/${id}`, { method: 'DELETE' })
}

export function listPostcards(params?: {
  from?: string
  to?: string
  background_id?: number
}): Promise<Result<Postcard[]>> {
  const sp = new URLSearchParams()
  if (params?.from) sp.set('from', params.from)
  if (params?.to) sp.set('to', params.to)
  if (params?.background_id) sp.set('background_id', String(params.background_id))
  const qs = sp.toString()
  return apiJson(`/postcards${qs ? '?' + qs : ''}`)
}

export function deletePostcard(id: number): Promise<Result<void>> {
  return apiJson(`/postcards/${id}`, { method: 'DELETE' })
}

export function fetchExportPdf(
  backgroundId: number,
  from?: string,
  to?: string
): Promise<Result<Blob>> {
  const sp = new URLSearchParams()
  if (from) sp.set('from', from)
  if (to) sp.set('to', to)
  const qs = sp.toString()
  return apiBlob(`/postcards/export/${backgroundId}${qs ? '?' + qs : ''}`)
}
