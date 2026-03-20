import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/components/atoms/button.tsx'),
      formats: ['es'],
      // Note: Using ES format only. For dual format (ES + CJS),
      // change formats to ['es', 'cjs'] and use: `${entryName}.${format}.js`
      fileName: (_format: string, entryName: string) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        /^@base-ui\/react/,
        'class-variance-authority',
        'tailwind-merge',
        'clsx',
        'tailwindcss',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
