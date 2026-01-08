const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// React Query v5 호환성을 위한 설정
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// 모듈 해석 unstable_enablePackageExports
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
