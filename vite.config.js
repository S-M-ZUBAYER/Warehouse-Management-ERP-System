// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const getProxyTarget = (value) => {
  try {
    return new URL(value).origin
  } catch {
    return 'https://grozziie.zjweiting.com:3091'
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tikTokChatTarget = getProxyTarget(
    env.VITE_TIKTOK_CHAT_API_BASE_URL ||
      'https://grozziie.zjweiting.com:3091/product-notification'
  )
  const orderPlatformTarget = getProxyTarget(
    env.VITE_ORDER_PLATFORM_BASE_URL || 'https://grozziie.zjweiting.com:3091'
  )

  return {
    plugins: [react()],
    base: '/warehouse_management',
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      proxy: {
        '/product-notification': {
          target: tikTokChatTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/tiktokshop-partner-country': {
          target: orderPlatformTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
