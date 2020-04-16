/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { ActionResult } from '../commands/actionresult/ActionResult';
import { DeployActionResult, DeployActionResultBuilder } from '../commands/actionresult/DeployActionResult';
import BaseCommandGenerator from './BaseCommandGenerator';
import * as CommandUtils from '../utils/CommandUtils';
import ProjectInfoService from '../services/ProjectInfoService';
import AccountSpecificArgumentHandler from '../utils/AccountSpecificValuesArgumentHandler';
import ApplyContentProtectinoArgumentHandler from '../utils/ApplyContentProtectionArgumentHandler';
import { NodeTranslationService } from '../services/NodeTranslationService';
import { executeWithSpinner } from '../ui/CliSpinner';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import assert from 'assert';
import { LINKS, PROJECT_ACP, PROJECT_SUITEAPP, SDK_TRUE } from '../ApplicationConstants';
import { COMMAND_DEPLOY, NO, YES } from '../services/TranslationKeys';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { DeployCommandAnswer } from '../../types/CommandAnswers';
import { Prompt } from '../../types/Prompt';
import DeployOutputFormatter from './outputFormatters/DeployOutputFormatter';
import ApplyContentProtectionArgumentHandler from '../utils/ApplyContentProtectionArgumentHandler';


const COMMAND = {
	OPTIONS: {
		ACCOUNT_SPECIFIC_VALUES: 'accountspecificvalues',
		APPLY_CONTENT_PROTECTION: 'applycontentprotection',
		LOG: 'log',
		PROJECT: 'project',
	},
	FLAGS: {
		NO_PREVIEW: 'no_preview',
		SKIP_WARNING: 'skip_warning',
		VALIDATE: 'validate',
	},
};

enum ACCOUNT_SPECIFIC_VALUES_OPTIONS {
	ERROR = 'ERROR',
	WARNING = 'WARNING',
};

export default class DeployCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, DeployCommandAnswer> {
	private projectInfoService: ProjectInfoService;
	private projectType: string;
	private accountSpecificValuesArgumentHandler: AccountSpecificArgumentHandler;
	private applyContentProtectionArgumentHandler: ApplyContentProtectinoArgumentHandler;
	protected actionResultBuilder = new DeployActionResultBuilder();

	constructor(options: BaseCommandParameters) {
		super(options);
		this.projectInfoService = new ProjectInfoService(this.projectFolder);
		this.projectType = this.projectInfoService.getProjectType();
		this.accountSpecificValuesArgumentHandler = new AccountSpecificArgumentHandler({
			projectInfoService: this.projectInfoService
		});
		this.applyContentProtectionArgumentHandler = new ApplyContentProtectionArgumentHandler({
			projectInfoService: this.projectInfoService,
			commandName: this.commandMetadata.sdkCommand,
		});
		this.outputFormatter = new DeployOutputFormatter(options.consoleLogger);
	}

	public async getCommandQuestions(prompt: Prompt<DeployCommandAnswer>) {
		const isSuiteAppProject = this.projectType === PROJECT_SUITEAPP;
		const isACProject = this.projectType === PROJECT_ACP;

		const answers = await prompt([
			{
				when: isSuiteAppProject && this.projectInfoService.hasLockAndHideFiles(),
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND.OPTIONS.APPLY_CONTENT_PROTECTION,
				message: NodeTranslationService.getMessage(COMMAND_DEPLOY.QUESTIONS.APPLY_CONTENT_PROTECTION),
				default: 1,
				choices: [
					{ name: NodeTranslationService.getMessage(YES), value: true },
					{ name: NodeTranslationService.getMessage(NO), value: false }
				]
			},
			{
				when: isACProject,
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND.OPTIONS.ACCOUNT_SPECIFIC_VALUES,
				message: NodeTranslationService.getMessage(COMMAND_DEPLOY.QUESTIONS.ACCOUNT_SPECIFIC_VALUES),
				default: 1,
				choices: [
					{
						name: NodeTranslationService.getMessage(COMMAND_DEPLOY.QUESTIONS_CHOICES.ACCOUNT_SPECIFIC_VALUES.DISPLAY_WARNING),
						value: ACCOUNT_SPECIFIC_VALUES_OPTIONS.WARNING,
					},
					{
						name: NodeTranslationService.getMessage(COMMAND_DEPLOY.QUESTIONS_CHOICES.ACCOUNT_SPECIFIC_VALUES.CANCEL_PROCESS),
						value: ACCOUNT_SPECIFIC_VALUES_OPTIONS.ERROR,
					}
				]
			},
			{
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND.FLAGS.VALIDATE,
				message: NodeTranslationService.getMessage(COMMAND_DEPLOY.QUESTIONS.PERFORM_LOCAL_VALIDATION),
				default: 0,
				choices: [
					{ name: NodeTranslationService.getMessage(YES), value: true },
					{ name: NodeTranslationService.getMessage(NO), value: false }
				]
			}
		]);

		if (isSuiteAppProject && !answers.hasOwnProperty(COMMAND.OPTIONS.APPLY_CONTENT_PROTECTION)) {
			this.consoleLogger.info(
				NodeTranslationService.getMessage(
					COMMAND_DEPLOY.MESSAGES.NOT_ASKING_CONTENT_PROTECTION_REASON,
					LINKS.HOW_TO.CREATE_HIDDING_XML,
					LINKS.HOW_TO.CREATE_LOCKING_XML
				)
			);
		}

		return answers;
	}

	public preExecuteAction(args: any) {
		this.accountSpecificValuesArgumentHandler.validate(args);
		this.applyContentProtectionArgumentHandler.validate(args);

		return {
			...args,
			[COMMAND.OPTIONS.PROJECT]: CommandUtils.quoteString(this.projectFolder),
			...this.accountSpecificValuesArgumentHandler.transformArgument(args),
			...this.applyContentProtectionArgumentHandler.transformArgument(args)
		};
	}

	public async executeAction(answers: DeployCommandAnswer) {
		try {
			const SDKParams = CommandUtils.extractCommandOptions(answers, this.commandMetadata);
			const flags = [COMMAND.FLAGS.NO_PREVIEW, COMMAND.FLAGS.SKIP_WARNING];
			if (SDKParams[COMMAND.FLAGS.VALIDATE]) {
				delete SDKParams[COMMAND.FLAGS.VALIDATE];
				flags.push(COMMAND.FLAGS.VALIDATE);
			}
			const executionContextForDeploy = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				includeProjectDefaultAuthId: true,
				params: SDKParams,
				flags,
			});

			const operationResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContextForDeploy),
				message: NodeTranslationService.getMessage(COMMAND_DEPLOY.MESSAGES.DEPLOYING),
			});

			const isServerValidation = SDKParams[COMMAND.FLAGS.VALIDATE] ? true : false;
			const isApplyContentProtection = this.projectType === PROJECT_SUITEAPP && SDKParams[COMMAND.OPTIONS.APPLY_CONTENT_PROTECTION] === SDK_TRUE;

			return operationResult.status === SDKOperationResultUtils.STATUS.SUCCESS
				? this.actionResultBuilder.withData(operationResult.data)
						.withResultMessage(operationResult.resultMessage)
						.withServerValidation(isServerValidation)
						.withAppliedContentProtection(isApplyContentProtection)
						.withProjectType(this.projectType)
						.withProjectFolder(this.projectFolder)
						.build()
				: this.actionResultBuilder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return this.actionResultBuilder.withErrors([error]).build();
		}
	}
};
