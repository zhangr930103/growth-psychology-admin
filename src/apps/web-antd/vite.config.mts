import { defineConfig } from '@vben/vite-config';

export default defineConfig(async (config) => {
  const { mode } = config;
  const isDev = mode === 'development';

  return {
    application: {},
    vite: {
      define: isDev
        ? {
            // 开发环境下，重写API地址为代理路径
            'import.meta.env.VITE_GLOB_API_URL': '"/api/v1"',
          }
        : {},
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, '/api'),
            // 代理到实际的API服务器
            target: 'https://tongchengzhang.com',
            ws: true,
          },
        },
      },
    },
  };
});
