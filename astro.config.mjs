// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 有限会社 K Laboratory コーポレートサイト (https://1klab.com)
// 静的ホスティング (CoreServer) 向けに、ディレクトリ形式 + 末尾スラッシュで出力する。
export default defineConfig({
  site: 'https://1klab.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      // SEO 上の優先度・更新頻度のヒント (Google は参考程度にしか見ないが付与しておく)
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date(),
      // フォーム送信完了ページは noindex 対象なので sitemap からも除外
      filter: (page) => !page.includes('/contact/thanks/'),
    }),
  ],
});
