/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { ActionResultBuilder } from '../commands/actionresult/ActionResult';
import { AddDependenciesCommandAnswer } from "../../types/CommandAnswers";

import BaseCommandGenerator from './BaseCommandGenerator';
import SDKExecutionContext from '../SDKExecutionContext';
import { executeWithSpinner } from '../ui/CliSpinner';
import { NodeTranslationService } from '../services/NodeTranslationService';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import * as CommandUtils from '../utils/CommandUtils';
import { BaseCommandParameters } from "../../types/CommandOptions";
import AddDependenciesOutputFormatter from './outputFormatters/AddDependenciesOutputFormatter';

import { COMMAND_ADDDEPENDENCIES } from '../services/TranslationKeys';

enum COMMAND_OPTIONS {
	ALL = 'all',
	PROJECT = 'project',
};

export default class AddDependenciesCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, AddDependenciesCommandAnswer> {
	protected actionResultBuilder = new ActionResultBuilder();
	constructor(options: BaseCommandParameters) {
		super(options);
		this.outputFormatter = new AddDependenciesOutputFormatter(options.consoleLogger);
	}

	public preExecuteAction(answers: AddDependenciesCommandAnswer) {
		answers.project = CommandUtils.quoteString(this.projectFolder);
		return answers;
	}

	public async executeAction(answers: AddDependenciesCommandAnswer) {
        try {
		    const executionContext = new SDKExecutionContext({
			    command: this.commandMetadata.sdkCommand,
    			params: answers,
				flags: [COMMAND_OPTIONS.ALL],
				requiresContextParams: true,
			});
		    const operationResult = await executeWithSpinner({
					action: this.sdkExecutor.execute(executionContext),
					message: NodeTranslationService.getMessage(COMMAND_ADDDEPENDENCIES.MESSAGES.ADDING_DEPENDENCIES),
				});

			return operationResult.status === SDKOperationResultUtils.STATUS.SUCCESS
				? this.actionResultBuilder.withData(operationResult.data)
						.withResultMessage(operationResult.resultMessage)
						.build()
				: this.actionResultBuilder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return this.actionResultBuilder.withErrors([error]).build();
		}
	}

	public supportsInteractiveMode() {
		return false;
	}
}
