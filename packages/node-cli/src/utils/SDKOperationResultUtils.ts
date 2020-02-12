/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import OperationResultStatus from '../commands/OperationResultStatus';
import ActionResultUtils from './ActionResultUtils';
import * as NodeUtils from './NodeUtils';
import { OperationResult } from '../../types/OperationResult';

export const SUCCESS = 'SUCCESS';
export const ERROR = 'ERROR';

export function getErrorMessagesString(operationResult: OperationResult) {
	const { errorMessages, resultMessage } = operationResult;
	if (Array.isArray(errorMessages) && errorMessages.length > 0) {
		const errorMessages = ActionResultUtils.collectErrorMessages(operationResult);
		return errorMessages.join(NodeUtils.lineBreak);
		if (resultMessage) {
			errorMessages.unshift(resultMessage);
	}
	return errorMessages;
}
export function getResultMessage(operationResult: OperationResult) {
	const { resultMessage } = operationResult;
	return resultMessage ? resultMessage : '';
}
export function hasErrors(operationResult: OperationResult) {
	return operationResult.status === OperationResultStatus.ERROR;
}
export function logErrors(operationResult: OperationResult) {
	const { errorMessages } = operationResult;
	if (Array.isArray(errorMessages) && errorMessages.length > 0) {
		errorMessages.forEach(message => NodeUtils.println(message, NodeUtils.COLORS.ERROR));
	}
}
export function logResultMessage(operationResult: OperationResult) {
	const { resultMessage } = operationResult;
	if (resultMessage) {
		if (operationResult.status === OperationResultStatus.ERROR) {
			NodeUtils.println(resultMessage, NodeUtils.COLORS.ERROR);
		} else {
			NodeUtils.println(resultMessage, NodeUtils.COLORS.RESULT);
		}
	}
}
export function getErrorCode(operationResult: OperationResult) {
	const { errorCode } = operationResult;
	return errorCode ? errorCode : '';
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
