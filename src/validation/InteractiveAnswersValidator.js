/*
 ** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const NodeUtils = require('../utils/NodeUtils');
const TranslationService = require('../services/TranslationService');
const {
	ANSWERS_VALIDATION_MESSAGES,
	COMMAND_OPTION_IS_MANDATORY,
} = require('../services/TranslationKeys');
const url = require('url');

const ApplicationConstants = require('../ApplicationConstants');

const VALIDATION_RESULT_FAILURE = validationError => ({
	result: false,
	validationMessage: validationError,
});
const VALIDATION_RESULT_SUCCESS = { result: true };

NodeUtils.formatString(TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.EMPTY_FIELD), {
	color: NodeUtils.COLORS.ERROR,
	bold: true,
});

const ALPHANUMERIC_LOWERCASE_REGEX = '[a-z0-9]+';
const ALPHANUMERIC_LOWERCASE_WHOLE_REGEX = `^${ALPHANUMERIC_LOWERCASE_REGEX}$`;
const SCRIPT_ID_REGEX = /^[a-z0-9_]+$/;
const STRING_WITH_SPACES_REGEX = /\s/;
const XML_FORBIDDEN_CHARACTERS_REGEX = /[<>&'"]/;

const PROJECT_VERSION_FORMAT_REGEX = '^\\d+(\\.\\d+){2}$';
const SUITEAPP_ID_FORMAT_REGEX =
	'^' + ALPHANUMERIC_LOWERCASE_REGEX + '(\\.' + ALPHANUMERIC_LOWERCASE_REGEX + '){2}$';
const SUITEAPP_PUBLISHER_ID_FORMAT_REGEX =
	'^' + ALPHANUMERIC_LOWERCASE_REGEX + '\\.' + ALPHANUMERIC_LOWERCASE_REGEX + '$';
const EMAIL_REGEX = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

const SUBDOMAIN_DOMAIN_URL_REGEX = /[\w\d].*\.[\w\d].*\.[\w\d].*/;
const PRODUCTION_ACCOUNT_URL_REGEX = /^system(\.[\w-]+)?.netsuite.com$|^([\w-]+\.)app\.netsuite\.com$/i;

class InteractiveAnswersValidator {
	showValidationResults(value, ...funcs) {
		for (const func of funcs) {
			const validationOutput = func(value);
			if (!validationOutput.result) {
				return validationOutput.validationMessage;
			}
		}
		return true;
	}

	validateFieldIsNotEmpty(fieldValue) {
		return fieldValue !== ''
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.EMPTY_FIELD)
			  );
	}

	validateFieldHasNoSpaces(fieldValue) {
		return !STRING_WITH_SPACES_REGEX.test(fieldValue)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.FIELD_HAS_SPACES)
			  );
	}

	validateFieldIsLowerCase(fieldOptionId, fieldValue) {
		return fieldValue.match(ALPHANUMERIC_LOWERCASE_WHOLE_REGEX)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.FIELD_NOT_LOWER_CASE, fieldOptionId)
			  );
	}

	validatePublisherId(fieldValue) {
		return fieldValue.match(SUITEAPP_PUBLISHER_ID_FORMAT_REGEX)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.PUBLISHER_ID_FORMAT)
			  );
	}

	validateProjectVersion(fieldValue) {
		return fieldValue.match(PROJECT_VERSION_FORMAT_REGEX)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(
						ANSWERS_VALIDATION_MESSAGES.PROJECT_VERSION_FORMAT
					)
			  );
	}

	validateArrayIsNotEmpty(array) {
		return array.length > 0
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.CHOOSE_OPTION)
			  );
	}

	validateSuiteApp(fieldValue) {
		let notEmpty =
			fieldValue !== ''
				? VALIDATION_RESULT_SUCCESS
				: VALIDATION_RESULT_FAILURE(
						TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.EMPTY_FIELD)
				  );

		if (notEmpty.result != true) {
			return notEmpty;
		} else if (!fieldValue.match(SUITEAPP_ID_FORMAT_REGEX)) {
			return VALIDATION_RESULT_FAILURE(
				TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.APP_ID_FORMAT)
			);
		}
		return VALIDATION_RESULT_SUCCESS;
	}

	validateScriptId(fieldValue) {
		let notEmpty =
			fieldValue !== ''
				? VALIDATION_RESULT_SUCCESS
				: VALIDATION_RESULT_FAILURE(
						TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.EMPTY_FIELD)
				  );

		if (notEmpty.result != true) {
			return notEmpty;
		} else if (!fieldValue.match(SCRIPT_ID_REGEX)) {
			return VALIDATION_RESULT_FAILURE(
				TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.SCRIPT_ID_FORMAT)
			);
		}
		return VALIDATION_RESULT_SUCCESS;
	}

	validateXMLCharacters(fieldValue) {
		return !XML_FORBIDDEN_CHARACTERS_REGEX.test(fieldValue)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(
						ANSWERS_VALIDATION_MESSAGES.FIELD_HAS_XML_FORBIDDEN_CHARACTERS
					)
			  );
	}

	validateEmail(fieldValue) {
		return EMAIL_REGEX.test(fieldValue)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.INVALID_EMAIL)
			  );
	}

	validateNotUndefined(value, optionName) {
		return value !== undefined
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(COMMAND_OPTION_IS_MANDATORY, optionName)
			  );
	}

	validateDevUrl(devUrlValue) {
		const builtUrl = url.parse(devUrlValue);
		return !builtUrl.protocol && SUBDOMAIN_DOMAIN_URL_REGEX.test(devUrlValue)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.DEV_URL)
			  );
	}

	validateProjectType(value) {
		return [ApplicationConstants.PROJECT_SUITEAPP, ApplicationConstants.PROJECT_ACP].includes(
			value
		)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(
					TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.WRONG_PROJECT_TYPE)
			  );
	}

	validateNotProductionUrl(url) {
		return !url.match(PRODUCTION_ACCOUNT_URL_REGEX)
			? VALIDATION_RESULT_SUCCESS
			: VALIDATION_RESULT_FAILURE(TranslationService.getMessage(ANSWERS_VALIDATION_MESSAGES.PRODUCTION_URL_WITH_DEV_FLAG));
	}
}

module.exports = new InteractiveAnswersValidator();
