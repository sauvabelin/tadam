const API_BASE = import.meta.env.VITE_API_URL || '/api'
const AUTH_STORAGE_KEY = 'tadam-admin-token'

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
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
  role: string
  name: string
  troupe: string | null
  patrouille: string | null
  created_at: string
}

export interface PostcardSubmission {
  background_id: number
  message: string
  role: string
  name: string
  troupe?: string
  patrouille?: string
}

// ============================================
// PUBLIC
// ============================================

export async function getPostcardBackgrounds(): Promise<PostcardBackground[]> {
  try {
    const response = await fetch(`${API_BASE}/postcards/backgrounds`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

export async function submitPostcard(data: PostcardSubmission): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/postcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    if (!response.ok) {
      return { success: false, error: result.error || 'Erreur' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur de connexion' }
  }
}

export async function getPostcardPreview(data: PostcardSubmission): Promise<Blob | null> {
  try {
    const response = await fetch(`${API_BASE}/postcards/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) return null
    return await response.blob()
  } catch {
    return null
  }
}

// ============================================
// ADMIN
// ============================================

export async function listAllBackgrounds(): Promise<PostcardBackground[]> {
  try {
    const response = await fetch(`${API_BASE}/postcards/backgrounds/all`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

export async function addBackground(imageId: number, label?: string): Promise<PostcardBackground | null> {
  try {
    const response = await fetch(`${API_BASE}/postcards/backgrounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ image_id: imageId, label: label || null }),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function updateBackground(
  id: number,
  data: { label?: string; active?: boolean; sort_order?: number }
): Promise<PostcardBackground | null> {
  try {
    const response = await fetch(`${API_BASE}/postcards/backgrounds/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function deleteBackground(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/postcards/backgrounds/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function listPostcards(params?: {
  from?: string
  to?: string
  background_id?: number
}): Promise<Postcard[]> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    if (params?.background_id) searchParams.set('background_id', String(params.background_id))

    const qs = searchParams.toString()
    const response = await fetch(`${API_BASE}/postcards${qs ? '?' + qs : ''}`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

export async function deletePostcard(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/postcards/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return response.ok
  } catch {
    return false
  }
}

export function getExportUrl(backgroundId: number, from?: string, to?: string): string {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return `${API_BASE}/postcards/export/${backgroundId}${qs ? '?' + qs : ''}`
}
