const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// --- Fix SVG handling ---
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...config.resolver,
  assetExts: [
    ...config.resolver.assetExts.filter(ext => ext !== "svg"),
    "PNG", // Add uppercase PNG extension
  ],
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

module.exports = config;