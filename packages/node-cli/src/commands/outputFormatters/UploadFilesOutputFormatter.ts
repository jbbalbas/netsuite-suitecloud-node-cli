/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import FileCabinetService from '../../services/FileCabinetService';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import { FOLDERS } from '../../ApplicationConstants';
import path from 'path';

import { COMMAND_UPLOADFILES } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ActionResult } from '../actionresult/ActionResult';

const UPLOAD_FILE_RESULT_STATUS = {
	SUCCESS: 'SUCCESS',
	ERROR: 'ERROR',
};

type UploadFilesData = {
	type: string;
	file: {
		path: string;
	};
	errorMessage: string;
}[]

export default class UploadFilesOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: ActionResult<UploadFilesData>) {
		const { data } = actionResult;

		if (Array.isArray(data)) {
			const successfulUploads = data.filter(result => result.type === UPLOAD_FILE_RESULT_STATUS.SUCCESS);
			const unsuccessfulUploads = data.filter(result => result.type === UPLOAD_FILE_RESULT_STATUS.ERROR);
			const localFileCabinetFolder = path.join(actionResult.projectFolder, FOLDERS.FILE_CABINET);
			let fileCabinetService = new FileCabinetService(localFileCabinetFolder);
			if (successfulUploads && successfulUploads.length) {
				this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_UPLOADFILES.OUTPUT.FILES_UPLOADED));
				successfulUploads.forEach(result => {
					this.consoleLogger.result(fileCabinetService.getFileCabinetRelativePath(result.file.path));
				});
			}
			if (unsuccessfulUploads && unsuccessfulUploads.length) {
				this.consoleLogger.warning(NodeTranslationService.getMessage(COMMAND_UPLOADFILES.OUTPUT.FILES_NOT_UPLOADED));
				unsuccessfulUploads.forEach(result => {
					this.consoleLogger.warning(`${fileCabinetService.getFileCabinetRelativePath(result.file.path)}: ${result.errorMessage}`);
				});
			}
		}
	}
}
