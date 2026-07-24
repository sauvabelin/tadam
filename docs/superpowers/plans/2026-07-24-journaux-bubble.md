# Journaux Bubble Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Journaux" experience to the `journal` bubble where visitors browse a grid of journal cover thumbnails and read a selected one as an animated page-flip book, backed by an admin page to upload/rename/delete the source PDFs.

**Architecture:** Mirror the existing postcards feature end-to-end. A new `journaux` DB table + `JournalController` + four routes in `api/index.php` handle storage; PDFs live in `uploads/journaux/` and are served statically. The frontend adds a `journalApi.ts` client, an admin `JournalManager`, and a bubble `JournalContent` (grid) → `JournalViewer` (react-pageflip). Source PDFs are 2-up **booklet-imposed**; the viewer renders each PDF page with the already-present `pdfjs-dist`, splits each into left/right halves, and de-imposes them into reading order before feeding them to the flipbook.

**Tech Stack:** PHP 8.3 + MeekroDB (backend), React 18 + TypeScript + Vite (frontend), `pdfjs-dist` (already installed), `react-pageflip` (new dependency).

## Global Constraints

- **Minimal code, reuse existing patterns.** The postcards feature is the reference: `ImageController.php` (upload), `PostcardController.php` (CRUD), `postcardApi.ts` (client), `PostcardBackgroundManager.tsx` / `PostcardSubmissionsList.tsx` (admin), `PostcardPreview.tsx` (pdfjs rendering), `LettresContent.tsx` (two-state bubble).
- **Only one new dependency:** `react-pageflip`. No other new libs.
- **Upload limit is 10 MB** (already set in `Dockerfile`: `upload_max_filesize = 10M`, `post_max_size = 12M`). Do not change infra.
- **PDF only** (`application/pdf`), validated server-side via `finfo` real MIME (never trust the client).
- **Auth model:** public `GET /journaux`; `POST`/`DELETE` require a bearer token. GET is public by default in `index.php`; non-GET is auth-gated automatically. Register the public GET route *before* the `$requiresAuth` gate.
- **No automated test framework in this repo.** Frontend tasks verify with `npm run build:frontend` (runs `tsc && vite build`) + browser smoke. Backend verifies with `php -l` + curl against the running stack. The one pure algorithm (de-imposition) is verified with a runnable Node assertion.
- **Stack is run via poseidon**, not raw docker. The PHP API is reachable at `http://localhost:8080/api/...` and uploads at `http://localhost:8080/uploads/...` (Vite dev proxies `/api` and `/uploads` there). Bring it up with `poseidon up` if not running.
- **Do not commit anything under this repo's parent `services/` note** — this *is* the tadam service repo (its own git repo); commit here normally.
- **Brand styling:** cream `#FFFEF5`, ink `#2D2D2D`, red `#902212`, beige `#ECE5DE`, coral `#FF6B6B`; 2–4px solid `#2D2D2D` borders, hard offset box-shadows (`Npx Npx 0px rgba(0,0,0,…)`). Match the existing admin/bubble components.

---

## File Structure

**New files**
- `api/migrations/004_journaux.php` — creates/drops the `journaux` table.
- `api/src/JournalController.php` — upload / list / updateTitle / delete + private helpers.
- `src/api/journalApi.ts` — typed frontend client (`Journal`, `getJournaux`, `uploadJournal`, `updateJournalTitle`, `deleteJournal`).
- `src/components/journaux/pdfJournal.ts` — pure `deimposeOrder()` + pdfjs helpers `loadJournalPages()` / `loadJournalCover()`.
- `src/components/journaux/JournalViewer.tsx` — react-pageflip book.
- `src/components/journaux/JournalContent.tsx` — two-state bubble (grid ↔ viewer).
- `src/pages/Admin/JournalManager.tsx` — admin upload/rename/delete panel.

**Modified files**
- `api/index.php` — register four `/journaux` routes.
- `src/components/modalContent/index.tsx` — map `journal` → `JournalContent`.
- `src/pages/Admin/index.tsx` — add `'journaux'` to `AdminSection`, lazy-load + render the panel.
- `src/pages/Admin/AdminSidebar.tsx` — add the Journaux nav entry.
- `package.json` / `package-lock.json` — add `react-pageflip`.

---

## Task 1: Backend — journaux storage + API

**Files:**
- Create: `api/migrations/004_journaux.php`
- Create: `api/src/JournalController.php`
- Modify: `api/index.php` (add routes: public GET before the auth gate ~line 334; POST/POST-rename/DELETE after the auth gate, near the image routes ~line 500)

