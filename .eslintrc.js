module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
    ecmaFeatures: {
      globalReturn: true,
      impliedStrict: true
    }
  },
  env: {
    browser: true,
    node: true,
    commonjs: true,
    jquery: true
  },
  extends: 'standard',
  plugins: [],
  globals: {}
}
