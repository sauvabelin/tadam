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

export interface BubbleData {
  id: number | null
  bubble_id: string
  content: string | null
  category: string | null
  created_at: string | null
  updated_at: string | null
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
// IMAGE API FUNCTIONS
// ============================================

/**
 * Upload an image file
 */
export async function uploadImage(
  file: File,
  bubbleId?: string
): Promise<ImageData | null> {
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Upload failed:', errorData.error || response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
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
