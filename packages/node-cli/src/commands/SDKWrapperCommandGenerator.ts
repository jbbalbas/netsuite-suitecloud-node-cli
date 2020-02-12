/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import { BaseCommandParameters } from "../../types/CommandOptions";

import BaseCommandGenerator from './BaseCommandGenerator';
import { executeWithSpinner } from '../ui/CliSpinner';
import * as CommandUtils from '../utils/CommandUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import NodeTranslationService from '../services/NodeTranslationService';
import { COMMAND_SDK_WRAPPER } from '../services/TranslationKeys';
import { SKDWrapperCommandAnswer } from "../../types/CommandAnswers";

const FLAG_OPTION_TYPE = 'FLAG';
const PROJECT_DIRECTORY_OPTION = 'projectdirectory';
const PROJECT_OPTION = 'project';

export default class SDKWrapperCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, SKDWrapperCommandAnswer> {
	constructor(options: BaseCommandParameters) {
		super(options);
	}

	public supportsInteractiveMode() {
		return false;
	}

	private setProjectFolderOptionsIfPresent(args: SKDWrapperCommandAnswer) {
		const projectOptions = [PROJECT_OPTION, PROJECT_DIRECTORY_OPTION];
		projectOptions.forEach(projectOption => {
			if (this.commandMetadata.options.project) {
				args.project = CommandUtils.quoteString(this.projectFolder);
			}
		});
	}

	public preExecuteAction(args: SKDWrapperCommandAnswer) {
		this.setProjectFolderOptionsIfPresent(args);
		return args;
	}

	public executeAction(args: SKDWrapperCommandAnswer) {
		const executionContext = new SDKExecutionContext({
			command: this.commandMetadata.sdkCommand,
			integrationMode: false,
		});

		for (const optionId in this.commandMetadata.options) {
			if (
				this.commandMetadata.options.hasOwnProperty(optionId) &&
				args.hasOwnProperty(optionId)
			) {
				if (this.commandMetadata.options[optionId].type === FLAG_OPTION_TYPE) {
					if (args[optionId]) {
						executionContext.addFlag(optionId);
					}
				} else {
					executionContext.addParam(optionId, args[optionId]);
				}
			}
		}
		return executeWithSpinner({
			action: this.sdkExecutor.execute(executionContext),
			message: NodeTranslationService.getMessage(
				COMMAND_SDK_WRAPPER.MESSAGES.EXECUTING_COMMAND,
				this.commandMetadata.name
			),
		});
	}
};
