const TsrConsts = {
  SUPPORTED_URLS: ['https://twitter.com/search'],
  DEFAULT_SENSITIVITY: 'standard',
  // Number of trends in tweet before we classify it as spam.
  SENSITIVITY_THRESHOLDS: {
    standard: 3,
    aggressive: 2,
  },
};

const TsrUtils = {
  getCurrentTab() {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          return resolve(tabs[0]);
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  isSupportedUrl(url) {
    return TsrConsts.SUPPORTED_URLS.some(supportedUrl => {
      return url.startsWith(supportedUrl);
    });
  },

  /**
   * Wait for x seconds.
   */
  sleep(seconds) {
    return new Promise(resolve => {
      return setTimeout(resolve, seconds * 1000);
    });
  },

  /**
   * Generate random string of specified length.
   */
  generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  /**
   * Store extension setting using Chrome Sync.
   */
  async setOptions(data) {
    new Promise((resolve, reject) =>
      chrome.storage.sync.set(data, () =>
        chrome.runtime.lastError
          ? reject(Error(chrome.runtime.lastError.message))
          : resolve()
      )
    );
  },

  /**
   * Get extension setting from Chrome Sync.
   */
  async getOption(key) {
    return new Promise((resolve, reject) =>
      chrome.storage.sync.get(key, result =>
        chrome.runtime.lastError
          ? reject(Error(chrome.runtime.lastError.message))
          : resolve(result[key])
      )
    );
  },
};
