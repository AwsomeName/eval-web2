import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: ['tty.woniucoder.cn', 'mt.tty.woniucoder.cn'],
    proxy: {
      '/api': {
        // 使用process.env而不是import.meta.env
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  // 添加以下配置处理 CommonJS 模块
  optimizeDeps: {
    include: ['react-syntax-highlighter']
  }
})
