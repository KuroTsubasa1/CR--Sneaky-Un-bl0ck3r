/* global chrome, window, document */
var browser = browser || chrome;

/**
 * Export function
 * @param {Object} global The Object that should receive the exported functions.
 */
((global) => {
	// Settings object with default settings
	let settings = { saveLogin: false, switchRegion: true };
	let validSettings = Object.keys(settings);

	/**
	 * Load saved settings
	 */
	browser.storage.local.get({ settings: null }, (item) => {
		if (item.settings !== null) {
			// Merge saved settings with default settings overwriting the default ones
			settings = Object.assign(settings, item.settings);
		} else {
			browser.storage.local.get({ saveLogin: null }, (saveLogin) => {
				// Migrate from old version
				if (saveLogin.saveLogin !== null) {
					settings.saveLogin = saveLogin.saveLogin;
					browser.storage.local.remove(['saveLogin']);
				}
				// Save default settings
				browser.storage.local.set({ settings: settings });
			});
		}
	});

	/**
	 * Saves settings validating keys and sending an update message
	 * @param  {Object} keys Object containing the settings to change
	 */
	function saveSettings(keys) {
		let changed = {};
		for (let key of Object.keys(keys)) {
			if (validSettings.indexOf(key) !== -1) {
				// Update settings object
				settings[key] = keys[key];
				changed[key] = keys[key];
			}
		}
		browser.runtime.sendMessage({ event: 'settingsChanged', changed: changed, settings: settings });
		browser.storage.local.set({ settings: settings });
	}

	/**
	 * Gets settings as copy
	 * @return {Object} Object containing settings
	 */
	function getSettings() {
		return Object.assign({}, settings);
	}

	if (!global.settings) {
		global.settings = {
			save: saveSettings,
			get: getSettings
		};
	}
})(this || {});

/**
 * Export object through messages
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === 'saveSettings') {
		this.settings.save(message.settings);
	} else if (message.action === 'getSettings') {
		sendResponse(this.settings.get());
	}
});
