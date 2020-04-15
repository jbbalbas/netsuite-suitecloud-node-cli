/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import NodeTranslationService from '../services/NodeTranslationService';
import { ANSWERS_VALIDATION_MESSAGES, COMMAND_OPTION_IS_MANDATORY } from '../services/TranslationKeys';
import url from 'url';

import * as ApplicationConstants from '../ApplicationConstants';

const VALIDATION_RESULT_FAILURE = (validationError: string) => ({
	result: false,
	validationMessage: validationError,
});
const VALIDATION_RESULT_SUCCESS = { result: true };

const { ANSWERS_VALIDATION_MESSAGES, COMMAND_OPTION_IS_MANDATORY } = require('../services/TranslationKeys');

const ALPHANUMERIC_LOWERCASE_REGEX = '[a-z0-9]+';
const ALPHANUMERIC_LOWERCASE_WHOLE_REGEX = `^${ALPHANUMERIC_LOWERCASE_REGEX}$`;
const ALPHANUMERIC_HYPHEN_UNDERSCORE = /^[a-zA-Z0-9-_]+$/;
const SCRIPT_ID_REGEX = /^[a-z0-9_]+$/;
const STRING_WITH_SPACES_REGEX = /\s/;
const XML_FORBIDDEN_CHARACTERS_REGEX = /[<>&'"]/;
const INVALID_CHARACTERS_IN_PATH = /[<>:"/\\|?*]/;

const PROJECT_VERSION_FORMAT_REGEX = '^\\d+(\\.\\d+){2}$';
const SUITEAPP_ID_FORMAT_REGEX = '^' + ALPHANUMERIC_LOWERCASE_REGEX + '(\\.' + ALPHANUMERIC_LOWERCASE_REGEX + '){2}$';
const SUITEAPP_PUBLISHER_ID_FORMAT_REGEX = '^' + ALPHANUMERIC_LOWERCASE_REGEX + '\\.' + ALPHANUMERIC_LOWERCASE_REGEX + '$';


export function showValidationResults(value: string, ...funcs: ((x: any) => { result: boolean; validationMessage?: string })[]) {
	for (const func of funcs) {
		const validationOutput = func(value);
		if (!validationOutput.result) {
			return validationOutput.validationMessage;
		}
	}
	return true;
}

export function validateFieldIsNotEmpty(fieldValue: string) {
	return fieldValue !== ''
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.EMPTY_FIELD));
}

export function validateFieldHasNoSpaces(fieldValue: string) {
	return !STRING_WITH_SPACES_REGEX.test(fieldValue)
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.FIELD_HAS_SPACES));
}

export function validateFieldIsLowerCase(fieldOptionId: string, fieldValue: string) {
	return fieldValue.match(ALPHANUMERIC_LOWERCASE_WHOLE_REGEX)
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.FIELD_NOT_LOWER_CASE, fieldOptionId));
}

export function validatePublisherId(fieldValue: string) {
	return fieldValue.match(SUITEAPP_PUBLISHER_ID_FORMAT_REGEX)
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.PUBLISHER_ID_FORMAT));
}

export function validateProjectVersion(fieldValue: string) {
	return fieldValue.match(PROJECT_VERSION_FORMAT_REGEX)
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.PROJECT_VERSION_FORMAT));
}

export function validateArrayIsNotEmpty(array: any[]) {
	return array.length > 0
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.CHOOSE_OPTION));
}

export function validateSuiteApp(fieldValue: string) {
	let notEmpty =
		fieldValue !== ''
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.EMPTY_FIELD));

	if (notEmpty.result != true) {
		return notEmpty;
	} else if (!fieldValue.match(SUITEAPP_ID_FORMAT_REGEX)) {
		return VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.APP_ID_FORMAT));
	}
	return VALIDATION_RESULT_SUCCESS;
}

export function validateScriptId(fieldValue: string) {
	let notEmpty =
		fieldValue !== ''
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.EMPTY_FIELD));

	if (notEmpty.result !== true) {
		return notEmpty;
	} else if (!fieldValue.match(SUITEAPP_ID_FORMAT_REGEX)) {
		return VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.APP_ID_FORMAT));
	}
	return VALIDATION_RESULT_SUCCESS;
}

export function validateXMLCharacters(fieldValue: string) {
	return !XML_FORBIDDEN_CHARACTERS_REGEX.test(fieldValue)
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.FIELD_HAS_XML_FORBIDDEN_CHARACTERS));
}

export function validateNotUndefined(value: string, optionName: string) {
	return value !== undefined
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(TranslationService.getMessage(COMMAND_OPTION_IS_MANDATORY, optionName));
}

export 	function validateProjectType(value: string) {
	return [ApplicationConstants.PROJECT_SUITEAPP, ApplicationConstants.PROJECT_ACP].includes(value)
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.WRONG_PROJECT_TYPE));
}

export function validateAuthIDNotInList(newAuhtID: string, authIDs: string[]) {
	return !authIDs.includes(newAuhtID)
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.AUTH_ID_ALREADY_USED));
}

export function validateAlphanumericHyphenUnderscore(fieldValue: string) {
	return ALPHANUMERIC_HYPHEN_UNDERSCORE.test(fieldValue)
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.ALPHANUMERIC_HYPEN_UNDERSCORE));
}

export function validateMaximumLength(fieldValue: string, maxLength = 40) {
	return fieldValue.length <= maxLength
		? VALIDATION_RESULT_SUCCESS
		: VALIDATION_RESULT_FAILURE(NodeTranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.MAX_LENGTH, maxLength.toString()));
}
