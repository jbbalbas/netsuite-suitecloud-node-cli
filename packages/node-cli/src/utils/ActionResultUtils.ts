/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { STATUS, ActionResult } from '../commands/actionresult/ActionResult';
import { lineBreak } from '../loggers/LoggerConstants';
import ConsoleLogger from '../loggers/ConsoleLogger';

export function getErrorMessagesString(actionResult: ActionResult<any>) {
	return actionResult.errorMessages.join(lineBreak);
}

export function logResultMessage(actionResult: ActionResult<any>, consoleLogger: ConsoleLogger) {
	if (actionResult.resultMessage) {
		if (actionResult.status === STATUS.ERROR) {
			consoleLogger.error(actionResult.resultMessage);
		} else {
			consoleLogger.result(actionResult.resultMessage);
		}
	}
}
