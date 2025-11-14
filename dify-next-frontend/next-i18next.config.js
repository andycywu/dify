const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    localeDetection: false,
  },
  localePath: path.resolve('./locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
