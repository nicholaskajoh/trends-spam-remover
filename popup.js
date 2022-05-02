const sensitivitySelect = document.getElementById('tsr_sensitivity_select');
const enabledSelect = document.getElementById('tsr_enabled_select');
const debugSelect = document.getElementById('tsr_debug_select');

// Change setting input to current active option.
chrome.storage.sync.get('sensitivity', ({ sensitivity }) => {
  sensitivitySelect.value = sensitivity;
});
chrome.storage.sync.get('enabled', ({ enabled }) => {
  enabledSelect.value = enabled ? 'yes' : 'no';
});
chrome.storage.sync.get('debug', ({ debug }) => {
  debugSelect.value = debug ? 'yes' : 'no';
});

async function reloadTab() {
  const currentTab = await TsrUtils.getCurrentTab();
  if (TsrUtils.isSupportedUrl(currentTab.url)) {
    chrome.tabs.reload(currentTab.id);
  }
}

// When setting is changed, update sync storage and then refresh the current tab if site is supported.
sensitivitySelect.addEventListener('change', () => {
  const sensitivity = sensitivitySelect.options[sensitivitySelect.selectedIndex].value;
  chrome.storage.sync.set({ sensitivity });
  reloadTab();
});
enabledSelect.addEventListener('change', () => {
  const enabled = enabledSelect.options[enabledSelect.selectedIndex].value === 'yes';
  chrome.storage.sync.set({ enabled });
  reloadTab();
});
debugSelect.addEventListener('change', () => {
  const debug = debugSelect.options[debugSelect.selectedIndex].value === 'yes';
  chrome.storage.sync.set({ debug });
  reloadTab();
});
