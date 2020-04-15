/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import * as ActionResultUtils from '../../utils/ActionResultUtils';

import { PROJECT_SUITEAPP } from '../../ApplicationConstants';
import { COMMAND_VALIDATE } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ValidateActionResult } from '../actionresult/ValidateActionResult';

export default class ValidateOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: ValidateActionResult) {
		if (actionResult.isServerValidation && Array.isArray(actionResult.data)) {
			actionResult.data.forEach((resultLine) => {
				this.consoleLogger.result(resultLine);
			});
		} else if (!actionResult.isServerValidation) {
			this.showApplyContentProtectionOptionMessage(actionResult.appliedContentProtection, actionResult.projectType, actionResult.projectFolder);
			this.showLocalValidationResultData(actionResult.data);
		}
		ActionResultUtils.logResultMessage(actionResult, this.consoleLogger);
	}

	private showApplyContentProtectionOptionMessage(isAppliedContentProtection: boolean, projectType: string, projectFolder: string) {
		if (projectType === PROJECT_SUITEAPP) {
			if (isAppliedContentProtection) {
				this.consoleLogger.info(NodeTranslationService.getMessage(COMMAND_VALIDATE.MESSAGES.APPLYING_CONTENT_PROTECTION, projectFolder));
			} else {
				this.consoleLogger.info(NodeTranslationService.getMessage(COMMAND_VALIDATE.MESSAGES.NOT_APPLYING_CONTENT_PROTECTION, projectFolder));
			}
		}
	}

	private showLocalValidationResultData(data: {
		warnings: { filePath: string; lineNumber: string; message: string }[];
		errors: { filePath: string; lineNumber: string; message: string }[];
	}) {
		this.logValidationEntries(
			data.warnings,
			NodeTranslationService.getMessage(COMMAND_VALIDATE.OUTPUT.HEADING_LABEL_WARNING),
			this.consoleLogger.warning
		);
		this.logValidationEntries(
			data.errors,
			NodeTranslationService.getMessage(COMMAND_VALIDATE.OUTPUT.HEADING_LABEL_ERROR),
			this.consoleLogger.error
		);
	}

	private logValidationEntries(
		entries: { filePath: string; lineNumber: string; message: string }[],
		headingLabel: string,
		log: (...x: string[]) => void
	) {
		const files: string[] = [];
		entries.forEach((entry) => {
			if (!files.includes(entry.filePath)) {
				files.push(entry.filePath);
			}
		});

		if (entries.length > 0) {
			log(`${headingLabel}:`);
		}

		files.forEach((file) => {
			const fileString = `    ${file}`;
			log(fileString);
			entries
				.filter((entry) => entry.filePath === file)
				.forEach((entry) => {
					log(NodeTranslationService.getMessage(COMMAND_VALIDATE.OUTPUT.VALIDATION_OUTPUT_MESSAGE, entry.lineNumber, entry.message));
				});
		});
	}
}