**Interfaces:**
- Consumes: MeekroDB `\DB` static API (`DB::insert`, `DB::insertId`, `DB::query`, `DB::queryFirstRow`, `DB::delete`) — same as `ImageController`.
- Produces (HTTP, consumed by Task 2):
  - `GET /journaux` → `200 [{ id:int, title:string, url:string, created_at:string }]` (newest first)
  - `POST /journaux` (multipart `file`,`title`) → `201 { id, title, url, created_at }`
  - `POST /journaux/{id}` (JSON `{title}`) → `200 { id, title, url, created_at }` | `404`
  - `DELETE /journaux/{id}` → `200 { success:true }` | `404`

- [ ] **Step 1: Create the migration**

Create `api/migrations/004_journaux.php`:

```php
<?php

return [
    'up' => function () {
        \DB::query("
            CREATE TABLE IF NOT EXISTS journaux (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                filename      VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                title         VARCHAR(255) NOT NULL,
                size          INT NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    },

    'down' => function () {
        \DB::query("DROP TABLE IF EXISTS journaux");
    }
];
```

- [ ] **Step 2: Create the controller**

Create `api/src/JournalController.php`. This adapts `ImageController`'s upload/helper patterns for PDFs (10 MB cap, `application/pdf` only) and adds list/rename/delete:

```php
<?php

namespace Tadam;

use DB;

class JournalController
{
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private const ALLOWED_TYPES = ['application/pdf'];
    private const UPLOAD_DIR = __DIR__ . '/../../uploads/journaux/';

    /**
     * Upload a journal PDF. Returns the formatted record.
     */
    public function upload(array $file, string $title): array
    {
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new \InvalidArgumentException('No file uploaded');
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException($this->getUploadErrorMessage($file['error']));
        }
        if ($file['size'] > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('File too large. Maximum size is 10MB.');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, self::ALLOWED_TYPES, true)) {
            throw new \InvalidArgumentException('Invalid file type. Only PDF is allowed.');
        }

        $filename = $this->generateUniqueFilename('pdf');

        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }

        $targetPath = self::UPLOAD_DIR . $filename;
        $success = @move_uploaded_file($file['tmp_name'], $targetPath);
        if (!$success) {
            if (!is_writable(self::UPLOAD_DIR)) {
                throw new \RuntimeException('Upload directory is not writable');
            }
            throw new \RuntimeException('Failed to save uploaded file');
        }

        $cleanTitle = trim($title) !== '' ? trim($title) : $file['name'];

        DB::insert('journaux', [
            'filename' => $filename,
            'original_name' => $file['name'],
            'title' => $cleanTitle,
            'size' => $file['size'],
        ]);

        return $this->formatRecord([
            'id' => DB::insertId(),
            'filename' => $filename,
            'title' => $cleanTitle,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * List all journaux, newest first.
     */
    public function list(): array
    {
        $rows = DB::query("SELECT * FROM journaux ORDER BY created_at DESC, id DESC");
        return array_map([$this, 'formatRecord'], $rows);
    }

    /**
     * Rename a journal. Returns the updated record or null if not found.
     */
    public function updateTitle(int $id, string $title): ?array
    {
        $row = DB::queryFirstRow("SELECT * FROM journaux WHERE id = %i", $id);
        if (!$row) {
            return null;
        }
        $clean = trim($title);
        if ($clean === '') {
            throw new \InvalidArgumentException('Title cannot be empty');
        }
        DB::update('journaux', ['title' => $clean], 'id = %i', $id);
        $row['title'] = $clean;
        return $this->formatRecord($row);
    }

    /**
     * Delete a journal (DB row + file on disk).
     */
    public function delete(int $id): bool
    {
        $row = DB::queryFirstRow("SELECT * FROM journaux WHERE id = %i", $id);
        if (!$row) {
            return false;
        }
        $filePath = self::UPLOAD_DIR . $row['filename'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        DB::delete('journaux', "id = %i", $id);
        return true;
    }

    private function formatRecord(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'url' => '/uploads/journaux/' . $row['filename'],
            'created_at' => $row['created_at'],
        ];
    }

    private function generateUniqueFilename(string $extension): string
    {
        do {
            $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        } while (file_exists(self::UPLOAD_DIR . $filename));
        return $filename;
    }

    private function getUploadErrorMessage(int $errorCode): string
    {
        $messages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
        ];
        return $messages[$errorCode] ?? 'Unknown upload error';
    }
}
```

- [ ] **Step 3: Lint the new PHP files**

Run:
```bash
php -l api/migrations/004_journaux.php && php -l api/src/JournalController.php
```
Expected: `No syntax errors detected` for both.

