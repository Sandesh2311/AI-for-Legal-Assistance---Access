import { build } from 'esbuild';

await build({
  bundle: true,
  entryPoints: ['server/vercel.ts'],
  external: ['@google/generative-ai', 'cors', 'express', 'zod'],
  format: 'esm',
  outfile: 'api/[...path].js',
  packages: 'external',
  platform: 'node',
  sourcemap: false,
  target: 'node20',
});