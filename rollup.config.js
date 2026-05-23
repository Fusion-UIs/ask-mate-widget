import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import postcss from 'rollup-plugin-postcss'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
  input: 'src/index.ts',

  output: [
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],

  plugins: [
    peerDepsExternal(),

    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),

    commonjs(),

    typescript({
      tsconfig: './tsconfig.json',
    }),

    postcss({
      extract: 'index.css',
      minimize: true,

      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    }),
  ],

  external: ['react', 'react-dom'],
}