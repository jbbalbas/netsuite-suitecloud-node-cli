/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import * as ActionResultUtils from '../../utils/ActionResultUtils';

import { PROJECT_SUITEAPP, SDK_TRUE } from '../../ApplicationConstants';

import { COMMAND_DEPLOY } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { DeployActionResult } from '../actionresult/DeployActionResult';

export default class DeployOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: DeployActionResult) {
		this.showApplyContentProtectionOptionMessage(
			actionResult.projectType,
			actionResult.appliedContentProtection,
			actionResult.projectFolder
		);

		if (actionResult.isServerValidation) {
			this.consoleLogger.info(NodeTranslationService.getMessage(COMMAND_DEPLOY.MESSAGES.LOCALLY_VALIDATED, actionResult.projectFolder));
		}
		if (actionResult.resultMessage) {
			ActionResultUtils.logResultMessage(actionResult, this.consoleLogger);
		}
		if (Array.isArray(actionResult.data)) {
			actionResult.data.forEach(message => this.consoleLogger.result(message));
		}
	}

	private showApplyContentProtectionOptionMessage(projectType: string, isApplyContentProtection: string, projectFolder: string) {
		if (projectType === PROJECT_SUITEAPP) {
			if (isApplyContentProtection === SDK_TRUE) {
				this.consoleLogger.info(NodeTranslationService.getMessage(COMMAND_DEPLOY.MESSAGES.APPLYING_CONTENT_PROTECTION, projectFolder));
			} else {
				this.consoleLogger.info(NodeTranslationService.getMessage(COMMAND_DEPLOY.MESSAGES.NOT_APPLYING_CONTENT_PROTECTION, projectFolder));
			}
		}
	}
}
