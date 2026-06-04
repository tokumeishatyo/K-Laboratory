<?php
declare(strict_types=1);

/**
 * お問い合わせフォームのサーバ側処理。
 *
 * フロー:
 *   1. POST メソッド・必須項目・形式・honeypot を検証
 *   2. Google reCAPTCHA v2 トークンを Google API で検証
 *   3. 管理者宛通知メールを送信 (admin_email)
 *   4. 提出者宛自動返信メールを送信
 *   5. 成功時は /contact/thanks/ へ 302 リダイレクト
 *   6. 失敗時は人間可読のエラーページを表示
 *
 * 機密情報 (reCAPTCHA secret 等) は同階層の contact.config.php から読み込む。
 * 当該ファイルは git 管理外。contact.config.php.example をコピーして実値を設定すること。
 */

// ===== 設定読み込み =====
$configPath = __DIR__ . '/contact.config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    exit('Configuration file not found.');
}
$config = require $configPath;

$adminEmail = $config['admin_email'] ?? 'klab_ai@1klab.com';
$recaptchaSecret = $config['recaptcha_secret'] ?? '';
$siteUrl = rtrim($config['site_url'] ?? 'https://1klab.com', '/');
$thanksPath = '/contact/thanks/';
$contactAnchor = '/#contact';

// ===== ユーティリティ =====
mb_internal_encoding('UTF-8');
mb_language('uni');

/** @return never */
function respondError(string $message, int $status = 400): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=UTF-8');
    $safe = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    echo <<<HTML
<!doctype html>
<html lang="ja">
<head><meta charset="UTF-8"><title>送信エラー - 有限会社 K Laboratory</title>
<style>body{font-family:"Yu Gothic UI",sans-serif;max-width:640px;margin:80px auto;padding:0 24px;line-height:1.8;color:#1a1a1a}h1{font-size:22px;color:#bf360c}a{color:#bf360c}</style>
</head><body>
<h1>送信に失敗しました</h1>
<p>{$safe}</p>
<p>お手数ですが、しばらく時間をおいて再度お試しください。<br>
繰り返し失敗する場合は、お電話または直接メール (klab_ai@1klab.com) にてご連絡ください。</p>
<p><a href="/#contact">← お問い合わせフォームに戻る</a></p>
</body></html>
HTML;
    exit;
}

/** @return never */
function redirectTo(string $url): void
{
    header('Location: ' . $url, true, 302);
    exit;
}

function sanitizeLine(string $value): string
{
    // ヘッダーインジェクション防止: 改行・タブを除去
    $value = str_replace(["\r", "\n", "\t"], '', $value);
    return trim($value);
}

function sanitizeMessage(string $value): string
{
    // メール本文用: CRLF 統一のみ
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    return trim($value);
}

function isValidEmail(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL)
        && strlen($email) <= 254;
}

function verifyRecaptcha(string $token, string $secret, string $remoteIp): bool
{
    if ($token === '' || $secret === '') {
        return false;
    }
    $postData = http_build_query([
        'secret'   => $secret,
        'response' => $token,
        'remoteip' => $remoteIp,
    ]);
    $ctx = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content'       => $postData,
            'timeout'       => 8,
            'ignore_errors' => true,
        ],
    ]);
    $raw = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $ctx);
    if ($raw === false) {
        return false;
    }
    $data = json_decode($raw, true);
    return is_array($data) && !empty($data['success']);
}

function sendUtf8Mail(string $to, string $subject, string $body, string $fromEmail, string $fromName): bool
{
    $encodedFromName = mb_encode_mimeheader($fromName, 'UTF-8', 'B');
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . $encodedFromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'X-Mailer: KLab-ContactForm/1.0',
    ];
    $encodedSubject = mb_encode_mimeheader($subject, 'UTF-8', 'B');
    // sendmail -f は CORESERVER の制約に応じて変更が必要な場合あり
    return mail($to, $encodedSubject, $body, implode("\r\n", $headers));
}

// ===== POST 検証 =====
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    redirectTo($siteUrl . $contactAnchor);
}

