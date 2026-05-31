/**
 * サイトの公開アセット (ロゴ・代表者写真・OGP・メールダミー画像) を
 * 元素材 (Logo.png / prof.png) から生成する。
 *
 * 生成物は public/images/ 配下に出力する。
 * 出力は git 管理対象 (.gitignore で元素材だけを除外している)。
 *
 * 使い方:
 *   npm run build:assets
 *
 * 元素材を更新したら、このスクリプトを再実行して public/images/ を再生成すること。
 */

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'public', 'images');

const LOGO_SRC = path.join(ROOT, 'Logo.png');
const PROF_SRC = path.join(ROOT, 'prof.png');

// SVG 属性値内に埋め込むためのフォントスタック。
// 外側を ' で囲み、各フォント名は " で括る形でないと libxml2 でパースに失敗する。
const FONT_STACK_ATTR =
  `'"Yu Gothic UI","Yu Gothic","Hiragino Sans","Meiryo",sans-serif'`;

await fs.mkdir(DEST, { recursive: true });

console.log('Building site assets to public/images/ ...');

// 1) ヘッダー用ロゴ
// 元の正方形ロゴをそのまま 192x192 PNG にリサイズ (軽量化目的)。
{
  const out = path.join(DEST, 'logo.png');
  await sharp(LOGO_SRC)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('  - logo.png        (192x192)');
}

// 2) OGP 画像 (SNS シェア用、1200x630)
// シンプルなテキスト中心のレイアウト。配色はサイト基調 (オレンジ系) に合わせる。
{
  const out = path.join(DEST, 'og-image.png');
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff8f0"/>
      <stop offset="100%" stop-color="#ffe0b2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#e65100"/>
  <text x="600" y="270" text-anchor="middle" font-family=${FONT_STACK_ATTR} font-size="64" font-weight="700" fill="#1a1a1a">有限会社 K Laboratory</text>
  <text x="600" y="360" text-anchor="middle" font-family=${FONT_STACK_ATTR} font-size="32" fill="#e65100">中小企業の IT・AI 導入を、伴走支援。</text>
  <text x="600" y="540" text-anchor="middle" font-family=${FONT_STACK_ATTR} font-size="22" fill="#666666">https://1klab.com</text>
</svg>`);
  await sharp(svg).png().toFile(out);
  console.log('  - og-image.png    (1200x630)');
}

// 3) 代表者写真 (Web 最適化、最大幅 800px JPEG)
{
  const out = path.join(DEST, 'prof.jpg');
  await sharp(PROF_SRC)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(out);
  console.log('  - prof.jpg        (max-width 800px)');
}

// 5) 悩みセクション用のインフォグラフィック画像 (横 1400px、JPEG 化)
{
  const problemsDir = path.join(DEST, 'problems');
  await fs.mkdir(problemsDir, { recursive: true });
  for (const n of ['01', '02', '03', '04']) {
    const src = path.join(ROOT, `ChatGPT${n}.png`);
    const out = path.join(problemsDir, `problem-${n}.jpg`);
    try {
      await sharp(src)
        .resize({ width: 1400, withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: false })
        .toFile(out);
      console.log(`  - problems/problem-${n}.jpg`);
    } catch (e) {
      console.log(`  - problems/problem-${n}.jpg  (skipped: ${e.code || e.message})`);
    }
  }
}

// 4) メールアドレスのダミー画像 (Bot 対策、Step 4 では仮アドレス)
{
  const out = path.join(DEST, 'email.png');
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="320" height="40" xmlns="http://www.w3.org/2000/svg">
  <rect width="320" height="40" fill="#ffffff"/>
  <text x="160" y="27" text-anchor="middle" font-family=${FONT_STACK_ATTR} font-size="20" fill="#1a1a1a">klab_ai@1klab.com</text>
</svg>`);
  await sharp(svg).png().toFile(out);
  console.log('  - email.png       (320x40, dummy address)');
}

console.log('Done.');