- [ ] **Step 4: Register the public GET route**

In `api/index.php`, add the `use` import next to the other controller imports (near line 19–24):
```php
use Tadam\JournalController;
```

Then, in the public section **before** the `$requiresAuth` computation (it is at roughly line 334, right after the public `POST /postcards` block ends), insert:

```php
// ============================================
// PUBLIC JOURNAUX ROUTE (before auth check)
// ============================================

$journalController = new JournalController();

// Route: GET /journaux - List journaux (public)
if ($method === 'GET' && $path === '/journaux') {
    try {
        jsonResponse($journalController->list());
    } catch (\Throwable $e) {
        error_log('list journaux (public) failed: ' . $e->getMessage());
        errorResponse('Erreur lors du chargement des journaux', 500);
    }
}
```

- [ ] **Step 5: Register the auth-gated mutation routes**

In `api/index.php`, after the image routes block (after the `DELETE /images/{id}` handler, ~line 567), insert:

```php
// ============================================
// JOURNAUX ADMIN ROUTES (auth required)
// ============================================

// Route: POST /journaux - Upload a journal PDF
if ($method === 'POST' && $path === '/journaux') {
    if (!isset($_FILES['file'])) {
        errorResponse('No file provided', 400);
    }
    $title = $_POST['title'] ?? '';
    try {
        $journal = $journalController->upload($_FILES['file'], (string)$title);
        jsonResponse($journal, 201);
    } catch (\InvalidArgumentException $e) {
        errorResponse($e->getMessage(), 400);
    } catch (\Exception $e) {
        error_log('upload journal failed: ' . $e->getMessage());
        errorResponse('Failed to upload journal: ' . $e->getMessage(), 500);
    }
}

// Route: POST /journaux/{id} - Rename a journal
if ($method === 'POST' && preg_match('#^/journaux/(\d+)$#', $path, $matches)) {
    $id = (int)$matches[1];
    $data = getJsonBody();
    $title = $data['title'] ?? '';
    try {
        $journal = $journalController->updateTitle($id, (string)$title);
        if ($journal === null) {
            errorResponse('Journal not found', 404);
        }
        jsonResponse($journal);
    } catch (\InvalidArgumentException $e) {
        errorResponse($e->getMessage(), 400);
    } catch (\Exception $e) {
        errorResponse('Failed to update journal: ' . $e->getMessage(), 500);
    }
}

// Route: DELETE /journaux/{id} - Delete a journal
if ($method === 'DELETE' && preg_match('#^/journaux/(\d+)$#', $path, $matches)) {
    $id = (int)$matches[1];
    try {
        if ($journalController->delete($id)) {
            jsonResponse(['success' => true]);
        } else {
            errorResponse('Journal not found', 404);
        }
    } catch (\Exception $e) {
        errorResponse('Failed to delete journal: ' . $e->getMessage(), 500);
    }
}
```

Note: `POST`/`DELETE` are non-GET, so the `$requiresAuth = $method !== 'GET' || ...` line already forces authentication before these run. No change to the gate is needed.

- [ ] **Step 6: Lint index.php**

Run:
```bash
php -l api/index.php
```
Expected: `No syntax errors detected`.

- [ ] **Step 7: Smoke-test the API against the running stack**

