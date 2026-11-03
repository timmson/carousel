import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages раздаёт проект из подпапки с именем репозитория,
 * поэтому base вычисляется автоматически при сборке в CI.
 * Локально можно переопределить через VITE_BASE.
 */
function resolveBase(): string {
  if (process.env.VITE_BASE) {
    return process.env.VITE_BASE;
  }
  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (repository) {
    return `/${repository}/`;
  }
  return '/carousel/';
}

export default defineConfig({
  plugins: [react()],
  base: resolveBase(),
  build: {
    target: 'es2022',
  },
});
