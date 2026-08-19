import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: resolve(
        __dirname,
        'tsconfig.json',
      ),
      outDirs: resolve(__dirname, 'dist'),
      entryRoot: resolve(__dirname, 'src'),
      include: ['src'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.spec.ts',
      ],
      cleanVueFileName: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'trigger/index': resolve(
          __dirname,
          'src/trigger/index.ts',
        ),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'dev-panel.[ext]',
      },
    },
    sourcemap: true,
    minify: false,
  },
});
