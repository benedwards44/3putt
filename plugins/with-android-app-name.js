const { withStringsXml, AndroidConfig } = require('expo/config-plugins');

/**
 * The project name must be "ThreePutt" (Swift module names can't start with a
 * digit), but the launcher should still show "3 Putt". iOS uses
 * CFBundleDisplayName from app.json; this plugin does the same for Android.
 */
module.exports = function withAndroidAppName(config) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name' }, _: '3 Putt' }],
      config.modResults
    );
    return config;
  });
};
