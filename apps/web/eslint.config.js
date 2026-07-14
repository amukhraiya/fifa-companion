const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('../../packages/config/eslint.base.js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...compat.extends('next/core-web-vitals'),
  ...baseConfig,
];
