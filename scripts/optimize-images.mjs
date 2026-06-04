/**
 * 既存の public/images/ 配下の JPG/PNG をベースに、最適化された派生を生成する。
 *
 * 生成物:
 *   1. すべての .jpg / .png の隣に .webp を生成（〜50% ファイルサイズ削減）
 *   2. above-the-fold な主要画像にはさらに 800px 幅の `-small.jpg` / `-small.webp` を生成
 *      （モバイル用 srcset 候補。実描画サイズと配信ピクセル数の乖離を埋める）
 *
 * 入力ファイルがすでに up-to-date な派生を持っていればスキップする（mtime ベース）。
 *
 * 使い方:
 *   npm run build:webp
 *
 * 元の JPG/PNG を更新したら、このスクリプトを再実行して派生を更新すること。
 */

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'public', 'images');

// above-the-fold な主要画像（モバイル小サイズ variant が必要なもの）
// パスは IMG_DIR からの相対パス、forward-slash 統一
const NEEDS_SMALL_VARIANT = new Set([
  'hero/hero.jpg',
  'problems/asker.jpg',
  'problems/problem-01.jpg',
  'problems/problem-02.jpg',
  'risks/warner.jpg',
  'promises/partners.jpg',
]);

const SMALL_WIDTH = 800; // モバイル DPR 2 で 400px CSS 描画程度を想定
const WEBP_QUALITY = 82; // 視覚劣化が許容範囲、ファイルサイズ大幅削減
const SMALL_JPG_QUALITY = 85;

/**
 * 指定ディレクトリ以下を再帰的に走査して JPG/PNG パスを返す。
 */
async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * src のほうが dst より新しければ true。dst が存在しない場合も true。
 */
async function needsRebuild(srcPath, dstPath) {
  const srcStat = await fs.stat(srcPath);
  try {
    const dstStat = await fs.stat(dstPath);
    return dstStat.mtimeMs < srcStat.mtimeMs;
  } catch {
    return true;
  }
}

console.log('Optimizing images in public/images/ ...');

const files = await walk(IMG_DIR);
let webpCount = 0;
let smallCount = 0;

for (const file of files) {
  // 派生として生成した派生ファイル自体は処理対象外
  const baseName = path.basename(file);
  if (/-small\.(jpe?g|png)$/i.test(baseName)) continue;

  const rel = path.relative(IMG_DIR, file).replace(/\\/g, '/');
  const dir = path.dirname(file);
  const stem = path.basename(file, path.extname(file));

  // (1) WebP 派生
  const webpPath = path.join(dir, `${stem}.webp`);
  if (await needsRebuild(file, webpPath)) {
    await sharp(file).webp({ quality: WEBP_QUALITY }).toFile(webpPath);
    console.log(`  + ${path.relative(IMG_DIR, webpPath).replace(/\\/g, '/')}`);
    webpCount++;
  }

  // (2) -small variant（指定リストのみ）
  if (NEEDS_SMALL_VARIANT.has(rel)) {
    const smallJpgPath = path.join(dir, `${stem}-small.jpg`);
    const smallWebpPath = path.join(dir, `${stem}-small.webp`);

    const meta = await sharp(file).metadata();
    if (meta.width && meta.width > SMALL_WIDTH) {
      if (await needsRebuild(file, smallJpgPath)) {
        await sharp(file)
          .resize({ width: SMALL_WIDTH, withoutEnlargement: true })
          .jpeg({ quality: SMALL_JPG_QUALITY })
          .toFile(smallJpgPath);
        console.log(`  + ${path.relative(IMG_DIR, smallJpgPath).replace(/\\/g, '/')}`);
        smallCount++;
      }
      if (await needsRebuild(file, smallWebpPath)) {
        await sharp(file)
          .resize({ width: SMALL_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(smallWebpPath);
        console.log(`  + ${path.relative(IMG_DIR, smallWebpPath).replace(/\\/g, '/')}`);
        smallCount++;
      }
    }
  }
}

console.log(`Done. ${webpCount} WebP + ${smallCount} small variants generated.`);
