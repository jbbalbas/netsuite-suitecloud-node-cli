/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { lineBreak } from '../../loggers/LoggerConstants';
import { unwrapExceptionMessage, unwrapInformationMessage } from '../../utils/ExceptionUtils';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ActionResult } from '../actionresult/ActionResult';
import CLIException from '../../CLIException';

export default class OutputFormatter {

	protected consoleLogger: ConsoleLogger;

	constructor(consoleLogger: ConsoleLogger) {
		this.consoleLogger = consoleLogger;
	}

	public formatActionResult(actionResult: ActionResult<any>) {};

	public formatError(error: string | CLIException): string {
		let errorMessage = unwrapExceptionMessage(error);
		this.consoleLogger.error(errorMessage);
		const informativeMessage = unwrapInformationMessage(error);

		if (informativeMessage) {
			this.consoleLogger.info(`${lineBreak}${informativeMessage}`);
			errorMessage += lineBreak + informativeMessage;
		}
		return errorMessage;
	}
}