// 設定不備チェック
if ($recaptchaSecret === '') {
    error_log('[contact.php] reCAPTCHA secret is not configured.');
    respondError('お問い合わせフォームのサーバ設定に問題があります。', 500);
}

// ===== honeypot: 入っていたら bot として静かに「成功」扱い =====
$honeypot = isset($_POST['website_url']) ? trim((string) $_POST['website_url']) : '';
if ($honeypot !== '') {
    // bot に検知させないため Thanks ページへリダイレクトして終了
    redirectTo($siteUrl . $thanksPath);
}

// ===== 入力取得 + サーバ側マスター定義 =====
$name           = sanitizeLine((string) ($_POST['name'] ?? ''));
$company        = sanitizeLine((string) ($_POST['company'] ?? ''));
$prefecture     = sanitizeLine((string) ($_POST['prefecture'] ?? ''));
$industry       = sanitizeLine((string) ($_POST['industry'] ?? ''));
$industryOther  = sanitizeLine((string) ($_POST['industry_other'] ?? ''));
$employees      = sanitizeLine((string) ($_POST['employees'] ?? ''));
$email          = sanitizeLine((string) ($_POST['email'] ?? ''));
$phone          = sanitizeLine((string) ($_POST['phone'] ?? ''));
$replyMethods   = isset($_POST['reply_method']) && is_array($_POST['reply_method'])
    ? array_map(fn($v) => sanitizeLine((string) $v), $_POST['reply_method'])
    : [];
$message        = sanitizeMessage((string) ($_POST['message'] ?? ''));
$privacyConsent = isset($_POST['privacy_consent']) && (string) $_POST['privacy_consent'] !== '';
$recaptchaToken = (string) ($_POST['g-recaptcha-response'] ?? '');

// クライアントと同じ選択肢マスタ (src/config/form.ts と同期)
$PREFECTURES = [
    '北海道',
    '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県',
    '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
    '沖縄県',
];
$INDUSTRIES = [
    '製造業', '建設業', '卸売業・小売業', '飲食業', '宿泊業・観光業',
    '運輸業・物流業', '不動産業', '金融業・保険業', '医療・福祉',
    '教育・学習支援', '情報通信業・IT', '農林水産業',
    '専門サービス業（士業・コンサル等）', '個人サービス業（理美容・フィットネス等）',
    '公共・非営利', 'その他',
];
$EMPLOYEE_RANGES = [
    '1〜10 名', '11〜50 名', '51〜100 名', '101〜300 名', '301 名以上',
];
$REPLY_METHOD_VALUES = ['email', 'phone'];

// ===== バリデーション =====
$errors = [];

if ($name === '' || mb_strlen($name) > 100) {
    $errors[] = 'お名前を 100 文字以内でご入力ください。';
}
if ($company === '' || mb_strlen($company) > 200) {
    $errors[] = '会社名を 200 文字以内でご入力ください。';
}
if (!in_array($prefecture, $PREFECTURES, true)) {
    $errors[] = '都道府県の選択に誤りがあります。';
}
if (!in_array($industry, $INDUSTRIES, true)) {
    $errors[] = '業種の選択に誤りがあります。';
}
if ($industry === 'その他' && ($industryOther === '' || mb_strlen($industryOther) > 100)) {
    $errors[] = '業種をご記入ください（100 文字以内）。';
}
if (!in_array($employees, $EMPLOYEE_RANGES, true)) {
    $errors[] = '従業員数の選択に誤りがあります。';
}
if (!isValidEmail($email)) {
    $errors[] = 'メールアドレスの形式に誤りがあります。';
}
if ($phone !== '' && !preg_match('/^[0-9]{10,11}$/', $phone)) {
    $errors[] = '電話番号は半角数字のみ・ハイフンなし 10〜11 桁でご入力ください。';
}
if ($replyMethods === [] || array_diff($replyMethods, $REPLY_METHOD_VALUES) !== []) {
    $errors[] = '返信方法を 1 つ以上、正しくお選びください。';
}
if (in_array('phone', $replyMethods, true) && $phone === '') {
    $errors[] = '電話でのご返信ご希望の場合は電話番号をご入力ください。';
}
if ($message === '' || mb_strlen($message) > 5000) {
    $errors[] = 'お問い合わせ内容を 5000 文字以内でご入力ください。';
}
if (!$privacyConsent) {
    $errors[] = 'プライバシーポリシーへのご同意が必要です。';
}

