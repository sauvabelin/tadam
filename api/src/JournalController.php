<?php

namespace Tadam;

use DB;
use Dompdf\Dompdf;
use Dompdf\Options;

class JournalController
{
    /**
     * List all entries (meta only, no content) optionally filtered by date range.
     * Sorted ascending by date.
     */
    public function list(?string $from = null, ?string $to = null): array
    {
        if ($from !== null && $to !== null) {
            return DB::query(
                "SELECT id, entry_date, title, created_at, updated_at
                 FROM journal_entries
                 WHERE entry_date BETWEEN %s AND %s
                 ORDER BY entry_date ASC",
                $from,
                $to
            ) ?: [];
        }

        return DB::query(
            "SELECT id, entry_date, title, created_at, updated_at
             FROM journal_entries
             ORDER BY entry_date ASC"
        ) ?: [];
    }

    /**
     * Get a single entry by date (YYYY-MM-DD).
     */
    public function get(string $date): ?array
    {
        return DB::queryFirstRow(
            "SELECT id, entry_date, title, content, created_at, updated_at
             FROM journal_entries
             WHERE entry_date = %s",
            $date
        ) ?: null;
    }

    /**
     * Create or update an entry for the given date (upsert).
     */
    public function save(string $date, array $data): array
    {
        $title = $data['title'] ?? '';
        $content = $data['content'] ?? '';

        DB::query(
            "INSERT INTO journal_entries (entry_date, title, content)
             VALUES (%s, %s, %s)
             ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                content = VALUES(content),
                updated_at = CURRENT_TIMESTAMP",
            $date,
            $title,
            $content
        );

        return $this->get($date);
    }

    /**
     * Delete entry for the given date.
     */
    public function delete(string $date): bool
    {
        $entry = $this->get($date);
        if (!$entry) {
            return false;
        }

        DB::delete('journal_entries', "entry_date = %s", $date);
        return true;
    }

    /**
     * Generate and stream a PDF of entries, optionally filtered by date range.
     */
    public function exportPdf(?string $from = null, ?string $to = null): void
    {
        $entries = $this->list($from, $to);
        $html = $this->buildPdfHtml($entries, $from, $to);

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'journal';
        if ($from && $to) {
            $filename .= "_{$from}_{$to}";
        }
        $filename .= '.pdf';

        header('Content-Type: application/pdf');
        header("Content-Disposition: attachment; filename=\"{$filename}\"");
        echo $dompdf->output();
        exit;
    }

    /**
     * Build the HTML document used for PDF generation.
     */
    private function buildPdfHtml(array $entries, ?string $from, ?string $to): string
    {
        $titleText = 'Journal';
        if ($from && $to) {
            $titleText .= " ({$from} — {$to})";
        }
        $titleHtml = htmlspecialchars($titleText, ENT_QUOTES, 'UTF-8');

        $body = '';
        foreach ($entries as $entry) {
            $date = htmlspecialchars($entry['entry_date'], ENT_QUOTES, 'UTF-8');
            $entryTitle = htmlspecialchars($entry['title'], ENT_QUOTES, 'UTF-8');
            $contentHtml = $this->markdownToHtml($entry['content'] ?? '');

            $body .= "<div class=\"entry\">
                <p class=\"entry-date\">{$date}</p>
                <h2 class=\"entry-title\">{$entryTitle}</h2>
                <div class=\"entry-content\">{$contentHtml}</div>
            </div>\n<hr>\n";
        }

        if (empty($entries)) {
            $body = '<p>Aucune entrée de journal pour cette période.</p>';
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>{$titleHtml}</title>
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #222; margin: 30px; }
  h1 { font-size: 20px; color: #902212; border-bottom: 2px solid #902212; padding-bottom: 6px; margin-bottom: 24px; }
  .entry { margin-bottom: 16px; page-break-inside: avoid; }
  .entry-date { font-size: 10px; color: #888; margin: 0 0 4px 0; }
  .entry-title { font-size: 15px; color: #902212; margin: 0 0 8px 0; }
  .entry-content { line-height: 1.6; }
  .entry-content h1, .entry-content h2, .entry-content h3 { color: #333; }
  .entry-content strong { font-weight: bold; }
  .entry-content em { font-style: italic; }
  .entry-content blockquote { border-left: 3px solid #ccc; padding-left: 10px; color: #555; font-style: italic; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
</style>
</head>
<body>
<h1>{$titleHtml}</h1>
{$body}
</body>
</html>
HTML;
    }

    /**
     * Convert basic Markdown to HTML for PDF rendering.
     * Handles the most common elements; not a full Markdown parser.
     */
    private function markdownToHtml(string $markdown): string
    {
        // Escape HTML entities first
        $html = htmlspecialchars($markdown, ENT_QUOTES, 'UTF-8');

        // ATX headers
        $html = preg_replace('/^### (.+)$/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^## (.+)$/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^# (.+)$/m', '<h1>$1</h1>', $html);

        // Bold + italic
        $html = preg_replace('/\*\*\*(.+?)\*\*\*/s', '<strong><em>$1</em></strong>', $html);
        $html = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $html);
        $html = preg_replace('/\*(.+?)\*/s', '<em>$1</em>', $html);

        // Blockquote
        $html = preg_replace('/^&gt; (.+)$/m', '<blockquote>$1</blockquote>', $html);

        // Unordered list items
        $html = preg_replace('/^[-*] (.+)$/m', '<li>$1</li>', $html);

        // Wrap consecutive <li> in <ul>
        $html = preg_replace('/(<li>.*<\/li>(\n|$))+/s', '<ul>$0</ul>', $html);

        // Double newlines → paragraph break
        $html = preg_replace('/\n{2,}/', '</p><p>', $html);
        $html = '<p>' . $html . '</p>';

        // Remaining single newlines → line break
        $html = preg_replace('/\n/', '<br>', $html);

        return $html;
    }
}
