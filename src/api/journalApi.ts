const API_BASE = import.meta.env.VITE_API_URL || '/api'
const AUTH_STORAGE_KEY = 'tadam-admin-token'

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(AUTH_STORAGE_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface Journal {
  id: number
  title: string
  url: string
  created_at: string
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number }

async function extractError(response: Response): Promise<string> {
  try {
    const payload = await response.json()
    if (payload?.error) return String(payload.error)
  } catch {
    // not JSON
  }
  return `HTTP ${response.status}`
}

export async function getJournaux(): Promise<Result<Journal[]>> {
  try {
    const res = await fetch(`${API_BASE}/journaux`)
    if (!res.ok) return { ok: false, error: await extractError(res), status: res.status }
    return { ok: true, data: (await res.json()) as Journal[] }
  } catch (err) {
    console.error('journalApi getJournaux', err)
    return { ok: false, error: 'Erreur de connexion', status: 0 }
  }
}

export async function uploadJournal(file: File, title: string): Promise<Result<Journal>> {
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    const res = await fetch(`${API_BASE}/journaux`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }, // no Content-Type: browser sets multipart boundary
      body: form,
    })
    if (!res.ok) return { ok: false, error: await extractError(res), status: res.status }
    return { ok: true, data: (await res.json()) as Journal }
  } catch (err) {
    console.error('journalApi uploadJournal', err)
    return { ok: false, error: 'Erreur de connexion', status: 0 }
  }
}

export async function updateJournalTitle(id: number, title: string): Promise<Result<Journal>> {
  try {
    const res = await fetch(`${API_BASE}/journaux/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) return { ok: false, error: await extractError(res), status: res.status }
    return { ok: true, data: (await res.json()) as Journal }
  } catch (err) {
    console.error('journalApi updateJournalTitle', err)
    return { ok: false, error: 'Erreur de connexion', status: 0 }
  }
}

export async function deleteJournal(id: number): Promise<Result<void>> {
  try {
    const res = await fetch(`${API_BASE}/journaux/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
    if (!res.ok) return { ok: false, error: await extractError(res), status: res.status }
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('journalApi deleteJournal', err)
    return { ok: false, error: 'Erreur de connexion', status: 0 }
  }
}
