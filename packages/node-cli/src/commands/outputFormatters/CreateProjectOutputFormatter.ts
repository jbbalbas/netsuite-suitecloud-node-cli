/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';

import * as ActionResultUtils from '../../utils/ActionResultUtils';
import { COMMAND_CREATEPROJECT } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { CreateProjectActionResult } from '../actionresult/CreateProjectActionResult';

export default class CreateProjectOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	formatActionResult(actionResult: CreateProjectActionResult) {
		ActionResultUtils.logResultMessage(actionResult, this.consoleLogger);

		const projectCreatedMessage = NodeTranslationService.getMessage(COMMAND_CREATEPROJECT.MESSAGES.PROJECT_CREATED, actionResult.projectName);
		this.consoleLogger.result(projectCreatedMessage);

		if (actionResult.includeUnitTesting) {
			const sampleUnitTestMessage = NodeTranslationService.getMessage(COMMAND_CREATEPROJECT.MESSAGES.SAMPLE_UNIT_TEST_ADDED);
			this.consoleLogger.result(sampleUnitTestMessage);
			if (!actionResult.npmInstallSuccess) {
				this.consoleLogger.error(NodeTranslationService.getMessage(COMMAND_CREATEPROJECT.MESSAGES.INIT_NPM_DEPENDENCIES_FAILED));
			}
		}

		const navigateToProjectMessage = NodeTranslationService.getMessage(COMMAND_CREATEPROJECT.MESSAGES.NAVIGATE_TO_FOLDER, actionResult.projectDirectory);
		this.consoleLogger.result(navigateToProjectMessage);
	}
}
