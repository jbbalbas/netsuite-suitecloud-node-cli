/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { SetupActionResultBuilder } from '../commands/actionresult/SetupActionResult';
import chalk from 'chalk';
import path from 'path';
import BaseCommandGenerator from './BaseCommandGenerator';
import SDKExecutionContext from '../SDKExecutionContext';
import { executeWithSpinner } from '../ui/CliSpinner';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import * as FileUtils from '../utils/FileUtils';
import * as CommandUtils from '../utils/CommandUtils';
import { NodeTranslationService } from '../services/NodeTranslationService';
import AuthenticationService from './../core/authentication/AuthenticationService';
import inquirer from 'inquirer';
import { FILES } from '../ApplicationConstants';
import { COMMAND_SETUPACCOUNT } from '../services/TranslationKeys';
import SetupOutputFormatter from './outputFormatters/SetupOutputFormatter';

import {
	validateFieldHasNoSpaces,
	validateFieldIsNotEmpty,
	validateAuthIDNotInList,
	validateAlphanumericHyphenUnderscore,
	validateMaximumLength,
	showValidationResults,
} from '../validation/InteractiveAnswersValidator';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { SetupCommandAnswer } from '../../types/CommandAnswers';
import { SetupCommandOperationResult } from '../../types/OperationResult';
import { Prompt } from '../../types/Prompt';

const ANSWERS = {
	DEVELOPMENT_MODE_URL: 'developmentModeUrl',
	SELECTED_AUTH_ID: 'selected_auth_id',
	AUTH_MODE: 'AUTH_MODE',
	NEW_AUTH_ID: 'NEW_AUTH_ID',
	SAVE_TOKEN_ACCOUNT_ID: 'accountId',
	SAVE_TOKEN_ID: 'saveTokenId',
	SAVE_TOKEN_SECRET: 'saveTokenSecret',
};

const AUTH_MODE = {
	OAUTH: 'OAUTH',
	SAVE_TOKEN: 'SAVE_TOKEN',
	REUSE: 'REUSE',
};

const COMMANDS = {
	AUTHENTICATE: 'authenticate',
	MANAGEAUTH: 'manageauth',
};

const FLAGS = {
	LIST: 'list',
	SAVETOKEN: 'savetoken',
	DEVELOPMENTMODE: 'developmentmode',
};

const CREATE_NEW_AUTH = '******CREATE_NEW_AUTH*******!£$%&*';
export default class SetupCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, SetupCommandAnswer> {
	private authenticationService: AuthenticationService
	protected actionResultBuilder = new SetupActionResultBuilder();
	constructor(options: BaseCommandParameters) {
		super(options);
		this.authenticationService = new AuthenticationService(options.executionPath);
		this.outputFormatter = new SetupOutputFormatter(options.consoleLogger);
	}

	public async getCommandQuestions(prompt: Prompt<SetupCommandAnswer>, commandArguments?: {dev?: boolean}) {
		this.checkWorkingDirectoryContainsValidProject();

		const getAuthListContext = new SDKExecutionContext({
			command: COMMANDS.MANAGEAUTH,
			flags: [FLAGS.LIST],
		});

		const existingAuthIDsResponse = await executeWithSpinner({
			action: this.sdkExecutor.execute(getAuthListContext),
			message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.MESSAGES.GETTING_AVAILABLE_AUTHIDS),
		});
		console.log(JSON.stringify(existingAuthIDsResponse));

		if (existingAuthIDsResponse.status === SDKOperationResultUtils.STATUS.ERROR) {
			throw SDKOperationResultUtils.getResultMessage(existingAuthIDsResponse);
		}

		let authIdAnswer: SetupCommandAnswer;
		const choices = [];
		const authIDs = Object.keys(existingAuthIDsResponse.data);

