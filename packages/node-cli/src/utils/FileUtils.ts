/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import fs from 'fs';
import NodeTranslationService from '../services/NodeTranslationService';
import { ERRORS } from '../services/TranslationKeys';
const UTF8 = 'utf8';

export function create(fileName: string, object: any) {
	const content = JSON.stringify(object);

	// TODO callback function doesn't exist: https://nodejs.org/api/fs.html#fs_fs_writefilesync_file_data_options
	fs.writeFileSync(fileName, content, UTF8/*, function(error: any) {
			if (error) {
				throw NodeTranslationService.getMessage(ERRORS.WRITING_FILE, fileName, JSON.stringify(error));
			}
		}*/);
}

export function readAsJson(filePath: string) {
	const content = fs.readFileSync(filePath, UTF8);
	return JSON.parse(content);
}

export function readAsString(fileName: string) {
	return fs.readFileSync(fileName, UTF8);
}

export function exists(fileName: string) {
	return fs.existsSync(fileName);
}