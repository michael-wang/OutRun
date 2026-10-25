import {defineConfig} from 'vite';

export default defineConfig({
  // Evidence videos are served for review but are not application source.
  // Windows can hold an encoder lock while Playwright finalizes these files.
  server: {watch: {ignored: ['**/docs/evidence/**', '**/test-results/**', '**/*.log']}},
});