Ensure the stack is up (`poseidon up` if needed). Get an admin token (admin password is printed by poseidon / in `poseidon.local.yaml`):
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"<ADMIN_PASSWORD>"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
echo "$TOKEN"
```
Expected: a non-empty token string.

Upload a test PDF (use any small PDF, e.g. one of the exported postcard PDFs, or `printf` a minimal one):
```bash
curl -s -X POST http://localhost:8080/api/journaux \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@/path/to/test.pdf' -F 'title=Test Journal'
```
Expected: `201`-style JSON `{"id":1,"title":"Test Journal","url":"/uploads/journaux/....pdf","created_at":"..."}`.

List publicly (no token):
```bash
curl -s http://localhost:8080/api/journaux
```
Expected: JSON array containing the uploaded journal.

Fetch the static file:
```bash
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://localhost:8080$(curl -s http://localhost:8080/api/journaux | sed -E 's/.*"url":"([^"]+)".*/\1/')
```
Expected: `200 application/pdf`.

Rename then delete:
```bash
curl -s -X POST http://localhost:8080/api/journaux/1 -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"title":"Renamed"}'
curl -s -X DELETE http://localhost:8080/api/journaux/1 -H "Authorization: Bearer $TOKEN"
```
Expected: renamed record JSON, then `{"success":true}`. Confirm an unauthenticated `POST` returns `401`:
```bash
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE http://localhost:8080/api/journaux/1
```
Expected: `401`.

- [ ] **Step 8: Commit**

```bash
git add api/migrations/004_journaux.php api/src/JournalController.php api/index.php
git commit -m "feat(api): journaux table, controller, and routes"
```

---

## Task 2: Frontend API client

**Files:**
- Create: `src/api/journalApi.ts`

**Interfaces:**
- Consumes: the Task 1 HTTP endpoints; the `Result<T>` convention and auth-header pattern from `src/api/postcardApi.ts`.
- Produces (consumed by Tasks 3, 5, 6):
  - `interface Journal { id: number; title: string; url: string; created_at: string }`
  - `getJournaux(): Promise<Result<Journal[]>>`
  - `uploadJournal(file: File, title: string): Promise<Result<Journal>>`
  - `updateJournalTitle(id: number, title: string): Promise<Result<Journal>>`
  - `deleteJournal(id: number): Promise<Result<void>>`

- [ ] **Step 1: Create the client**

Create `src/api/journalApi.ts`. Multipart upload must **not** set `Content-Type` (the browser sets the boundary); only the auth header is added:

```ts
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
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run build:frontend
```
Expected: build succeeds (no TypeScript errors). `journalApi.ts` is not yet imported anywhere, which is fine — it must still compile.

- [ ] **Step 3: Commit**

```bash
git add src/api/journalApi.ts
git commit -m "feat(web): journalApi client"
```

---

## Task 3: Admin — Journaux manager panel

**Files:**
- Create: `src/pages/Admin/JournalManager.tsx`
- Modify: `src/pages/Admin/index.tsx` (extend `AdminSection`, lazy-load + render panel)
- Modify: `src/pages/Admin/AdminSidebar.tsx` (add nav entry)

**Interfaces:**
- Consumes: `getJournaux`, `uploadJournal`, `updateJournalTitle`, `deleteJournal`, `Journal` from Task 2.
- Produces: `AdminSection` now includes `'journaux'`; a rendered admin panel. (No exported API consumed by later tasks.)

- [ ] **Step 1: Create the manager panel**

Create `src/pages/Admin/JournalManager.tsx`:

```tsx
import { useState, useEffect } from 'react'
import {
  getJournaux,
  uploadJournal,
  updateJournalTitle,
  deleteJournal,
  type Journal,
} from '../../api/journalApi'

interface Props {
  isMobile: boolean
}

const MAX_SIZE = 10 * 1024 * 1024

