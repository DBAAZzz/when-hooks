import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  externals: ['vue', '@dcloudio/uni-app', '@when-hooks/core'],
  rollup: {
    emitCJS: false
  }
})
