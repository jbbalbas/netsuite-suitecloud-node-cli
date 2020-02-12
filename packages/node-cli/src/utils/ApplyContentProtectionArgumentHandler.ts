/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

'use strict';

import NodeTranslationService from '../services/NodeTranslationService';
import assert from 'assert';
import { LINKS, PROJECT_ACP, PROJECT_SUITEAPP, SDK_FALSE, SDK_TRUE } from '../ApplicationConstants';
import ProjectInfoService from '../services/ProjectInfoService';
import { UTILS } from '../services/TranslationKeys';

const ERRORS = UTILS.APPLY_CONTENT_PROTECTION_ARGUMENT_HANDLER.ERRORS;
const APPLY_CONTENT_PROTECTION = 'applycontentprotection';

export default class ApplyContentProtectionArgumentHandler {
	private projectInfoService: ProjectInfoService;
	private commandName: string;
	constructor(options: {projectInfoService: ProjectInfoService, commandName: string}) {
		assert(options.projectInfoService);
		assert(options.commandName);
		this.projectInfoService = options.projectInfoService;
		this.commandName = options.commandName;
	}

	validate(args: any) {
		if (
			args[APPLY_CONTENT_PROTECTION] &&
			this.projectInfoService.getProjectType() === PROJECT_ACP
		) {
			throw NodeTranslationService.getMessage(ERRORS.APPLY_CONTENT_PROTECTION_IN_ACP);
		}

		if (args[APPLY_CONTENT_PROTECTION] && !this.projectInfoService.hasLockAndHideFiles()) {
			throw NodeTranslationService.getMessage(
				ERRORS.APPLY_CONTENT_PROTECTION_WITHOUT_HIDING_AND_LOCKING,
				this.commandName,
				LINKS.HOW_TO.CREATE_HIDDING_XML,
				LINKS.HOW_TO.CREATE_LOCKING_XML
			);
		}
	}

	transformArgument(args: any) {
		const newArgs: {applycontentprotection?: string} = {};

		if (this.projectInfoService.getProjectType() === PROJECT_SUITEAPP) {
			newArgs[APPLY_CONTENT_PROTECTION] = args[APPLY_CONTENT_PROTECTION]
				? SDK_TRUE
				: SDK_FALSE;
		}

		return newArgs;
	}
};
