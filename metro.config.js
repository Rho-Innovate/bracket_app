const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Node.js polyfills for React Native
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer/'),
  process: require.resolve('process/browser'),
};

module.exports = config;
