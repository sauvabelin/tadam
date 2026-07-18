import { BulleId } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const AUTH_STORAGE_KEY = 'tadam-admin-token'

/**
 * Get the authentication token from session storage
 */
function getAuthToken(): string | null {
  return sessionStorage.getItem(AUTH_STORAGE_KEY)
}

/**
 * Get authorization headers if token exists
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

export interface ImageData {
  id: number
  filename: string
  original_name: string
  mime_type: string
  size: number
  uploaded_by_bubble: string | null
  url: string
  created_at: string
}

export interface TabData {
  id: number
  bubble_id: string
  tab_name: string
  content: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BubbleData {
  id: number | null
  bubble_id: string
  content: string | null
  category: string | null
  created_at: string | null
  updated_at: string | null
  tabs: TabData[]
}

export interface ApiResponse {
  success: boolean
  data?: BubbleData
  error?: string
}

/**
 * Get a single bubble by ID
 */
export async function getBubble(bubbleId: BulleId): Promise<BubbleData | null> {
  try {
    const response = await fetch(`${API_BASE}/bubbles/${bubbleId}`)

    if (!response.ok) {
      console.error(`Failed to fetch bubble ${bubbleId}: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching bubble ${bubbleId}:`, error)
    return null
  }
}

/**
 * Save bubble content
 */
export async function saveBubble(
  bubbleId: BulleId,
  content: string
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/bubbles/${bubbleId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error(`Error saving bubble ${bubbleId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * List all bubbles, optionally filtered by category
 */
export async function listBubbles(category?: string): Promise<BubbleData[]> {
  try {
    const url = category
      ? `${API_BASE}/bubbles?category=${encodeURIComponent(category)}`
      : `${API_BASE}/bubbles`

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Failed to list bubbles: ${response.status}`)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error listing bubbles:', error)
    return []
  }
}

// ============================================
// TAB API FUNCTIONS
// ============================================

/**
 * Create a new tab for a bubble
 */
export async function createTab(
  bubbleId: string,
  tabName: string
): Promise<TabData | null> {
  try {
    const response = await fetch(`${API_BASE}/bubbles/${bubbleId}/tabs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ tab_name: tabName }),
    })

    if (!response.ok) {
      console.error('Failed to create tab:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating tab:', error)
    return null
  }
}

/**
 * Update a tab's name and/or content
 */
export async function saveTab(
  bubbleId: string,
  tabId: number,
  data: { tab_name?: string; content?: string }
): Promise<TabData | null> {
  try {
    const response = await fetch(
      `${API_BASE}/bubbles/${bubbleId}/tabs/${tabId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      console.error('Failed to save tab:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error saving tab:', error)
    return null
  }
}

/**
 * Delete a tab
 */
export async function deleteTab(
  bubbleId: string,
  tabId: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE}/bubbles/${bubbleId}/tabs/${tabId}`,
      {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      }
    )

    return response.ok
  } catch (error) {
    console.error('Error deleting tab:', error)
    return false
  }
}

/**
 * Reorder tabs for a bubble
 */
export async function reorderTabs(
  bubbleId: string,
  tabIds: number[]
): Promise<TabData[]> {
  try {
    const response = await fetch(
      `${API_BASE}/bubbles/${bubbleId}/tabs/reorder`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ tab_ids: tabIds }),
      }
    )

    if (!response.ok) {
      console.error('Failed to reorder tabs:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error reordering tabs:', error)
    return []
  }
}

// ============================================
// IMAGE API FUNCTIONS
// ============================================

/**
 * Upload an image file
 */
export async function uploadImage(
  file: File,
  bubbleId?: string
): Promise<{ data: ImageData | null; error?: string }> {
  // Client-side size check (10MB limit matching server)
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return { data: null, error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum: 10 Mo.` }
  }

  try {
    const formData = new FormData()
    formData.append('file', file)
    if (bubbleId) {
      formData.append('bubble_id', bubbleId)
    }

    const response = await fetch(`${API_BASE}/images`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    })

    const text = await response.text()
    let json: Record<string, unknown> | null = null
    try {
      json = JSON.parse(text)
    } catch {
      // Server returned non-JSON (e.g. HTML error page)
    }

    if (!response.ok) {
      const errMsg = (json?.error as string) || `Erreur serveur (${response.status})`
      return { data: null, error: errMsg }
    }

    if (!json) {
      return { data: null, error: 'Reponse invalide du serveur' }
    }

    return { data: json as unknown as ImageData }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { data: null, error: 'Erreur de connexion' }
  }
}

/**
 * Delete an image by ID
 */
export async function deleteImage(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/images/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

/**
 * List all uploaded images
 */
export async function listImages(): Promise<ImageData[]> {
  try {
    const response = await fetch(`${API_BASE}/images`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      console.error('Failed to list images:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error listing images:', error)
    return []
  }
}

/**
 * Get images not used in any bubble content
 */
export async function getUnusedImages(): Promise<ImageData[]> {
  try {
    const response = await fetch(`${API_BASE}/images/unused`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      console.error('Failed to get unused images:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting unused images:', error)
    return []
  }
}

/**
 * Delete all unused images
 */
export async function cleanupUnusedImages(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/images/unused`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      console.error('Failed to cleanup unused images:', response.status)
      return 0
    }

    const data = await response.json()
    return data.deleted || 0
  } catch (error) {
    console.error('Error cleaning up unused images:', error)
    return 0
  }
}
