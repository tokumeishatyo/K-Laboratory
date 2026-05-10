// @ts-check
import { defineConfig } from 'astro/config';

// 有限会社 K Laboratory コーポレートサイト (https://1klab.com)
// 静的ホスティング (CoreServer) 向けに、ディレクトリ形式 + 末尾スラッシュで出力する。
export default defineConfig({
  site: 'https://1klab.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [],
});
