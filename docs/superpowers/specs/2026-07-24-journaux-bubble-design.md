# Journaux bubble — design spec

**Date:** 2026-07-24
**Status:** Approved (brainstorming)
**Feature:** A "Journaux" experience in the `journal` bubble where visitors browse a
list of journaux and read a selected one as an animated flipbook, plus an admin
page to upload and manage the source PDFs.

## Goal

Let admins upload journal PDFs and let visitors read them in the `journal` bubble
as a real, page-flipping book. Reuse existing infrastructure (the postcards
feature is the reference implementation) and keep code changes minimal.

## Key decisions (from brainstorming)

- **Viewer:** animated page-flip using `react-pageflip` (the one new dependency),
  with page images rendered by the already-present `pdfjs-dist`.
- **Browse layout:** journaux are shown as a **responsive grid of cover
  thumbnails** (not a list), each with its **title** below/on it. Covers are
  auto-rendered from the PDF — no separate cover upload.
- **Upload:** one PDF at a time with a title; `application/pdf` only, ≤ 10 MB
  (already the configured PHP limit — no infra change).
- **Source PDF format:** **2-up booklet imposition**. Each PDF page holds two
  journal pages side by side; a 2-page PDF = a 4-page journal. The viewer splits
  and de-imposes into single reading-order pages.
- **Ordering:** newest-first (`created_at DESC`). No manual reordering.

## Non-goals

- No manual drag/reorder of journaux.
- No server-side thumbnail generation (covers render client-side).
- No batch/multi-file upload.
- No per-file imposition configuration UI (a code-level fallback handles the odd
  case — see Viewer transform).

## Architecture

The feature mirrors the postcards stack end-to-end.

| Layer | New / changed |
|---|---|
| DB | New migration `api/migrations/004_journaux.php` → `journaux` table |
| API | New `api/src/JournalController.php` + routes in `api/index.php` |
| Storage | `uploads/journaux/` — auto-created on first upload, served statically like `uploads/images/`, preserved by `scripts/build.sh` (which preserves all of `dist/uploads`) |
| Frontend API | New `src/api/journalApi.ts` |
| Bubble UI | New `src/components/journaux/JournalContent.tsx`, wired into `modalContentRegistry` for `journal` (replaces the generic markdown content) |
| Viewer | New `src/components/journaux/JournalViewer.tsx` — `react-pageflip` + `pdfjs-dist` |
| Admin | `AdminSection` gains `'journaux'`; new sidebar entry + `src/pages/Admin/JournalManager.tsx` |
| Deps | `+ react-pageflip` |

## Data model — `journaux` table

```sql
CREATE TABLE IF NOT EXISTS journaux (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    filename      VARCHAR(255) NOT NULL,   -- random hex name on disk, e.g. a1b2….pdf
    original_name VARCHAR(255) NOT NULL,   -- uploaded filename (default title source)
    title         VARCHAR(255) NOT NULL,   -- admin-editable display title
    size          INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Migration follows the existing `up`/`down` closure shape (see
`003_postcards.php`). `down` drops the table.

A dedicated table + controller (rather than reusing the `images` table) is used
because PDFs are not images — the `images` MIME whitelist rejects them — and
journaux carry their own title.

## API endpoints

Auth split matches postcards: public GET for reading, bearer-token auth for
mutations. Registered as flat `if`-blocks in `api/index.php`. The public list
route is registered **before** the `$requiresAuth` gate (like the public
postcard routes); the mutation routes go after it.

- `GET /journaux` — **public**. Returns `[{ id, title, url, created_at }]`,
  `created_at DESC`. `url` is `/uploads/journaux/<filename>`.
- `POST /journaux` — **auth**. `multipart/form-data`: `file` (the PDF) + `title`.
  Validates real MIME `application/pdf` (via `finfo`, like `ImageController`) and
  size ≤ 10 MB. Stores the file under a random hex name, inserts the row, returns
  the created record (201). If `title` is empty, default it from `original_name`.
- `POST /journaux/{id}` — **auth**. Body `{ title }`. Renames; returns the
  updated record. 404 if not found.
- `DELETE /journaux/{id}` — **auth**. Deletes the DB row and unlinks the file on
  disk (guarded by `file_exists`, like `ImageController::delete`). Returns
  `{ success: true }`, or 404 if not found.

The PDF bytes are **never** proxied through the API: the browser fetches the file
directly from the static `/uploads/journaux/<file>.pdf` URL, and pdfjs streams
it. In dev, Vite already proxies `/uploads` to the API container.

`JournalController` responsibilities: `upload(array $file, string $title)`,
`list()`, `updateTitle(int $id, string $title)`, `delete(int $id)`, plus private
helpers reused/adapted from `ImageController` (unique filename, MIME→extension,
upload-error messages, record formatting). Upload dir constant:
`__DIR__ . '/../../uploads/journaux/'`, `mkdir(..., 0755, true)` if missing.

## Frontend API — `src/api/journalApi.ts`

Same shape/helpers as `postcardApi.ts` (`Result<T>`, `apiJson`, bearer header
from `sessionStorage`). Note upload is multipart, so it uses `fetch` with a
`FormData` body and **must not** set `Content-Type` (the browser sets the
boundary) — auth header only.

```ts
export interface Journal {
  id: number
  title: string
  url: string          // /uploads/journaux/<file>.pdf
  created_at: string
}

