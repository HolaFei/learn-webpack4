module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-cssnext': {},
    'postcss-sorting': {
      'order': [
        'custom-properties',
        'dollar-variables',
        'declarations',
        'at-rules',
        'rules'
      ],
      'properties-order': 'alphabetical',
      'unspecified-properties-position': 'bottom'
    }
  }
}
