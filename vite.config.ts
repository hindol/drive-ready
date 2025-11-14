import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGitHubPages = Boolean(process.env.GITHUB_PAGES)
const repoName = 'drive-ready'

// https://vite.dev/config/
export default defineConfig({
  base: isGitHubPages ? `/${repoName}/` : '/',
  plugins: [react()],
})
