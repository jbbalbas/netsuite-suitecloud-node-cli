/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

'use strict';

import path from 'path';
import fs from 'fs';

// normally this is called only when localserver command is executed
import FileSystem from '@oracle/suitecloud-cli-localserver-command/src/services/FileSystem';
FileSystem.start(require('../../src/services/FileSystemService'));

export const ROOT = './__test__/local';
export const CUSTOM_ASSETS_PATH = path.resolve(ROOT, 'custom_assets');
export const SERVERPATH = path.resolve(ROOT, 'localserver');

export function createLocalserverFolder() {
	if (!fs.existsSync(SERVERPATH)) {
		fs.mkdirSync(SERVERPATH, { recursive: true });
	}
};
export function removeFolder(folder = '') {
	(function deleteFolderRecursive(dir) {
		if (fs.existsSync(dir)) {
			fs.readdirSync(dir).forEach(file => {
				let currentPath = path.join(dir, file);
				if (fs.lstatSync(currentPath).isDirectory()) {
					// recurse
					deleteFolderRecursive(currentPath);
				} else {
					// delete file
					fs.unlinkSync(currentPath);
				}
			});
			fs.rmdirSync(dir);
		}
	})(path.join(SERVERPATH, folder));
	if (fs.existsSync(SERVERPATH) && fs.readdirSync(SERVERPATH).length === 0){
		fs.rmdirSync(SERVERPATH);
	}
};
export function mockClearConsoleLog() {
	console.log = jest.fn();
	//console.log.mockClear();
};