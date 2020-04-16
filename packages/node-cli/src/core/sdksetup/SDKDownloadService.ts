/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import fs from 'fs';
import path from 'path';
import request from 'request-promise-native';
import SDKProperties from './SDKProperties';
import { homedir } from 'os';
import { FOLDERS } from '../../ApplicationConstants';
import { NodeConsoleLogger } from '../../loggers/NodeConsoleLogger';
import { unwrapExceptionMessage } from '../../utils/ExceptionUtils';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import FileSystemService from '../../services/FileSystemService';
import { executeWithSpinner } from '../../ui/CliSpinner';
import {
	DOWNLOADING_SUITECLOUD_SDK,
	DOWNLOADING_SUITECLOUD_SDK_SUCCESS,
	DOWNLOADING_SUITECLOUD_SDK_ERROR,
	DOWNLOADING_SUITECLOUD_SDK_ERROR_FILE_NOT_AVAILABLE,
} from '../../services/TranslationKeys';

const HOME_PATH = homedir();
const VALID_JAR_CONTENT_TYPES = ['application/java-archive', 'application/x-java-archive', 'application/x-jar'];


export function download() {
	const sdkDirectory = new FileSystemService().createFolder(HOME_PATH, FOLDERS.SUITECLOUD_SDK);

	const fullURL = `${SDKProperties.getDownloadURL()}/${SDKProperties.getSDKFileName()}`;

	executeWithSpinner({
		action: downloadFile(fullURL, sdkDirectory),
		message: NodeTranslationService.getMessage(DOWNLOADING_SUITECLOUD_SDK, fullURL),
	})
	.then(() => NodeConsoleLogger.info(NodeTranslationService.getMessage(DOWNLOADING_SUITECLOUD_SDK_SUCCESS)))
	.catch(error =>
		NodeConsoleLogger.error(NodeTranslationService.getMessage(DOWNLOADING_SUITECLOUD_SDK_ERROR, fullURL, unwrapExceptionMessage(error)))
	);
}

function downloadFile(url: string, sdkDirectory: string) {
	const proxy = process.env.npm_config_https_proxy || process.env.npm_config_proxy;

	const isProxyRequired = proxy && !SDKProperties.configFileExists();

	const options = {
		method: 'GET',
		uri: url,
		encoding: 'binary',
		resolveWithFullResponse: true,
		...(isProxyRequired && { proxy: proxy }),
	};

	return request(options).then(function(response: { headers: { [x: string]: string }; body: any }) {
		if (!VALID_JAR_CONTENT_TYPES.includes(response.headers['content-type'])) {
			throw NodeTranslationService.getMessage(DOWNLOADING_SUITECLOUD_SDK_ERROR_FILE_NOT_AVAILABLE);
		}

		// remove all JAR files before writing response to file
		fs.readdirSync(sdkDirectory)
			.filter(file => /[.]jar$/.test(file))
			.map(file => fs.unlinkSync(path.join(sdkDirectory, file)));

		const sdkDestinationFile = path.join(sdkDirectory, SDKProperties.getSDKFileName());
		const file = fs.createWriteStream(sdkDestinationFile);
		file.write(response.body, 'binary');
		file.end();
	});
}
