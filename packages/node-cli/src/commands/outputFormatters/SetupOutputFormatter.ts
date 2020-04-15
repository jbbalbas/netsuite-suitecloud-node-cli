/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';

import { COMMAND_SETUPACCOUNT } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { SetupActionResult } from '../actionresult/SetupActionResult';

const AUTH_MODE = {
	OAUTH: 'OAUTH',
	SAVE_TOKEN: 'SAVE_TOKEN',
	REUSE: 'REUSE',
};

export default class SetupOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: SetupActionResult) {
		let resultMessage = '';
		switch (actionResult.mode) {
			case AUTH_MODE.OAUTH:
				resultMessage = NodeTranslationService.getMessage(
					COMMAND_SETUPACCOUNT.OUTPUT.NEW_OAUTH,
					actionResult.accountInfo.companyName,
					actionResult.accountInfo.roleName,
					actionResult.authId
				);
				break;
			case AUTH_MODE.SAVE_TOKEN:
				resultMessage = NodeTranslationService.getMessage(
					COMMAND_SETUPACCOUNT.OUTPUT.NEW_SAVED_TOKEN,
					actionResult.accountInfo.companyName,
					actionResult.accountInfo.roleName,
					actionResult.authId
				);
				break;
			case AUTH_MODE.REUSE:
				resultMessage = NodeTranslationService.getMessage(
					COMMAND_SETUPACCOUNT.OUTPUT.REUSED_AUTH_ID,
					actionResult.authId,
					actionResult.accountInfo.companyName,
					actionResult.accountInfo.roleName
				);
				break;
			default:
				break;
		}

		this.consoleLogger.result(resultMessage);
		this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.OUTPUT.SUCCESSFUL));
	}
}