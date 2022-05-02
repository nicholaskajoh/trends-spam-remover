try {
  importScripts('/utils.js');
} catch (e) {
  console.error(e);
}

chrome.runtime.onInstalled.addListener(() => {
  TsrUtils.setOptions({
    enabled: true,
    // Set the default sensitivity for Trends Spam Remover.
    // Options: Standard, Aggressive.
    sensitivity: TsrConsts.DEFAULT_SENSITIVITY,
    debug: false,
  });
});
