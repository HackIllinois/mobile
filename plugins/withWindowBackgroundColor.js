const { withAppDelegate } = require("expo/config-plugins");

module.exports = function withWindowBackgroundColor(config, { color = "#2d0429" } = {}) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    // Convert hex color to UIColor RGB values
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;

    const colorLine = `    window?.backgroundColor = UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: 1.0)`;

    // Insert after window creation line
    contents = contents.replace(
      /window = UIWindow\(frame: UIScreen\.main\.bounds\)/,
      `window = UIWindow(frame: UIScreen.main.bounds)\n${colorLine}`
    );

    config.modResults.contents = contents;
    return config;
  });
};
