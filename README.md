# 有限会社 K Laboratory コーポレートサイト

[https://1klab.com](https://1klab.com) のソースコード。Astro 6.x + TypeScript で構築し、GitHub Actions 経由でコアサーバー (バリュードメイン) に FTPS デプロイする。

## ローカル起動

```bash
npm install
npm run dev
```

→ `http://localhost:4321/` で確認できます。

## ビルド

```bash
npm run build
```

→ `dist/` に静的ファイルが生成されます。`npm run preview` でローカル確認できます。

## デプロイ

`main` ブランチへの push をトリガに、`.github/workflows/deploy.yml` が自動で `npm ci` → `npm run build` → FTPS アップロードを実行します。詳細は同 workflow を参照。

必要な GitHub Secrets:

| 名前 | 内容 |
|---|---|
| `FTP_SERVER` | コアサーバーの FTPS ホスト |
| `FTP_USERNAME` | FTP ユーザー名 |
| `FTP_PASSWORD` | FTP パスワード |
| `FTP_REMOTE_DIR` | アップロード先パス (例: `/public_html/1klab.com/`) |
| `PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v2 サイトキー（ビルド時に Astro へ注入） |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v2 シークレットキー（contact.config.php 生成に使用） |

## お問い合わせフォーム

`/contact.php` で受け付け、`klab_ai@1klab.com` へ転送 + 自動返信メールを送信。
セキュリティ層は honeypot + reCAPTCHA v2 + サーバ側全フィールド再検証。

**ローカル開発時の設定:**

```bash
cp .env.example .env
# .env の PUBLIC_RECAPTCHA_SITE_KEY を設定（未設定時は Google 公式テストキーで動作）

cp public/contact.config.php.example public/contact.config.php
# contact.config.php の recaptcha_secret を実値に書き換え
```

`public/contact.config.php` は git 管理外。本番では GitHub Actions の Secrets から
動的に生成して FTPS でアップロードする。

## ディレクトリ構成

```
1klabcom/
├── .github/workflows/deploy.yml   # FTPS 自動デプロイ
├── public/                        # 静的アセット
│   ├── images/
│   └── docs/
├── src/
│   ├── components/                # UI 部品 (Header, Footer など)
│   ├── config/site.ts             # サイト全体の設定 (会社情報, GA, ナビ)
│   ├── layouts/Layout.astro       # 共通レイアウト
│   ├── pages/                     # ルーティング
│   └── styles/global.css          # 配色・タイポグラフィ
├── astro.config.mjs
├── package.json
└── tsconfig.json
```
