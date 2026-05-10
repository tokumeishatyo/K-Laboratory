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
