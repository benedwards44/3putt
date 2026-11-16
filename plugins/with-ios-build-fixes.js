const fs = require('fs');
const path = require('path');
const { withAppDelegate, withDangerousMod, withInfoPlist, withPodfileProperties } = require('expo/config-plugins');

const MARKER = '# [with-ios-build-fixes]';

/**
 * iOS build fixes for Expo SDK 57 + Xcode 27:
 *
 * 1. Build Expo modules from source instead of using the precompiled frameworks.
 *    The precompiled ExpoModulesWorklets links against @rpath/React.framework,
 *    which isn't embedded in the app, so the app crashes at launch with
 *    "Library not loaded: @rpath/React.framework/React".
 *
 * 2. Some pods (e.g. AsyncStorage's resource bundle) still declare iOS 13.4,
 *    which current Xcode rejects as an error ("supported range is 15.0 to …").
 *    Raise any pod target below the app's deployment target up to it.
 *
 * 3. Adopt the UIScene life cycle. iOS 27 kills apps built with the iOS 27 SDK
 *    that don't (crash in _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption).
 *    Expo >= 57.0.33 ships ExpoAppSceneDelegate for this, but the SDK 57 template
 *    doesn't wire it up: declare the scene in Info.plist, and make AppDelegate an
 *    ExpoReactNativeFactoryProvider that leaves window creation to the scene delegate.
 */
module.exports = function withIosBuildFixes(config) {
  config = withPodfileProperties(config, (config) => {
    config.modResults.EXPO_USE_PRECOMPILED_MODULES = 'false';
    return config;
  });
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return config;
  });
  config = withAppDelegate(config, (config) => {
    let src = config.modResults.contents;
    if (src.includes('ExpoReactNativeFactoryProvider')) return config;
    const classDecl = 'class AppDelegate: ExpoAppDelegate {';
    const windowBlock = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;
    if (!src.includes(classDecl) || !windowBlock.test(src)) {
      throw new Error('with-ios-build-fixes: AppDelegate.swift no longer matches the expected template');
    }
    src = src.replace(classDecl, 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    // ExpoAppSceneDelegate creates the window and starts React Native into it.
    src = src.replace(windowBlock, '\n');
    config.modResults.contents = src;
    return config;
  });
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');
      if (podfile.includes(MARKER)) return config;

      const snippet = `
    ${MARKER}
    min_ios = Gem::Version.new(podfile_properties['ios.deploymentTarget'] || '16.4')
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current) < min_ios
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_ios.to_s
        end
      end
    end
`;
      const anchor = /(post_install do \|installer\|\n\s*react_native_post_install\([\s\S]*?\n\s*\)\n)/;
      if (!anchor.test(podfile)) {
        throw new Error('with-ios-build-fixes: could not find post_install hook in Podfile');
      }
      podfile = podfile.replace(anchor, `$1${snippet}`);
      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
