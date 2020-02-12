/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

'use strict';

import NodeTranslationService from '../services/NodeTranslationService';
import assert from 'assert';
import { UTILS } from '../services/TranslationKeys';
import { PROJECT_SUITEAPP } from '../ApplicationConstants';
import ProjectInfoService from '../services/ProjectInfoService';

const ERRORS = UTILS.ACCOUNT_SPECIFIC_VALUES_ARGUMENT_HANDLER.ERRORS;
const ACCOUNT_SPECIFIC_VALUES = 'accountspecificvalues';
const ACCOUNT_SPECIFIC_VALUES_OPTIONS = {
	ERROR: 'ERROR',
	WARNING: 'WARNING',
};

export default class AccountSpecificValuesArgumentHandler {
	private projectInfoService: ProjectInfoService;
	constructor(options: {projectInfoService: ProjectInfoService}) {
		assert(options.projectInfoService);
		this.projectInfoService = options.projectInfoService;
	}

	validate(args: any) {
		if (args.hasOwnProperty(ACCOUNT_SPECIFIC_VALUES)) {
			assert(
				typeof args[ACCOUNT_SPECIFIC_VALUES] === 'string',
				NodeTranslationService.getMessage(ERRORS.WRONG_ACCOUNT_SPECIFIC_VALUES_OPTION)
			);
			if (this.projectInfoService.getProjectType() === PROJECT_SUITEAPP) {
				throw NodeTranslationService.getMessage(
					ERRORS.APPLY_ACCOUNT_SPECIFIC_VALUES_IN_SUITEAPP
				);
			}
		}
	}

	transformArgument(args: any) {
		const newArgs: {accountspecificvalues?:string} = {};

		if (args.hasOwnProperty(ACCOUNT_SPECIFIC_VALUES)) {
			const upperCaseValue = args[ACCOUNT_SPECIFIC_VALUES].toUpperCase();
			switch (upperCaseValue) {
				case ACCOUNT_SPECIFIC_VALUES_OPTIONS.WARNING:
					newArgs[ACCOUNT_SPECIFIC_VALUES] = ACCOUNT_SPECIFIC_VALUES_OPTIONS.WARNING;
					break;
				case ACCOUNT_SPECIFIC_VALUES_OPTIONS.ERROR:
					newArgs[ACCOUNT_SPECIFIC_VALUES] = ACCOUNT_SPECIFIC_VALUES_OPTIONS.ERROR;
					break;
				default:
					throw NodeTranslationService.getMessage(
						ERRORS.WRONG_ACCOUNT_SPECIFIC_VALUES_OPTION
					);
			}
		}

		return newArgs;
	}
};
