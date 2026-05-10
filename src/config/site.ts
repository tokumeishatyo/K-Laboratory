// サイト全体の設定を一箇所に集約する。
// ハードコード値（社名・URL・GA測定ID・ナビ項目など）はここから参照する。

export const SITE = {
  /** 正式社名 (フッター・OGP・JSON-LD などで使用) */
  name: '有限会社 K Laboratory',
  /** ヘッダー等で使う短縮表記 */
  shortName: 'K Laboratory',
  /** 本番 URL (canonical / OGP url ベース) */
  url: 'https://1klab.com',
  /** デフォルトのページ説明文 (各ページが上書き可) */
  description:
    '有限会社 K Laboratory は、中小企業のIT・AI 導入を伴走支援するコンサルティング会社です。30 年のフルスタック経験と AI 駆動開発で、経営課題の解決を加速します。',
  /** OGP locale */
  locale: 'ja_JP',
  /** フッター著作権表記 */
  copyright: '© 2026 有限会社 K Laboratory',
  /** Google Analytics 4 測定 ID */
  ga: {
    measurementId: 'G-LSEPGZV1KN',
  },
  /** 連絡先 (フェーズ1ではダミー画像で表示する想定) */
  contact: {
    email: 'klab_ai@1klab.com',
  },
  /** 会社情報 (会社案内ページ等で使用) */
  company: {
    legalName: '有限会社 K Laboratory',
    founded: '2003年2月',
    address: '神奈川県高座郡寒川町',
    representative: '川﨑 伸之',
    capital: '300万円',
  },
} as const;

export const NAV = {
  /** ヘッダーに表示するナビゲーション */
  header: [
    { href: '/', label: 'トップ' },
    { href: '/about/', label: '会社案内' },
    { href: '/profile/', label: '代表略歴' },
  ],
  /** フッターに表示する法的リンク */
  footer: [
    { href: '/privacy/', label: 'プライバシーポリシー' },
    { href: '/cookies/', label: 'クッキーポリシー' },
  ],
} as const;
