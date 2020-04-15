/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

'use strict';
import { ActionResult } from '../commands/actionresult/ActionResult';
import { ValidateActionResultBuilder } from '../commands/actionresult/ValidateActionResult';
import * as ActionResultUtils from '../utils/ActionResultUtils';

import BaseCommandGenerator from './BaseCommandGenerator';
import SDKExecutionContext from '../SDKExecutionContext';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import { NodeTranslationService } from '../services/NodeTranslationService';
import * as CommandUtils from '../utils/CommandUtils';
import ProjectInfoService from '../services/ProjectInfoService';
import AccountSpecificArgumentHandler from '../utils/AccountSpecificValuesArgumentHandler';
import ApplyContentProtectinoArgumentHandler from '../utils/ApplyContentProtectionArgumentHandler';
import { executeWithSpinner } from '../ui/CliSpinner';
import { PROJECT_ACP, PROJECT_SUITEAPP, SDK_TRUE } from '../ApplicationConstants';
import { COMMAND_VALIDATE, YES, NO } from '../services/TranslationKeys';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { Prompt } from '../../types/Prompt';
import { ValidateCommandAnswers } from '../../types/CommandAnswers';
import { ValidateOperationResult, ValidateOperationSdkParams } from '../../types/OperationResult';
import { ColorSupport, Chalk } from 'chalk';
import ValidateOutputFormatter from './outputFormatters/ValidateOutputFormatter';

const COMMAND_OPTIONS = {
	SERVER: 'server',
	ACCOUNT_SPECIFIC_VALUES: 'accountspecificvalues',
	APPLY_CONTENT_PROTECTION: 'applycontentprotection',
	PROJECT: 'project',
};

const ACCOUNT_SPECIFIC_VALUES_OPTIONS = {
	ERROR: 'ERROR',
	WARNING: 'WARNING',
};

export default class ValidateCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, ValidateCommandAnswers> {
	private projectInfoService: ProjectInfoService;
	private accountSpecificValuesArgumentHandler: AccountSpecificArgumentHandler;
	private applyContentProtectionArgumentHandler: ApplyContentProtectinoArgumentHandler;
	private responseBuilder = new ValidateActionResultBuilder();

	constructor(options: BaseCommandParameters) {
		super(options);
		this.projectInfoService = new ProjectInfoService(this.projectFolder);
		this.accountSpecificValuesArgumentHandler = new AccountSpecificArgumentHandler({
			projectInfoService: this.projectInfoService,
		});
		this.applyContentProtectionArgumentHandler = new ApplyContentProtectinoArgumentHandler({
			projectInfoService: this.projectInfoService,
			commandName: this.commandMetadata.sdkCommand,
		});
		this.outputFormatter = new ValidateOutputFormatter(this.consoleLogger);
	}

	public getCommandQuestions(prompt: Prompt<ValidateCommandAnswers>) {
		return prompt([
			{
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND_OPTIONS.SERVER,
				message: NodeTranslationService.getMessage(COMMAND_VALIDATE.QUESTIONS.SERVER_SIDE),
				default: 0,
				choices: [
					{
						name: NodeTranslationService.getMessage(
							COMMAND_VALIDATE.QUESTIONS_CHOICES.ACCOUNT_OR_LOCAL.ACCOUNT
						),
						value: true,
					},
					{
						name: NodeTranslationService.getMessage(
							COMMAND_VALIDATE.QUESTIONS_CHOICES.ACCOUNT_OR_LOCAL.LOCAL
						),
						value: false,
					},
				],
			},
			{
				when: this.projectInfoService.getProjectType() === PROJECT_ACP,
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND_OPTIONS.ACCOUNT_SPECIFIC_VALUES,
				message: NodeTranslationService.getMessage(COMMAND_VALIDATE.QUESTIONS.ACCOUNT_SPECIFIC_VALUES),
				default: 1,
				choices: [
					{
						name: NodeTranslationService.getMessage(
							COMMAND_VALIDATE.QUESTIONS_CHOICES.ACCOUNT_SPECIFIC_VALUES.WARNING
						),
						value: ACCOUNT_SPECIFIC_VALUES_OPTIONS.WARNING,
					},
					{
						name: NodeTranslationService.getMessage(
							COMMAND_VALIDATE.QUESTIONS_CHOICES.ACCOUNT_SPECIFIC_VALUES.CANCEL
						),
						value: ACCOUNT_SPECIFIC_VALUES_OPTIONS.ERROR,
					},
				],
			},
			{
				when:
					this.projectInfoService.getProjectType() === PROJECT_SUITEAPP &&
					this.projectInfoService.hasLockAndHideFiles(),
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND_OPTIONS.APPLY_CONTENT_PROTECTION,
				message: NodeTranslationService.getMessage(COMMAND_VALIDATE.QUESTIONS.APPLY_CONTENT_PROTECTION),
				default: 0,
				choices: [
					{
						name: NodeTranslationService.getMessage(NO),
						value: false,
					},
					{
						name: NodeTranslationService.getMessage(YES),
						value: true,
					},
				],
			},
		]);
	}

	public preExecuteAction(args: ValidateCommandAnswers) {
		this.accountSpecificValuesArgumentHandler.validate(args);
		this.applyContentProtectionArgumentHandler.validate(args);

		return {
			...args,
			[COMMAND_OPTIONS.PROJECT]: CommandUtils.quoteString(this.projectFolder),
			...this.accountSpecificValuesArgumentHandler.transformArgument(args),
			...this.applyContentProtectionArgumentHandler.transformArgument(args),
		};
	}

	public async executeAction(answers: ValidateCommandAnswers) {
		try {
			const SDKParams = CommandUtils.extractCommandOptions(answers, this.commandMetadata);

			let isServerValidation = false;
			const flags = [];

			if (answers.server) {
				flags.push(COMMAND_OPTIONS.SERVER);
				isServerValidation = true;
				delete SDKParams.server;
			}

			const executionContext = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				params: SDKParams,
				flags: flags,
				includeProjectDefaultAuthId: true,
			});

			const operationResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContext),
				message: NodeTranslationService.getMessage(COMMAND_VALIDATE.MESSAGES.VALIDATING),
			});

			return operationResult.status === SDKOperationResultUtils.STATUS.SUCCESS
				? this.responseBuilder.withData(operationResult.data)
						.withResultMessage(operationResult.resultMessage)
						.withServerValidation(isServerValidation)
						.withAppliedContentProtection(SDKParams[COMMAND_OPTIONS.APPLY_CONTENT_PROTECTION] === SDK_TRUE)
						.withProjectType(this.projectInfoService.getProjectType())
						.withProjectFolder(this.projectFolder)
						.build()
				: this.responseBuilder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return this.responseBuilder.withErrors([error]).build();
		}
	}
};