getJournaux(): Promise<Result<Journal[]>>                 // public
uploadJournal(file: File, title: string): Promise<Result<Journal>>   // auth, multipart
updateJournalTitle(id: number, title: string): Promise<Result<Journal>>  // auth
deleteJournal(id: number): Promise<Result<void>>          // auth
```

## Bubble UX — `JournalContent`

Two-state component, following the `LettresContent` pattern (grid ↔ viewer):

- **Grid state:** fetch `GET /journaux`. Render a **responsive grid** of cover
  cards (e.g. CSS grid with `auto-fill`/`minmax` so columns adapt to width;
  single column on narrow mobile), each showing a **cover thumbnail** + **title**.
  The cover is logical page 1 (see transform), rendered client-side from the PDF
  via pdfjs, lazily. Clicking a card opens the viewer for that journal.
- **Viewer state:** renders `<JournalViewer journal={selected} />` with a back
  button returning to the list.

Loading / error / empty states styled consistently with `BubbleContent`.

## Viewer — `JournalViewer` and the de-imposition transform

Renders a journal PDF as a real book.

1. Fetch the PDF from `journal.url`; open with pdfjs
   (`pdfjsLib.getDocument`). Worker configured once, exactly as
   `PostcardPreview.tsx` does (`pdf.worker.mjs?url`).
2. For each PDF page, render to a canvas (scale ~2 for crispness, as in
   `PostcardPreview`), then split into **left** and **right** half-images by
   cropping the canvas (two `drawImage` slices → `toDataURL`). This yields, per
   PDF page `p` (0-based): `left(p)`, `right(p)`.
3. **De-impose** to reading order. Let `S` = PDF page count, `P = 2 × S` logical
   pages, `n = S / 2` sheets. For each sheet `k` in `0..n-1`:
   - `logical[2k+1] = right(2k)`
   - `logical[P-2k]  = left(2k)`
   - `logical[2k+2] = left(2k+1)`
   - `logical[P-2k-1] = right(2k+1)`

   (`logical` is 1-indexed.) For the 4-page case — PDF p1 `[4|1]`, p2 `[2|3]` —
   this produces reading order **1, 2, 3, 4**. This generalizes to any journal
   whose page count is a multiple of 4.
4. **Fallback:** if `S` is odd, or the booklet mapping can't be applied, fall
   back to a plain sequential split (`left(0), right(0), left(1), right(1), …`)
   so the viewer still shows something sensible.
5. Feed the ordered half-images to `react-pageflip` (`HTMLFlipBook`) with
   `showCover` enabled: page 1 sits alone as the front cover, `[2|3]` as the
   inner spread, the last page as the back cover. Book sizing responsive; single
   page on narrow screens where a spread doesn't fit.

**Cover thumbnail** used by the list = logical page 1 = `right(0)` (right half of
the first PDF page). The list can reuse the same render+split routine and just
take page 1, keeping the transform in one place.

## Admin UX — `JournalManager`

Styled like `PostcardBackgroundManager`; reached via a new sidebar section.

- **Wiring:** `AdminSection` type (in `src/pages/Admin/index.tsx`) gains
  `'journaux'`; `index.tsx` renders `<JournalManager />` for that section
  (lazy-loaded like the other admin panels); `AdminSidebar.tsx` gets a
  navigation entry (its own top-level section like "Cartes Postales", or a
  sibling item — matching the existing sidebar styling).
- **Upload:** a file picker (accept `application/pdf`) + a title input; the title
  defaults to the chosen filename and is editable before submit. One PDF at a
  time. Client-side guard on type and 10 MB size before POST, with server
  validation authoritative.
- **List:** existing journaux, newest first, each with **rename** (inline edit →
  `POST /journaux/{id}`) and **delete** (confirm → `DELETE /journaux/{id}`).
- Error/success feedback consistent with the postcards admin panels.

## Dependency

Add `react-pageflip` to `package.json` dependencies. It composes with pdfjs: we
render pages to images and hand them to the flipbook as children. No other new
dependencies.

## Testing / smoke check

1. `npm run build:frontend` compiles (TypeScript clean).
2. Admin → Journaux: upload a 2-page 2-up PDF with a title; it appears in the
   list; rename works; delete removes it and the file.
3. `GET /journaux` returns the journal publicly.
4. Bubble → Journal: the list shows the cover thumbnail + title; opening it shows
   a 4-page flipbook in reading order 1→2→3→4 with page-flip animation.
5. Delete a journal; confirm the file is gone from `uploads/journaux/` and the
   bubble list updates.

## File change summary

**New**
- `api/migrations/004_journaux.php`
- `api/src/JournalController.php`
- `src/api/journalApi.ts`
- `src/components/journaux/JournalContent.tsx`
- `src/components/journaux/JournalViewer.tsx`
- `src/pages/Admin/JournalManager.tsx`

**Changed**
- `api/index.php` — register the four `/journaux` routes.
- `src/components/modalContent/index.tsx` — map `journal` → `JournalContent`.
- `src/pages/Admin/index.tsx` — add `'journaux'` to `AdminSection`, render panel.
- `src/pages/Admin/AdminSidebar.tsx` — add the Journaux nav entry.
- `package.json` — add `react-pageflip`.

**Infra:** none required. Upload limits (10 MB) and static serving of
`uploads/` are already in place.
