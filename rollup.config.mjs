import path from "path";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

module.exports = [
  {
    input: ['./src/index.ts'],
    output: {
      dir: './dist',
      format: 'esm',
    },
    external: [
      /test/
    ],
    plugins: [
      commonjs(),
      babel({
        babelHelpers: 'runtime',
        exclude: '**/node_modules/**',
      }),
      typescript({
        tsconfig: path.resolve(__dirname, "./tsconfig.json")
      }),
      terser(),
    ]
  }
]