		if (authIDs.length > 0) {
			choices.push({
				name: chalk.bold(NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS_CHOICES.SELECT_AUTHID.NEW_AUTH_ID)),
				value: CREATE_NEW_AUTH,
			});
			choices.push(new inquirer.Separator());
			choices.push(new inquirer.Separator(NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.MESSAGES.SELECT_CONFIGURED_AUTHID)));

			authIDs.forEach((authID) => {
				const authentication = existingAuthIDsResponse.data[authID];
				const isDevLabel = authentication.developmentMode
					? NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS_CHOICES.SELECT_AUTHID.EXISTING_AUTH_ID_DEV_URL, authentication.urls.app)
					: '';
				const accountInfo = `${authentication.accountInfo.companyName} [${authentication.accountInfo.roleName}]`;
				choices.push({
					name: NodeTranslationService.getMessage(
						COMMAND_SETUPACCOUNT.QUESTIONS_CHOICES.SELECT_AUTHID.EXISTING_AUTH_ID,
						authID,
						accountInfo,
						isDevLabel
					),
					value: { authId: authID, accountInfo: authentication.accountInfo },
				});
			});
			choices.push(new inquirer.Separator());

			authIdAnswer = await prompt([
				{
					type: CommandUtils.INQUIRER_TYPES.LIST,
					name: ANSWERS.SELECTED_AUTH_ID,
					message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS.SELECT_AUTHID),
					choices: choices,
				},
			]);
		} else {
			// There was no previous authIDs
			authIdAnswer = {
				selected_auth_id: CREATE_NEW_AUTH,
			};
		}

		const selectedAuth  = { 
			authId: authIdAnswer.selected_auth_id
		}
		// creating a new authID
		let developmentModeUrlAnswer;

		if (selectedAuth.authId !== CREATE_NEW_AUTH) {
			// reuse existing authID
			return {
				createNewAuthentication: false,
				authentication: selectedAuth,
				mode: AUTH_MODE.REUSE,
			};
		}
		else {
			const developmentMode = commandArguments && commandArguments.dev !== undefined && commandArguments.dev;

			if (developmentMode) {
				developmentModeUrlAnswer = await prompt([
					{
						type: CommandUtils.INQUIRER_TYPES.INPUT,
						name: ANSWERS.DEVELOPMENT_MODE_URL,
						message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS.DEVELOPMENT_MODE_URL),
						filter: (answer: string) => answer.trim(),
						validate: (fieldValue: string) => showValidationResults(fieldValue, validateFieldIsNotEmpty, validateFieldHasNoSpaces),
					},
				]);
			}
			const newAuthenticationAnswers = await prompt([
				{
					type: CommandUtils.INQUIRER_TYPES.LIST,
					name: ANSWERS.AUTH_MODE,
					message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS.AUTH_MODE),
					choices: [
						{
							name: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS_CHOICES.AUTH_MODE.OAUTH),
							value: AUTH_MODE.OAUTH,
						},
						{
							name: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS_CHOICES.AUTH_MODE.SAVE_TOKEN),
							value: AUTH_MODE.SAVE_TOKEN,
						},
					],
				},
				{
					type: CommandUtils.INQUIRER_TYPES.INPUT,
					name: ANSWERS.NEW_AUTH_ID,
					message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS.NEW_AUTH_ID),
					filter: (answer: string) => answer.trim(),
					validate: (fieldValue: string) =>
						showValidationResults(fieldValue, validateFieldIsNotEmpty, validateFieldHasNoSpaces, fieldValue =>
							validateAuthIDNotInList(fieldValue, authIDs), validateAlphanumericHyphenUnderscore, validateMaximumLength
						),
				},
				{
					when: (response: SetupCommandAnswer) => response.AUTH_MODE === AUTH_MODE.SAVE_TOKEN,
					type: CommandUtils.INQUIRER_TYPES.INPUT,
					name: ANSWERS.SAVE_TOKEN_ACCOUNT_ID,
					message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS.SAVE_TOKEN_ACCOUNT_ID),
					filter: (fieldValue: string) => fieldValue.trim(),
					validate: (fieldValue: string) => showValidationResults(
						fieldValue,
						validateFieldIsNotEmpty,
						validateFieldHasNoSpaces,
						validateAlphanumericHyphenUnderscore
					),
				},
				{
					when: (response: SetupCommandAnswer) => response.AUTH_MODE === AUTH_MODE.SAVE_TOKEN,
					type: CommandUtils.INQUIRER_TYPES.PASSWORD,
					mask: CommandUtils.INQUIRER_TYPES.PASSWORD_MASK,
					name: ANSWERS.SAVE_TOKEN_ID,
					message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS.SAVE_TOKEN_ID),
					filter: (fieldValue: string) => fieldValue.trim(),
					validate: (fieldValue: string) => showValidationResults(fieldValue, validateFieldIsNotEmpty),
				},
				{
					when: (response: SetupCommandAnswer) => response.AUTH_MODE === AUTH_MODE.SAVE_TOKEN,
					type: CommandUtils.INQUIRER_TYPES.PASSWORD,
					mask: CommandUtils.INQUIRER_TYPES.PASSWORD_MASK,
					name: ANSWERS.SAVE_TOKEN_SECRET,
					message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.QUESTIONS.SAVE_TOKEN_SECRET),
					filter: (fieldValue: string) => fieldValue.trim(),
					validate: (fieldValue: string) => showValidationResults(fieldValue, validateFieldIsNotEmpty),
				},
			]);

			const executeActionContext: SetupCommandAnswer = {
				developmentMode: developmentMode,
				createNewAuthentication: true,
				newAuthId: newAuthenticationAnswers.NEW_AUTH_ID,
				mode: newAuthenticationAnswers.AUTH_MODE,
				saveToken: {
					account: newAuthenticationAnswers.accountId,
					tokenId: newAuthenticationAnswers.saveTokenId,
					tokenSecret: newAuthenticationAnswers.saveTokenSecret,
				},
			};

			if (developmentModeUrlAnswer) {
				executeActionContext.url = developmentModeUrlAnswer.developmentModeUrl;
			}

			return executeActionContext;
		}
	}

	private checkWorkingDirectoryContainsValidProject() {
		if (!FileUtils.exists(path.join(this.projectFolder, FILES.MANIFEST_XML))) {
			throw NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.ERRORS.NOT_PROJECT_FOLDER, FILES.MANIFEST_XML, this.projectFolder);
		}
	}

	public async executeAction(executeActionContext: SetupCommandAnswer) {
		try {
			let authId;
			let accountInfo;
			if (executeActionContext.mode === AUTH_MODE.OAUTH) {
				const commandParams: {authId?: string; url?: string;} = {
					authId: executeActionContext.newAuthId,
				};

				if (executeActionContext.url) {
					commandParams.url = executeActionContext.url;
				}

				const operationResult = await this.performBrowserBasedAuthentication(commandParams, executeActionContext.developmentMode);
				if (operationResult.status === SDKOperationResultUtils.STATUS.ERROR) {
					return this.actionResultBuilder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
				}
				authId = executeActionContext.newAuthId;
				accountInfo = operationResult.data.accountInfo;
			} else if (executeActionContext.mode === AUTH_MODE.SAVE_TOKEN && executeActionContext.saveToken) {
				const commandParams: {authid?: string; account?: string; tokenid?:string; tokensecret?:string; url?:string;} = {
					authid: executeActionContext.newAuthId,
					account: executeActionContext.saveToken.account,
					tokenid: executeActionContext.saveToken.tokenId,
					tokensecret: executeActionContext.saveToken.tokenSecret,
				};


				const operationResult = await this.saveToken(commandParams, executeActionContext.developmentMode);
				if (operationResult.status === SDKOperationResultUtils.STATUS.ERROR) {
					return this.actionResultBuilder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
				}
				authId = executeActionContext.newAuthId;
				accountInfo = operationResult.data.accountInfo;
			} else if (executeActionContext.mode === AUTH_MODE.REUSE) {
				authId = executeActionContext.authentication?.authId;
				accountInfo = executeActionContext.authentication?.accountInfo;
			}
			this.authenticationService.setDefaultAuthentication(authId);

			return this.actionResultBuilder.success().withMode(executeActionContext.mode).withAuthId(authId).withAccountInfo(accountInfo).build();
		} catch (error) {
			return this.actionResultBuilder.withErrors([error]).build();
		}
	}

	private async performBrowserBasedAuthentication(params: any, developmentMode?: boolean) {
		const executionContextOptions: {command: string; params: any; flags?: string[]} = {
			command: COMMANDS.AUTHENTICATE,
			params,
		};

		if (developmentMode) {
			executionContextOptions.flags = [FLAGS.DEVELOPMENTMODE];
		}

		const authenticateSDKExecutionContext = new SDKExecutionContext(executionContextOptions);

		const operationResult = await executeWithSpinner({
			action: this.sdkExecutor.execute(authenticateSDKExecutionContext),
			message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.MESSAGES.STARTING_OAUTH_FLOW),
		});
		this.checkOperationResultIsSuccessful(operationResult);

		return operationResult;
	}

	private async saveToken(params: any, developmentMode?: boolean) {
		const executionContextOptions = {
			command: COMMANDS.AUTHENTICATE,
			params,
			flags: [FLAGS.SAVETOKEN],
		};

		if (developmentMode) {
			executionContextOptions.flags.push(FLAGS.DEVELOPMENTMODE);
		}

		const executionContext = new SDKExecutionContext(executionContextOptions);

		const operationResult = await executeWithSpinner({
			action: this.sdkExecutor.execute(executionContext),
			message: NodeTranslationService.getMessage(COMMAND_SETUPACCOUNT.MESSAGES.SAVING_TBA_TOKEN),
		});
		this.checkOperationResultIsSuccessful(operationResult);

		return operationResult;
	}

	private checkOperationResultIsSuccessful(operationResult: SetupCommandOperationResult) {
		if (operationResult.status === SDKOperationResultUtils.STATUS.ERROR) {
			const errorMessage = SDKOperationResultUtils.getResultMessage(operationResult);
			if (errorMessage) {
				throw errorMessage;
			}
			throw SDKOperationResultUtils.collectErrorMessages(operationResult);
		}
	}
};
