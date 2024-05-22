import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/client', 'src/react'],
  treeshake: true,
  sourcemap: 'inline',
  minify: true,
  clean: true,
  dts: true,
  splitting: false,
  format: ['cjs', 'esm'],
  external: ['react', '@opentelemetry/api'],
  injectStyle: false,
});
