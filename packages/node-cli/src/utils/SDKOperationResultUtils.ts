/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { OperationResult } from '../../types/OperationResult';

export const STATUS = {
	SUCCESS: 'SUCCESS',
	ERROR: 'ERROR'
}

export function getResultMessage(operationResult: OperationResult) {
	const { resultMessage } = operationResult;
	return resultMessage ? resultMessage : '';
}

export function collectErrorMessages(operationResult: OperationResult) {
	const { errorMessages, resultMessage } = operationResult;
	if (Array.isArray(errorMessages)) {
		if (resultMessage) {
			errorMessages.unshift(resultMessage);
		}
		return errorMessages;
	} else {
		return [resultMessage];
	}
}
