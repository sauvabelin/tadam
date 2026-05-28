<?php

namespace Tadam;

use DB;
use Incenteev\EmojiPattern\EmojiPattern;

class PostcardController
{
    private const MAX_MESSAGE_LENGTH = 2000;
    // Raw-HTML cap distinct from MAX_MESSAGE_LENGTH (visible text): markup
    // overhead (nested <ul><li>…) can balloon stored bytes well beyond the
    // visible-character budget. TEXT column holds 64 KB; cap well below.
    private const MAX_HTML_LENGTH = 16000;
    private const ALLOWED_TAGS = '<p><strong><em><ul><ol><li><blockquote><br>';

    // Noto Color Emoji on jsdelivr, pinned. If reliability becomes an issue,
    // mirror just the emojis actually used (SELECT DISTINCT … FROM postcards).
    private const NOTO_BASE = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.042/';

    private const VALID_ROLES = [
        'Louveteau', 'Louvette',
        'Éclaireur', 'Éclaireuse',
        'Pionnier', 'Cordée',
        'Routier', 'Routière',
    ];

    public function listBackgrounds(bool $activeOnly = false): array
    {
        $sql = "SELECT pb.*, i.filename, i.mime_type
                FROM postcard_backgrounds pb
                JOIN images i ON i.id = pb.image_id";

        if ($activeOnly) {
            $sql .= " WHERE pb.active = 1";
        }

        $sql .= " ORDER BY pb.sort_order ASC, pb.id ASC";

        $rows = DB::query($sql);

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'image_id' => (int)$row['image_id'],
                'label' => $row['label'],
                'sort_order' => (int)$row['sort_order'],
                'active' => (bool)$row['active'],
                'image_url' => '/uploads/images/' . $row['filename'],
                'created_at' => $row['created_at'],
            ];
        }, $rows);
    }

    public function addBackground(int $imageId, ?string $label): array
    {
        $image = DB::queryFirstRow("SELECT id FROM images WHERE id = %i", $imageId);
        if (!$image) {
            throw new \InvalidArgumentException('Image not found');
        }

        $maxSort = DB::queryFirstField("SELECT MAX(sort_order) FROM postcard_backgrounds");

        DB::insert('postcard_backgrounds', [
            'image_id' => $imageId,
            'label' => $label,
            'sort_order' => ($maxSort ?? 0) + 1,
        ]);

        $id = DB::insertId();
        $row = DB::queryFirstRow(
            "SELECT pb.*, i.filename FROM postcard_backgrounds pb JOIN images i ON i.id = pb.image_id WHERE pb.id = %i",
            $id
        );

        return [
            'id' => (int)$row['id'],
            'image_id' => (int)$row['image_id'],
            'label' => $row['label'],
            'sort_order' => (int)$row['sort_order'],
            'active' => (bool)$row['active'],
            'image_url' => '/uploads/images/' . $row['filename'],
            'created_at' => $row['created_at'],
        ];
    }

    public function updateBackground(int $id, array $data): ?array
    {
        $existing = DB::queryFirstRow("SELECT id FROM postcard_backgrounds WHERE id = %i", $id);
        if (!$existing) {
            return null;
        }

        $update = [];
        if (isset($data['label'])) {
            $update['label'] = $data['label'];
        }
        if (isset($data['active'])) {
            $update['active'] = $data['active'] ? 1 : 0;
        }
        if (isset($data['sort_order'])) {
            $update['sort_order'] = (int)$data['sort_order'];
        }

        if (!empty($update)) {
            DB::update('postcard_backgrounds', $update, "id = %i", $id);
        }

        $row = DB::queryFirstRow(
            "SELECT pb.*, i.filename FROM postcard_backgrounds pb JOIN images i ON i.id = pb.image_id WHERE pb.id = %i",
            $id
        );

        return [
            'id' => (int)$row['id'],
            'image_id' => (int)$row['image_id'],
            'label' => $row['label'],
            'sort_order' => (int)$row['sort_order'],
            'active' => (bool)$row['active'],
            'image_url' => '/uploads/images/' . $row['filename'],
            'created_at' => $row['created_at'],
        ];
    }

    public function deleteBackground(int $id): bool
    {
        $existing = DB::queryFirstRow("SELECT id FROM postcard_backgrounds WHERE id = %i", $id);
        if (!$existing) {
            return false;
        }

        DB::delete('postcards', "background_id = %i", $id);
        DB::delete('postcard_backgrounds', "id = %i", $id);
        return true;
    }

    /**
     * Strip all HTML tags except the allowed TipTap subset and remove all attributes.
     */
    private function sanitizeHtml(string $html): string
    {
        $clean = strip_tags($html, self::ALLOWED_TAGS);

        // Strip attributes (onerror, style, class, …) from the surviving tags.
        $stripped = preg_replace('/<(\w+)\s+[^>]*>/', '<$1>', $clean);
        if ($stripped === null) {
            error_log('sanitizeHtml: preg_replace failed: ' . preg_last_error_msg());
            throw new \RuntimeException('Le message contient du contenu non supporté');
        }
        return $stripped;
    }

    public function submitPostcard(array $data): array
    {
        $backgroundId = $data['background_id'] ?? null;
        $message = $this->sanitizeHtml($data['message'] ?? '');
        $role = $data['role'] ?? '';
        $name = trim($data['name'] ?? '');
        $troupe = $data['troupe'] ?? null;
        $patrouille = $data['patrouille'] ?? null;

        if (!$backgroundId) {
            throw new \InvalidArgumentException('Un fond est requis');
        }

        $bg = DB::queryFirstRow(
            "SELECT id FROM postcard_backgrounds WHERE id = %i AND active = 1",
            $backgroundId
        );
        if (!$bg) {
            throw new \InvalidArgumentException('Fond invalide');
        }

        if (empty($message)) {
            throw new \InvalidArgumentException('Le message est requis');
        }

        if (mb_strlen($message) > self::MAX_HTML_LENGTH) {
            throw new \InvalidArgumentException('Le message est trop long');
        }

        // Visible text length cap (markup excluded).
        if (mb_strlen(strip_tags($message)) > self::MAX_MESSAGE_LENGTH) {
            throw new \InvalidArgumentException('Le message est trop long');
        }

        if (!in_array($role, self::VALID_ROLES, true)) {
            throw new \InvalidArgumentException('Role invalide');
        }

        if (empty($name)) {
            throw new \InvalidArgumentException('Le nom est requis');
        }

        DB::insert('postcards', [
            'background_id' => $backgroundId,
            'message' => $message,
            'role' => $role,
            'name' => $name,
            'troupe' => $troupe ?: null,
            'patrouille' => $patrouille ?: null,
        ]);

        return ['id' => DB::insertId(), 'success' => true];
    }

    public function listPostcards(?string $from, ?string $to, ?int $backgroundId): array
    {
        $where = [];
        $params = [];

        if ($from) {
            $where[] = "p.created_at >= %s";
            // Support both "2026-02-14" and "2026-02-14T18:30" formats
            $params[] = strlen($from) > 10 ? str_replace('T', ' ', $from) . ':00' : $from . ' 00:00:00';
        }
        if ($to) {
            $where[] = "p.created_at <= %s";
            $params[] = strlen($to) > 10 ? str_replace('T', ' ', $to) . ':59' : $to . ' 23:59:59';
        }
        if ($backgroundId) {
            $where[] = "p.background_id = %i";
            $params[] = $backgroundId;
        }

        $sql = "SELECT p.*, pb.label as background_label, i.filename as background_filename
                FROM postcards p
                LEFT JOIN postcard_backgrounds pb ON pb.id = p.background_id
                LEFT JOIN images i ON i.id = pb.image_id";

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " ORDER BY p.created_at DESC";

        $rows = DB::query($sql, ...$params);

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'background_id' => (int)$row['background_id'],
                'background_label' => $row['background_label'],
                'background_image_url' => $row['background_filename']
                    ? '/uploads/images/' . $row['background_filename']
                    : null,
                'message' => $row['message'],
                'role' => $row['role'],
                'name' => $row['name'],
                'troupe' => $row['troupe'],
                'patrouille' => $row['patrouille'],
                'created_at' => $row['created_at'],
            ];
        }, $rows);
    }

    public function getPostcard(int $id): ?array
    {
        $row = DB::queryFirstRow(
            "SELECT p.*, pb.label as background_label, i.filename as background_filename
             FROM postcards p
             LEFT JOIN postcard_backgrounds pb ON pb.id = p.background_id
             LEFT JOIN images i ON i.id = pb.image_id
             WHERE p.id = %i",
            $id
        );

        if (!$row) {
            return null;
        }

        return [
            'id' => (int)$row['id'],
            'background_id' => (int)$row['background_id'],
            'background_label' => $row['background_label'],
            'background_image_url' => $row['background_filename']
                ? '/uploads/images/' . $row['background_filename']
                : null,
            'message' => $row['message'],
            'role' => $row['role'],
            'name' => $row['name'],
            'troupe' => $row['troupe'],
            'patrouille' => $row['patrouille'],
            'created_at' => $row['created_at'],
        ];
    }

    public function deletePostcard(int $id): bool
    {
        $existing = DB::queryFirstRow("SELECT id FROM postcards WHERE id = %i", $id);
        if (!$existing) {
            return false;
        }

        DB::delete('postcards', "id = %i", $id);
        return true;
    }

    /**
     * Replace emoji in $text with <img> tags pointing at Noto Color Emoji PNGs.
     *
     * Uses incenteev/emoji-pattern, which generates the matcher from the
     * official Unicode emoji data files (covers ZWJ sequences, skin-tone
     * modifiers, keycaps, flags, combining marks). Falls back to leaving
     * the original text in place if the regex engine errors.
     */
    private function emojisToImages(string $text): string
    {
        $pattern = '/' . EmojiPattern::getEmojiPattern() . '/u';

        $result = preg_replace_callback($pattern, function ($match) {
            $url = $this->emojiUrl($match[0]);
            if ($url === null) {
                return $match[0];
            }
            return '<img src="' . $url . '" style="vertical-align:middle; width:3.5mm; height:3.5mm;" />';
        }, $text);

        if ($result === null) {
            error_log('emojisToImages: preg_replace_callback failed: ' . preg_last_error_msg());
            return $text;
        }
        return $result;
    }

    private function emojiUrl(string $emoji): ?string
    {
        $codepoints = [];
        $len = mb_strlen($emoji, 'UTF-8');
        for ($i = 0; $i < $len; $i++) {
            $cp = mb_ord(mb_substr($emoji, $i, 1, 'UTF-8'), 'UTF-8');
            // Noto filenames omit the U+FE0F variation selector.
            if ($cp !== 0xFE0F) {
                $codepoints[] = $cp;
            }
        }
        if (empty($codepoints)) {
            return null;
        }

        // Country flag: two regional indicators map to ISO 3166 letter pair,
        // stored under third_party/region-flags rather than the main set.
        if (count($codepoints) === 2
            && $codepoints[0] >= 0x1F1E6 && $codepoints[0] <= 0x1F1FF
            && $codepoints[1] >= 0x1F1E6 && $codepoints[1] <= 0x1F1FF
        ) {
            $code = chr($codepoints[0] - 0x1F1E6 + ord('A'))
                  . chr($codepoints[1] - 0x1F1E6 + ord('A'));
            return self::NOTO_BASE . 'third_party/region-flags/png/' . $code . '.png';
        }

        $name = implode('_', array_map('dechex', $codepoints));
        return self::NOTO_BASE . 'png/128/emoji_u' . $name . '.png';
    }

    private function getRandomStamp(): ?string
    {
        // In prod the build script (scripts/build.sh) copies stamps from
        // public/assets/Stamps/ to dist/api/stamps/. Local PHP runs against
        // the source tree won't have this dir — log so stampless PDFs are
        // at least diagnosable.
        $stampDir = __DIR__ . '/../stamps/';
        if (!is_dir($stampDir)) {
            error_log('getRandomStamp: directory missing: ' . $stampDir);
            return null;
        }
        $stamps = glob($stampDir . '*.png');
        if (empty($stamps)) {
            error_log('getRandomStamp: no PNGs found in ' . $stampDir);
            return null;
        }
        return $stamps[array_rand($stamps)];
    }

    private function renderPostcardHtml(array $postcard): string
    {
        $message = $this->emojisToImages($postcard['message']);
        $role = htmlspecialchars($postcard['role'], ENT_QUOTES, 'UTF-8');
        $name = htmlspecialchars($postcard['name'], ENT_QUOTES, 'UTF-8');

        $addressLines = '<div style="font-weight:bold;">' . $role . ' ' . $name . '</div>';
        $secondLine = [];
        if ($postcard['troupe']) {
            $secondLine[] = htmlspecialchars($postcard['troupe'], ENT_QUOTES, 'UTF-8');
        }
        if ($postcard['patrouille']) {
            $secondLine[] = htmlspecialchars($postcard['patrouille'], ENT_QUOTES, 'UTF-8');
        }
        if (!empty($secondLine)) {
            $addressLines .= '<div style="margin-top:2mm;">' . implode(' - ', $secondLine) . '</div>';
        }

        // Stamp: random image with perforated border
        $stampHtml = '';
        $stampPath = $this->getRandomStamp();
        if ($stampPath) {
            $stampHtml = '
            <div style="position:fixed; left:119mm; top:7mm; width:19mm; height:19mm;
                        border:0.5mm solid #2D2D2D; padding:1.2mm; background:#FFFEF5;">
                <div style="border:0.3mm dashed #b4b4b4; width:100%; height:100%; overflow:hidden;">
                    <img src="' . $stampPath . '" style="width:100%; height:100%;" />
                </div>
            </div>';
        }

        return '
            <div style="position:fixed; left:5mm; top:5mm; width:64mm; height:95mm; overflow:hidden; font-family:helvetica; font-size:12pt;">
                ' . $message . '
            </div>
            <div style="position:fixed; left:74mm; top:5mm; width:0.3mm; height:95mm; background-color:#969696;"></div>
            ' . $stampHtml . '
            <div style="position:fixed; left:79mm; top:40mm; width:64mm; font-family:helvetica; font-size:11pt;">
                ' . $addressLines . '
            </div>';
    }

    // A6 landscape (mm): 148 wide × 105 tall.
    private function createMpdf(): \Mpdf\Mpdf
    {
        return new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => [148, 105],
            'margin_left' => 0,
            'margin_right' => 0,
            'margin_top' => 0,
            'margin_bottom' => 0,
            'default_font' => 'helvetica',
            'tempDir' => '/tmp/mpdf',
        ]);
    }

    /**
     * Render mPDF and return the PDF bytes. Logs the full failure server-side
     * but throws a clean message — mPDF exceptions can leak temp paths and
     * library internals into the HTTP response otherwise.
     */
    private function renderPdf(callable $build): string
    {
        try {
            $mpdf = $this->createMpdf();
            $build($mpdf);
            return $mpdf->Output('', \Mpdf\Output\Destination::STRING_RETURN);
        } catch (\Throwable $e) {
            error_log('mPDF failure: ' . $e::class . ': ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            throw new \RuntimeException('Erreur lors de la génération du PDF');
        }
    }

    public function previewPdf(array $data): string
    {
        $postcard = [
            'message' => $this->sanitizeHtml($data['message'] ?? ''),
            'role' => $data['role'] ?? '',
            'name' => $data['name'] ?? '',
            'troupe' => $data['troupe'] ?? null,
            'patrouille' => $data['patrouille'] ?? null,
        ];

        return $this->renderPdf(function (\Mpdf\Mpdf $mpdf) use ($postcard) {
            $mpdf->WriteHTML($this->renderPostcardHtml($postcard));
        });
    }

    public function exportPdf(int $backgroundId, ?string $from, ?string $to): string
    {
        $postcards = $this->listPostcards($from, $to, $backgroundId);

        if (empty($postcards)) {
            throw new \InvalidArgumentException('Aucune carte postale à exporter');
        }

        return $this->renderPdf(function (\Mpdf\Mpdf $mpdf) use ($postcards) {
            foreach ($postcards as $i => $postcard) {
                if ($i > 0) {
                    $mpdf->AddPage();
                }
                $mpdf->WriteHTML($this->renderPostcardHtml($postcard));
            }
        });
    }
}
