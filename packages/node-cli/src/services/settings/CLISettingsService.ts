/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import FileSystemService from '../FileSystemService';
import * as FileUtils from '../../utils/FileUtils';
import CLISettings from './CLISettings';
import path from 'path';
import NodeTranslationService from '../NodeTranslationService';
import { ERRORS } from '../TranslationKeys';

import { homedir } from 'os';
import { FILES, FOLDERS } from '../../ApplicationConstants';

const HOME_PATH = homedir();

const CLI_SETTINGS_FILEPATH = path.join(
	HOME_PATH,
	FOLDERS.SUITECLOUD_SDK,
	FILES.CLI_SETTINGS
);

const CLI_SETTINGS_PROPERTIES_KEYS = ['proxyUrl', 'useProxy', 'isJavaVersionValid'];
const DEFAULT_CLI_SETTINGS = new CLISettings({
	useProxy: false,
	proxyUrl: '',
	isJavaVersionValid: false
});

let CACHED_CLI_SETTINGS: any;

export default class CLISettingsService {

	private saveSettings(cliSettings: any) {
		new FileSystemService().createFolder(HOME_PATH, FOLDERS.SUITECLOUD_SDK);
		FileUtils.create(CLI_SETTINGS_FILEPATH, cliSettings);
	}

	private getSettings() {
		if (CACHED_CLI_SETTINGS) {
			return CACHED_CLI_SETTINGS;
		}
		if (FileUtils.exists(CLI_SETTINGS_FILEPATH)) {
			try {
				const cliSettingsJson = FileUtils.readAsJson(CLI_SETTINGS_FILEPATH);
				this.validateCLISettingsProperties(cliSettingsJson);
				CACHED_CLI_SETTINGS = CLISettings.fromJson(cliSettingsJson);
				return CLISettings.fromJson(cliSettingsJson);
			} catch (error) {
				throw NodeTranslationService.getMessage(ERRORS.CLI_SETTINGS_FILE_CONTENT);
			}
		}
		CACHED_CLI_SETTINGS = DEFAULT_CLI_SETTINGS;
		return DEFAULT_CLI_SETTINGS;
	}

	public isJavaVersionValid() {
		return this.getSettings().isJavaVersionValid;
	}

	public setJavaVersionValid(value: boolean) {
		const newSettings = this.getSettings().toJSON();
		if (newSettings.isJavaVersionValid === value) {
			return;
		}
		newSettings.isJavaVersionValid = value;
		CACHED_CLI_SETTINGS = CLISettings.fromJson(newSettings);
		this.saveSettings(CACHED_CLI_SETTINGS);
	}

	public getProxyUrl() {
		return this.getSettings().proxyUrl;
	}

	public setProxyUrl(url: string) {
		const newSettings = this.getSettings().toJSON();
		if (newSettings.proxyUrl === url && newSettings.useProxy === true) {
			return;
		}
		newSettings.useProxy = true;
		newSettings.proxyUrl = url;
		CACHED_CLI_SETTINGS = CLISettings.fromJson(newSettings);
		this.saveSettings(CACHED_CLI_SETTINGS);
	}

	public useProxy() {
		return this.getSettings().useProxy;
	}

	public clearProxy() {
		const newSettings = this.getSettings().toJSON();
		if (newSettings.useProxy === false) {
			return;
		}
		newSettings.useProxy = false;
		newSettings.proxyUrl = '';

		CACHED_CLI_SETTINGS = CLISettings.fromJson(newSettings);
		this.saveSettings(CACHED_CLI_SETTINGS);
	}

	private validateCLISettingsProperties(CLISettingsJson: any) {
		CLI_SETTINGS_PROPERTIES_KEYS.forEach(propertyKey => {
			if (!CLISettingsJson.hasOwnProperty(propertyKey)) {
				throw Error(
					`Missing ${propertyKey} property in the ${CLI_SETTINGS_FILEPATH} file.`
				);
			}
		});
	}
};