export function JournalManager({ isMobile }: Props) {
  const [journaux, setJournaux] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getJournaux().then((res) => {
      if (cancelled) return
      if (res.ok) setJournaux(res.data)
      else setError(`Chargement: ${res.error}`)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleFile = (f: File | null) => {
    setFile(f)
    if (f && !title) setTitle(f.name.replace(/\.pdf$/i, ''))
  }

  const handleUpload = async () => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Fichier trop volumineux (max 10 Mo).')
      return
    }
    setUploading(true)
    setError(null)
    const res = await uploadJournal(file, title.trim() || file.name)
    setUploading(false)
    if (!res.ok) {
      setError(`Envoi: ${res.error}`)
      return
    }
    setJournaux((prev) => [res.data, ...prev])
    setFile(null)
    setTitle('')
  }

  const handleRename = async (id: number) => {
    const res = await updateJournalTitle(id, editTitle.trim())
    if (!res.ok) {
      setError(`Renommage: ${res.error}`)
      return
    }
    setJournaux((prev) => prev.map((j) => (j.id === id ? res.data : j)))
    setEditingId(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce journal ?')) return
    const res = await deleteJournal(id)
    if (!res.ok) {
      setError(`Suppression: ${res.error}`)
      return
    }
    setJournaux((prev) => prev.filter((j) => j.id !== id))
  }

  const card: React.CSSProperties = {
    background: '#FFFEF5',
    border: '3px solid #2D2D2D',
    borderRadius: '1rem',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
  }
  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    fontSize: '0.9rem',
    border: '2px solid #2D2D2D',
    borderRadius: '0.5rem',
    background: '#FFFEF5',
    fontFamily: 'inherit',
  }
  const btn: React.CSSProperties = {
    padding: '0.5rem 1rem',
    fontWeight: 700,
    color: '#FFFEF5',
    background: '#902212',
    border: '3px solid #2D2D2D',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error && (
        <div
          style={{
            marginBottom: '0.75rem',
            padding: '0.75rem 1rem',
            background: '#FF6B6B',
            border: '3px solid #2D2D2D',
            borderRadius: '0.5rem',
            fontWeight: 600,
            color: '#2D2D2D',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            x
          </button>
        </div>
      )}

      <div style={card}>
        <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: 800, color: '#2D2D2D', margin: '0 0 1rem' }}>
          Journaux
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
          />
          <button onClick={handleUpload} disabled={!file || uploading} style={{ ...btn, opacity: !file || uploading ? 0.5 : 1 }}>
            {uploading ? 'Envoi…' : 'Ajouter'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chargement...</div>
        ) : journaux.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Aucun journal.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {journaux.map((j) => (
              <div
                key={j.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: '#FFFEF5',
                  border: '3px solid #2D2D2D',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                }}
              >
                {editingId === j.id ? (
                  <>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={() => handleRename(j.id)} style={btn}>OK</button>
                    <button onClick={() => setEditingId(null)} style={{ ...inputStyle, cursor: 'pointer' }}>Annuler</button>
                  </>
                ) : (
                  <>
                    <a href={j.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontWeight: 700, color: '#2D2D2D', textDecoration: 'none' }}>
                      {j.title}
                    </a>
                    <button
                      onClick={() => { setEditingId(j.id); setEditTitle(j.title) }}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      Renommer
                    </button>
                    <button
                      onClick={() => handleDelete(j.id)}
                      style={{ padding: '0.35rem 0.6rem', fontWeight: 600, background: '#FF6B6B', border: '2px solid #2D2D2D', borderRadius: '4px', cursor: 'pointer', color: '#2D2D2D' }}
                    >
                      Suppr.
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Extend `AdminSection` and render the panel**

In `src/pages/Admin/index.tsx`:

Change the type (line 7) from:
```ts
export type AdminSection = 'postcardBackgrounds' | 'postcardSubmissions' | null
```
to:
```ts
export type AdminSection = 'postcardBackgrounds' | 'postcardSubmissions' | 'journaux' | null
```

Add a lazy import next to the other admin panel imports (after the `PostcardSubmissionsList` lazy import, ~line 21):
```ts
const JournalManager = lazy(() =>
  import('./JournalManager').then((m) => ({ default: m.JournalManager }))
)
```

In the content switch (the `adminSection === 'postcardSubmissions' ? ...` chain, ~line 284), add a branch before the `selectedBubble` branch:
```tsx
) : adminSection === 'journaux' ? (
  <JournalManager isMobile={isMobile} />
```
so it reads:
```tsx
{adminSection === 'postcardBackgrounds' ? (
  <PostcardBackgroundManager isMobile={isMobile} />
) : adminSection === 'postcardSubmissions' ? (
  <PostcardSubmissionsList isMobile={isMobile} />
) : adminSection === 'journaux' ? (
  <JournalManager isMobile={isMobile} />
) : selectedBubble ? (
  <BubbleEditor bubbleId={selectedBubble} isMobile={isMobile} />
) : (
```

- [ ] **Step 3: Add the sidebar nav entry**

In `src/pages/Admin/AdminSidebar.tsx`, the "Cartes Postales" section renders a list from an inline array (~line 159). Add a sibling "Journaux" section directly after the closing `</div>` of the Cartes Postales block (after ~line 204, before the `<ul>` that maps `BUBBLE_CATEGORIES`). Use the same markup as the Cartes Postales section but with a single item:

```tsx
{/* Journaux section */}
<div style={{ marginBottom: '0.75rem' }}>
  <button
    onClick={() => handleSelectSection('journaux')}
    style={{
      width: '100%',
      textAlign: 'left',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: '2px solid #2D2D2D',
      background: adminSection === 'journaux' ? '#902212' : '#ECE5DE',
      color: adminSection === 'journaux' ? '#FFFEF5' : '#2D2D2D',
      fontWeight: 700,
      fontSize: '1rem',
      cursor: 'pointer',
      boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.15)',
    }}
  >
    Journaux
  </button>
</div>
```

(`handleSelectSection` already exists and accepts an `AdminSection`; passing `'journaux'` is now type-valid after Step 2.)

- [ ] **Step 4: Typecheck**

Run:
```bash
npm run build:frontend
```
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Browser smoke test**

With the stack up and `npm run dev` running, open the admin page (`/admin`), log in. In the sidebar, click **Journaux**. Upload a real 2-up booklet PDF with a title. Expected: it appears in the list; the title link opens the PDF in a new tab; **Renommer** updates the title; **Suppr.** removes it (and the file — confirm the old `/uploads/journaux/...` URL now 404s).

- [ ] **Step 6: Commit**

```bash
git add src/pages/Admin/JournalManager.tsx src/pages/Admin/index.tsx src/pages/Admin/AdminSidebar.tsx
git commit -m "feat(admin): journaux upload/rename/delete panel"
```

---

## Task 4: PDF de-imposition + rendering utilities

**Files:**
- Create: `src/components/journaux/pdfJournal.ts`

**Interfaces:**
- Consumes: `pdfjs-dist` (already installed; worker wiring identical to `PostcardPreview.tsx`).
- Produces (consumed by Tasks 5 and 6):
  - `deimposeOrder(pdfPageCount: number): number[]` — pure. Maps reading position → half-image index, where half index `2*p` = left of PDF page `p`, `2*p+1` = right of PDF page `p` (0-based).
  - `loadJournalPages(url: string): Promise<string[]>` — ordered array of page image data URLs (reading order).
  - `loadJournalCover(url: string): Promise<string>` — data URL of logical page 1 (the cover).

- [ ] **Step 1: Write the failing pure-function check (TDD)**

The de-imposition is the one risky algorithm, so verify it in isolation with a runnable Node assertion. Create a throwaway check file `scratch_deimpose.mjs` at the repo root:

```js
// Inlined copy of the function under test (pure integer math, no imports).
function deimposeOrder(pdfPageCount) {
  const S = pdfPageCount
  const P = 2 * S
  if (S % 2 !== 0) {
    return Array.from({ length: P }, (_, i) => i) // sequential fallback: L0,R0,L1,R1,...
  }
  const n = S / 2
  const order = new Array(P)
  const L = (p) => p * 2
  const R = (p) => p * 2 + 1
  for (let k = 0; k < n; k++) {
    order[2 * k] = R(2 * k)             // logical page 2k+1
    order[P - 1 - 2 * k] = L(2 * k)     // logical page P-2k
    order[2 * k + 1] = L(2 * k + 1)     // logical page 2k+2
    order[P - 2 - 2 * k] = R(2 * k + 1) // logical page P-2k-1
  }
  return order
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
// 4-page journal (PDF p1=[4|1], p2=[2|3]) -> reading order half-indices [R0,L1,R1,L0]
console.assert(eq(deimposeOrder(2), [1, 2, 3, 0]), 'S=2 FAILED: ' + deimposeOrder(2))
// 8-page journal (2 sheets)
console.assert(eq(deimposeOrder(4), [1, 2, 5, 6, 7, 4, 3, 0]), 'S=4 FAILED: ' + deimposeOrder(4))
// odd sheet count -> sequential fallback
console.assert(eq(deimposeOrder(1), [0, 1]), 'S=1 FAILED: ' + deimposeOrder(1))
console.log('deimposeOrder OK')
```

- [ ] **Step 2: Run it to confirm the assertions pass for the reference values**

Run:
```bash
node scratch_deimpose.mjs
```
Expected: prints `deimposeOrder OK` with no `Assertion failed` warnings. (This validates the exact algorithm you will paste into the real module. If any assertion fails, fix the math before continuing.)

- [ ] **Step 3: Create the real module**

Create `src/components/journaux/pdfJournal.ts`:

```ts
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
  // booklet it is R0 (right half). Fall back to the whole first page if the PDF
  // is a single non-split page.
  const first = deimposeOrder(pdf.numPages)[0]
  if (pdf.numPages >= 1 && first === 1) return cropHalf(canvas, 'right')
  if (first === 0 && pdf.numPages % 2 !== 0) return cropHalf(canvas, 'left')
  return cropHalf(canvas, 'right')
}
```

- [ ] **Step 4: Typecheck**

Run:
```bash
npm run build:frontend
```
Expected: build succeeds. (Module compiles; not yet imported — fine.)

- [ ] **Step 5: Remove the scratch check and commit**

```bash
rm scratch_deimpose.mjs
git add src/components/journaux/pdfJournal.ts
git commit -m "feat(web): PDF de-imposition + rendering utils for journaux"
```

---

## Task 5: Journal viewer (react-pageflip)

**Files:**
- Create: `src/components/journaux/JournalViewer.tsx`
- Modify: `package.json`, `package-lock.json` (add `react-pageflip`)

**Interfaces:**
- Consumes: `loadJournalPages` from Task 4; `Journal` type from Task 2; `react-pageflip` default export `HTMLFlipBook`.
- Produces (consumed by Task 6): `JournalViewer` component — `export function JournalViewer({ journal, onBack }: { journal: Journal; onBack: () => void })`.

- [ ] **Step 1: Add the dependency**

Run:
```bash
npm install react-pageflip
```
Expected: `package.json` gains `react-pageflip` under `dependencies`; lockfile updates; install succeeds.

- [ ] **Step 2: Create the viewer**

Create `src/components/journaux/JournalViewer.tsx`. It renders all pages to images, computes a page aspect ratio from the first image, and mounts the flipbook with `showCover` so page 1 is a standalone cover:

```tsx
import { useEffect, useRef, useState } from 'react'
// react-pageflip ships its own types; default export is the flipbook component.
import HTMLFlipBook from 'react-pageflip'
import { loadJournalPages } from './pdfJournal'
import type { Journal } from '../../api/journalApi'

interface Props {
  journal: Journal
  onBack: () => void
}

export function JournalViewer({ journal, onBack }: Props) {
  const [pages, setPages] = useState<string[] | null>(null)
  const [aspect, setAspect] = useState(0.707) // width/height, A4-ish default
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    let cancelled = false
    setPages(null)
    setError(false)
    loadJournalPages(journal.url)
      .then((imgs) => {
        if (cancelled) return
        setPages(imgs)
        if (imgs[0]) {
          const probe = new Image()
          probe.onload = () => !cancelled && setAspect(probe.width / probe.height)
          probe.src = imgs[0]
        }
      })
      .catch((e) => {
        console.error('JournalViewer load error', e)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [journal.url])

  // Track available space so the book fits the modal on any screen.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Fit a single page inside the container (leave room for the toolbar).
  const availH = Math.max(box.h - 64, 200)
  const availW = Math.max(box.w, 200)
  let pageH = availH
  let pageW = pageH * aspect
  // On wide screens a spread is 2 pages wide; keep the pair within the box.
  const maxPairW = availW
  if (pageW * 2 > maxPairW) {
    pageW = Math.floor(maxPairW / 2)
    pageH = Math.floor(pageW / aspect)
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0, padding: '0.5rem 0.75rem' }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            fontWeight: 700,
            color: '#2D2D2D',
            background: '#ECE5DE',
            border: '2px solid #2D2D2D',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.15)',
          }}
        >
          ← Retour
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {error ? (
          <div style={{ color: '#dc2626' }}>Erreur lors du chargement du journal.</div>
        ) : !pages ? (
          <div style={{ color: '#6b7280' }}>Chargement…</div>
        ) : (
          // key forces a fresh flipbook when dimensions change (HTMLFlipBook is
          // not fully reactive to size prop changes).
          <HTMLFlipBook
            key={`${pageW}x${pageH}`}
            width={pageW}
            height={pageH}
            showCover
            maxShadowOpacity={0.4}
            style={{}}
            className=""
            startPage={0}
            size="fixed"
            minWidth={0}
            maxWidth={10000}
            minHeight={0}
            maxHeight={10000}
            drawShadow
            flippingTime={700}
            usePortrait
            startZIndex={0}
            autoSize={false}
            clickEventForward
            useMouseEvents
            swipeDistance={30}
            showPageCorners
            disableFlipByClick={false}
            mobileScrollSupport
          >
            {pages.map((src, i) => (
              <div key={i} style={{ background: '#FFFEF5', border: '1px solid #ECE5DE' }}>
                <img src={src} alt={`Page ${i + 1}`} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }} />
              </div>
            ))}
          </HTMLFlipBook>
        )}
      </div>
    </div>
  )
}
```

Note: `HTMLFlipBook` requires many numeric props; the set above are its documented props. If TypeScript complains that a listed prop is unknown for the installed version, remove that single prop — `width`, `height`, and `showCover` are the essential ones.

- [ ] **Step 3: Typecheck**

Run:
```bash
npm run build:frontend
```
Expected: build succeeds. If the compiler flags specific `HTMLFlipBook` props as invalid for the installed version, delete those props and re-run until it passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/journaux/JournalViewer.tsx package.json package-lock.json
git commit -m "feat(web): journal flipbook viewer via react-pageflip"
```

---

## Task 6: Journal bubble content (grid ↔ viewer) + wiring

**Files:**
- Create: `src/components/journaux/JournalContent.tsx`
- Modify: `src/components/modalContent/index.tsx` (map `journal` → `JournalContent`)

**Interfaces:**
- Consumes: `getJournaux`, `Journal` (Task 2); `loadJournalCover` (Task 4); `JournalViewer` (Task 5).
- Produces: `JournalContent` component rendered when the `journal` bubble opens.

- [ ] **Step 1: Create a lazy cover-thumbnail card**

Create `src/components/journaux/JournalContent.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { getJournaux, type Journal } from '../../api/journalApi'
import { loadJournalCover } from './pdfJournal'
import { JournalViewer } from './JournalViewer'

function CoverCard({ journal, onOpen }: { journal: Journal; onOpen: () => void }) {
  const [cover, setCover] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadJournalCover(journal.url)
      .then((src) => !cancelled && setCover(src))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [journal.url])

  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: '#FFFEF5',
        border: '3px solid #2D2D2D',
        borderRadius: '0.75rem',
        padding: '0.6rem',
        cursor: 'pointer',
        boxShadow: '3px 3px 0px rgba(0,0,0,0.15)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '0.707',
          background: '#ECE5DE',
          border: '2px solid #2D2D2D',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cover ? (
          <img src={cover} alt={journal.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : failed ? (
          <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>PDF</span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>…</span>
        )}
      </div>
      <span style={{ fontWeight: 700, color: '#2D2D2D', fontSize: '0.9rem' }}>{journal.title}</span>
    </button>
  )
}

export function JournalContent() {
  const [journaux, setJournaux] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Journal | null>(null)

  useEffect(() => {
    let cancelled = false
    getJournaux().then((res) => {
      if (cancelled) return
      if (res.ok) setJournaux(res.data)
      else setError(res.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (selected) {
    return (
      <div style={{ height: '100%', minHeight: '60vh' }}>
        <JournalViewer journal={selected} onBack={() => setSelected(null)} />
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', height: '100%', overflow: 'auto' }}>
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Chargement…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#dc2626', padding: '2rem' }}>{error}</div>
      ) : journaux.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Aucun journal pour le moment.</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '1rem',
          }}
        >
          {journaux.map((j) => (
            <CoverCard key={j.id} journal={j} onOpen={() => setSelected(j)} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire it into the modal registry**

In `src/components/modalContent/index.tsx`:

Add the import after the `LettresContent` import (~line 4):
```ts
import { JournalContent } from '../journaux/JournalContent'
```

Change the `journal` entry (line 28) from:
```ts
  journal: createBubbleContent('journal'),
```
to:
```ts
  journal: () => <JournalContent />,
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npm run build:frontend
```
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: End-to-end browser smoke test**

With the stack up and `npm run dev` running:
1. In admin → Journaux, upload a real 2-up booklet-imposed 4-page PDF (if not already present from Task 3).
2. Go to the site, open the **Journal** bubble. Expected: a grid of cover thumbnails, each showing the journal's front page (logical page 1) and its title.
3. Click a cover. Expected: the flipbook opens; page 1 is a standalone cover; flipping shows pages in reading order **1 → 2 → 3 → 4** (verify the content order matches the printed journal, confirming the booklet de-imposition); the back cover is page 4. Flipping works by drag/click/swipe.
4. Click **← Retour**. Expected: returns to the grid.

- [ ] **Step 5: Commit**

```bash
git add src/components/journaux/JournalContent.tsx src/components/modalContent/index.tsx
git commit -m "feat(web): journaux grid + viewer in the journal bubble"
```

---

## Self-Review

**Spec coverage**
- `journaux` table → Task 1 ✓
- `JournalController` (upload/list/updateTitle/delete) + routes → Task 1 ✓
- `uploads/journaux/` storage, static serving, 10 MB, PDF-only MIME → Task 1 ✓
- `journalApi.ts` (getJournaux/uploadJournal/updateJournalTitle/deleteJournal, multipart) → Task 2 ✓
- Admin `JournalManager` + `AdminSection` + sidebar wiring → Task 3 ✓
- De-imposition transform + pdfjs render/split + cover → Task 4 ✓
- `JournalViewer` (react-pageflip, showCover, responsive) → Task 5 ✓
- Bubble grid of cover thumbnails + `modalContentRegistry` wiring → Task 6 ✓
- Booklet reading-order example 1,2,3,4 + sequential fallback → Task 4 (asserts `deimposeOrder(2)=[1,2,3,0]`) + Task 6 smoke step 3 ✓
- Newest-first ordering → Task 1 (`ORDER BY created_at DESC`) ✓
- Only new dependency = `react-pageflip` → Task 5 ✓

**Placeholder scan:** No "TBD/TODO/handle edge cases" — every code step contains full code; every verify step has a command + expected output.

**Type consistency:**
- `Journal { id, title, url, created_at }` defined in Task 2, used identically in Tasks 3/5/6.
- `deimposeOrder(pdfPageCount): number[]`, `loadJournalPages(url): Promise<string[]>`, `loadJournalCover(url): Promise<string>` defined in Task 4, consumed with matching signatures in Tasks 5/6.
- `JournalViewer({ journal, onBack })` defined in Task 5, used with those exact props in Task 6.
- `AdminSection` union extended in Task 3 before `'journaux'` is passed to `handleSelectSection`.
- HTTP contracts in Task 1 match the client calls in Task 2.
```