if ($errors !== []) {
    respondError(implode("\n", $errors), 400);
}

// ===== reCAPTCHA 検証 =====
$remoteIp = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
if (!verifyRecaptcha($recaptchaToken, $recaptchaSecret, $remoteIp)) {
    respondError('「私はロボットではありません」のチェックが確認できませんでした。', 400);
}

// ===== メール本文組み立て =====
$replyMethodLabels = [
    'email' => 'メール',
    'phone' => '電話',
];
$replyMethodsText = implode('・', array_map(
    fn($v) => $replyMethodLabels[$v] ?? $v,
    $replyMethods
));
$industryDisplay = $industry === 'その他' ? "その他（{$industryOther}）" : $industry;
$submittedAt = date('Y-m-d H:i:s');

// --- 管理者宛通知メール ---
$adminSubject = '【1klab.com】お問い合わせを受け付けました - ' . $name . ' / ' . $company;
$adminBody = <<<TXT
1klab.com のお問い合わせフォームから新規問い合わせが届きました。

────────────────────────────────────
受付日時 : {$submittedAt}
送信元IP : {$remoteIp}
────────────────────────────────────

【お名前】
{$name}

【会社名】
{$company}

【会社所在地（都道府県）】
{$prefecture}

【業種】
{$industryDisplay}

【従業員数】
{$employees}

【メールアドレス】
{$email}

【電話番号】
{$phone}

【ご希望のご返信方法】
{$replyMethodsText}

【お問い合わせ内容】
{$message}

────────────────────────────────────
個人情報取扱への同意 : ✓ 取得済み
このメールはお問い合わせフォームから自動送信されました。
TXT;

// --- 提出者宛自動返信メール ---
$autoReplySubject = '【自動返信】お問い合わせを受け付けました - 有限会社 K Laboratory';
$autoReplyBody = <<<TXT
{$name} 様

このたびは、有限会社 K Laboratory にお問い合わせをいただき、
誠にありがとうございます。

下記の内容にて、お問い合わせを受け付けいたしました。
3 営業日以内に代表より直接ご返信いたしますので、しばらくお待ちください。

※ このメールは自動送信です。本メールに直接ご返信いただいても回答いたしかねます。

────────────────────────────────────
受付日時 : {$submittedAt}
────────────────────────────────────

【お名前】
{$name}

【会社名】
{$company}

【会社所在地（都道府県）】
{$prefecture}

【業種】
{$industryDisplay}

【従業員数】
{$employees}

【メールアドレス】
{$email}

【電話番号】
{$phone}

【ご希望のご返信方法】
{$replyMethodsText}

【お問い合わせ内容】
{$message}

────────────────────────────────────

────────────────────────────────────
有限会社 K Laboratory
代表 川﨑 伸之
神奈川県高座郡寒川町
https://1klab.com
────────────────────────────────────
TXT;

// ===== メール送信 =====
$senderName = '有限会社 K Laboratory お問い合わせフォーム';

$adminSent = sendUtf8Mail($adminEmail, $adminSubject, $adminBody, $adminEmail, $senderName);
if (!$adminSent) {
    error_log('[contact.php] Failed to send admin notification mail.');
    respondError('送信処理中にエラーが発生しました。', 500);
}

// 自動返信は失敗しても全体は成功扱い（管理者側には届いているため）
$autoReplySent = sendUtf8Mail($email, $autoReplySubject, $autoReplyBody, $adminEmail, $senderName);
if (!$autoReplySent) {
    error_log('[contact.php] Failed to send auto-reply mail to ' . $email);
}

// ===== Thanks ページへリダイレクト =====
redirectTo($siteUrl . $thanksPath);
