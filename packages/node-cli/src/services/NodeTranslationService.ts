/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import path from 'path';
import TranslationService from './TranslationService';
import { DEFAULT_MESSAGES_FILE } from '../ApplicationConstants';
import * as FileUtils from '../utils/FileUtils';

class NodeTranslationService extends TranslationService {
	constructor() {
		super();
		const filePath = path.join(__dirname, DEFAULT_MESSAGES_FILE);
		this.MESSAGES = FileUtils.readAsJson(filePath);
	}
}

const instance = new NodeTranslationService();

export { instance as NodeTranslationService };
