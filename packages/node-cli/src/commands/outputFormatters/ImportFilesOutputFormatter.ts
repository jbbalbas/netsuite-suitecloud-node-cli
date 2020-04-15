/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';

import { COMMAND_IMPORTFILES } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ActionResult } from '../actionresult/ActionResult';

type ImportFilesData = {
	results: {
		loaded?: boolean;
		path: string;
		message?: string
	}[];
};

export default class ImportFilesOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: ActionResult<ImportFilesData>) {
		if (Array.isArray(actionResult.data.results)) {
			const successful = actionResult.data.results.filter(result => result.loaded === true);
			const unsuccessful = actionResult.data.results.filter(result => result.loaded !== true);
			if (successful.length) {
				this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_IMPORTFILES.OUTPUT.FILES_IMPORTED));
				successful.forEach(result => {
					this.consoleLogger.result(result.path);
				});
			}
			if (unsuccessful.length) {
				this.consoleLogger.warning(NodeTranslationService.getMessage(COMMAND_IMPORTFILES.OUTPUT.FILES_NOT_IMPORTED));
				unsuccessful.forEach(result => {
					this.consoleLogger.warning(`${result.path}, ${result.message}`);
				});
			}
		}
	}
}
