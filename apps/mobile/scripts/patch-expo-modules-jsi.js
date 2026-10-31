const fs = require('fs');
const path = require('path');

const buildScript = path.resolve(
  __dirname,
  '../../../node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh'
);

if (!fs.existsSync(buildScript)) {
  console.log('[lockstep] expo-modules-jsi is not installed; skipping iOS cache patch.');
  process.exit(0);
}

const original = 'DERIVED_DATA_PATH="${PACKAGE_DIR}/.DerivedData"';
const replacement =
  'DERIVED_DATA_PATH="${TMPDIR:-/tmp}/lockstep-expo-modules-jsi-${UID}/DerivedData"';
const contents = fs.readFileSync(buildScript, 'utf8');

if (contents.includes(replacement)) {
  process.exit(0);
}

if (!contents.includes(original)) {
  throw new Error('ExpoModulesJSI build script changed; update the Lockstep cache patch.');
}

fs.writeFileSync(buildScript, contents.replace(original, replacement));
console.log('[lockstep] Moved ExpoModulesJSI build cache out of the file-provider folder.');
