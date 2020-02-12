/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import path from 'path';
import fs from 'fs';
import { SDK_FILENAME } from '../../ApplicationConstants';
const ROOT_DIRECTORY = path.dirname(require.main ? require.main.filename : '.');
const CONFIG_FILE = './config.json';
const PACKAGE_FILE = `${ROOT_DIRECTORY}/../package.json`;

let CONFIG_FILE_CACHE: any = null;

class SDKProperties {
	constructor() {
		this.loadCache();
	}

	public getDownloadURL() {
		// read config.js file if exists or use package.json
		const configFile = this.configFileExists() ? CONFIG_FILE_CACHE : require(PACKAGE_FILE);
		return configFile.sdkDownloadUrl;
	}

	public getSDKFileName() {
		return this.configFileExists() ? CONFIG_FILE_CACHE.sdkFilename : SDK_FILENAME;
	}

	public configFileExists() {
		return CONFIG_FILE_CACHE !== null;
	}

	private loadCache() {
		if (fs.existsSync(path.resolve(__dirname, CONFIG_FILE))) {
			CONFIG_FILE_CACHE = require(CONFIG_FILE);
		}
	}
}

export default new SDKProperties();