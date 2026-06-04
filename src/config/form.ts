// お問い合わせフォーム関連の選択肢・定数を一箇所に集約する。
// Astro 側（フロント）と PHP 側（サーバ）双方で同じ値集合を扱う必要があるため、
// PHP 側にも同等の配列を持たせる（contact.php の冒頭定義と同期させること）。

/** 都道府県（北→南の地理順） */
export const PREFECTURES = [
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
] as const;

/** 業種（粗めの 16 分類 + その他） */
export const INDUSTRIES = [
  '製造業',
  '建設業',
  '卸売業・小売業',
  '飲食業',
  '宿泊業・観光業',
  '運輸業・物流業',
  '不動産業',
  '金融業・保険業',
  '医療・福祉',
  '教育・学習支援',
  '情報通信業・IT',
  '農林水産業',
  '専門サービス業（士業・コンサル等）',
  '個人サービス業（理美容・フィットネス等）',
  '公共・非営利',
  'その他',
] as const;

/** 業種で「その他」を選んだ場合の自由記述欄を出現させるためのキー */
export const INDUSTRY_OTHER_VALUE = 'その他';

/** 従業員数（中小企業基本法の境目に概ね合わせた 5 区分） */
export const EMPLOYEE_RANGES = [
  '1〜10 名',
  '11〜50 名',
  '51〜100 名',
  '101〜300 名',
  '301 名以上',
] as const;

/** 返信方法（複数選択可・最低 1 つ必須） */
export const CONTACT_METHODS = [
  { value: 'email', label: 'メール' },
  { value: 'phone', label: '電話' },
] as const;

export type ContactMethodValue = (typeof CONTACT_METHODS)[number]['value'];

/** SLA 表記（フォーム冒頭・Thanks ページ・自動返信メールで統一して使う） */
export const REPLY_SLA_TEXT = '3 営業日以内に代表より直接ご返信いたします';

/** 個人情報取扱同意チェックのラベル文 */
export const PRIVACY_CONSENT_LABEL =
  'プライバシーポリシーに同意の上、送信します';

/** honeypot フィールド名（CSS で非表示にしてユーザーには見せない） */
export const HONEYPOT_FIELD_NAME = 'website_url';

/** PHP バックエンドのエンドポイント（public/contact.php） */
export const CONTACT_FORM_ACTION = '/contact.php';

/** 送信完了後のリダイレクト先 */
export const CONTACT_THANKS_PATH = '/contact/thanks/';
