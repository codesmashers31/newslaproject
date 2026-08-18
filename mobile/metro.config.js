const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude android and ios build/temp output directories under node_modules from being watched by Metro.
// This prevents file-watcher (watchman/fallback) crashes when running native gradle builds
// without blocking imports of legitimate javascript platform files (e.g. android.js).
if (config.resolver && config.resolver.blockList) {
  config.resolver.blockList.push(
    /[\\/]node_modules[\\/].*[\\/](android|ios)[\\/](build|tmp|intermediates|outputs|\.gradle)/
  );
}

module.exports = withNativeWind(config, { 
  input: "./src/global.css",
  configPath: path.resolve(__dirname, "tailwind.config.js")
});

