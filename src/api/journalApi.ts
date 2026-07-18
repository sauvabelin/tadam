const API_BASE = import.meta.env.VITE_API_URL || '/api'
const AUTH_STORAGE_KEY = 'tadam-admin-token'

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(AUTH_STORAGE_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface JournalEntry {
  id: number
  entry_date: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export interface JournalEntryMeta {
  id: number
  entry_date: string
  title: string
  created_at: string
  updated_at: string
}

export async function listJournalEntries(from?: string, to?: string): Promise<JournalEntryMeta[]> {
  try {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const url = `${API_BASE}/journal${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetch(url)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

export async function getJournalEntry(date: string): Promise<JournalEntry | null> {
  try {
    const response = await fetch(`${API_BASE}/journal/${date}`)
    if (response.status === 404) return null
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function saveJournalEntry(
  date: string,
  data: { title: string; content: string }
): Promise<JournalEntry | null> {
  try {
    const response = await fetch(`${API_BASE}/journal/${date}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function deleteJournalEntry(date: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/journal/${date}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function exportJournalPdf(from?: string, to?: string): Promise<void> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  const response = await fetch(
    `${API_BASE}/journal/export${params.toString() ? '?' + params.toString() : ''}`,
    { headers: getAuthHeaders() }
  )

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url

  const dateRange = from && to ? `_${from}_${to}` : ''
  a.download = `journal${dateRange}.pdf`
  a.click()

  URL.revokeObjectURL(url)
}
