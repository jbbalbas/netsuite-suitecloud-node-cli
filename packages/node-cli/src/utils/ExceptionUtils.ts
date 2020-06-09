/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { NodeTranslationService } from '../services/NodeTranslationService';
import CLIException from '../CLIException';
import { COMMAND_OPTIONS_VALIDATION_ERRORS_INTERACTIVE_SUGGESTION } from '../services/TranslationKeys';
import { formatErrors } from '../utils/ValidationErrorsFormatter';
import { InteractiveCommandInfo, NonInteractiveCommandInfo } from '../../types/Metadata';

export function unwrapExceptionMessage(exception: string | CLIException) {
	console.log(JSON.stringify(exception));
	return typeof exception === 'string' ? exception : exception.getErrorMessage();
}

export function unwrapInformationMessage(exception: string | CLIException) {
	return (typeof exception !== 'string' && exception.getInfoMessage) ? exception.getInfoMessage() : '';
}

export function throwValidationException(errorMessages: (string | boolean | undefined)[], runInInteractiveMode: boolean, commandMetadata: InteractiveCommandInfo | NonInteractiveCommandInfo) {
	const formattedError = formatErrors(errorMessages);
	if (!runInInteractiveMode && commandMetadata.supportsInteractiveMode) {
		const suggestedCommandMessage = NodeTranslationService.getMessage(COMMAND_OPTIONS_VALIDATION_ERRORS_INTERACTIVE_SUGGESTION, commandMetadata.name);
		throw new CLIException(-10, formattedError, suggestedCommandMessage);
	}

	throw new CLIException(-10, formattedError);
}