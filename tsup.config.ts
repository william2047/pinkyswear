export default {
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  target: 'es2019',
  platform: 'neutral',
  outDir: 'dist',
  outExtension({ format }: { format: 'esm' | 'cjs' }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs'
    };
  }
};