module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-cssnext': {
      features: {
        rem: false
      }
    },
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
