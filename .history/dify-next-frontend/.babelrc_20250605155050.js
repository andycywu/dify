module.exports = {
  presets: ['next/babel'],
  plugins: [
    'babel-plugin-macros',
    [
      'styled-components',
      {
        ssr: true,
        displayName: true,
        preprocess: false
      }
    ]
  ]
};
