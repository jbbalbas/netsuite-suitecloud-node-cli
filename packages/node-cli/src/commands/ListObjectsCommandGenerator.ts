/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { ActionResult } from '../commands/actionresult/ActionResult';

import inquirer from 'inquirer';
import BaseCommandGenerator from './BaseCommandGenerator';
import * as CommandUtils from '../utils/CommandUtils';
import { executeWithSpinner } from '../ui/CliSpinner';
import * as NodeUtils from '../utils/NodeUtils';
import OBJECT_TYPES from '../metadata/ObjectTypesMetadata';
import ProjectInfoService from '../services/ProjectInfoService';
import NodeTranslationService from '../services/NodeTranslationService';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import ListObjectsOutputFormatter from './outputFormatters/ListObjectsOutputFormatter';

import {
	validateArrayIsNotEmpty,
	validateFieldIsNotEmpty,
	validateSuiteApp,
	showValidationResults,
} from '../validation/InteractiveAnswersValidator';
import { PROJECT_SUITEAPP } from '../ApplicationConstants';
import { COMMAND_LISTOBJECTS, YES, NO } from '../services/TranslationKeys';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { ListObjectsCommandAnswer } from '../../types/CommandAnswers';
import { ListObjectsOperationResult } from '../../types/OperationResult';
import { Prompt, PromptParameters } from '../../types/Prompt';

const COMMAND_QUESTIONS_NAMES = {
	APP_ID: 'appid',
	SCRIPT_ID: 'scriptid',
	SPECIFY_SCRIPT_ID: 'specifyscriptid',
	SPECIFY_SUITEAPP: 'specifysuiteapp',
	TYPE: 'type',
	TYPE_ALL: 'typeall',
};

export default class ListObjectsCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, ListObjectsCommandAnswer> {
	private projectInfoService: ProjectInfoService;
	constructor(options: BaseCommandParameters) {
		super(options);
		this.projectInfoService = new ProjectInfoService(this.projectFolder);
		this.outputFormatter = new ListObjectsOutputFormatter(options.consoleLogger);
	}

	public async getCommandQuestions(prompt: Prompt<ListObjectsCommandAnswer>) {
		const questions: PromptParameters<ListObjectsCommandAnswer>[] = [];
		//create a class to see type based on manifest.
		if (this.projectInfoService.getProjectType() === PROJECT_SUITEAPP) {
			let message = NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.QUESTIONS.SPECIFIC_APPID);

			questions.push({
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND_QUESTIONS_NAMES.SPECIFY_SUITEAPP,
				message,
				default: 0,
				choices: [
					{ name: NodeTranslationService.getMessage(YES), value: true },
					{ name: NodeTranslationService.getMessage(NO), value: false },
				],
				validate: (fieldValue: string) => showValidationResults(fieldValue, validateFieldIsNotEmpty)
			});

			questions.push({
				when: response => response.specifysuiteapp,
				type: CommandUtils.INQUIRER_TYPES.INPUT,
				name: COMMAND_QUESTIONS_NAMES.APP_ID,
				message: NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.QUESTIONS.APPID),
				validate: (fieldValue: string)  => showValidationResults(fieldValue, validateSuiteApp)
			});
		}

		questions.push({
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: COMMAND_QUESTIONS_NAMES.TYPE_ALL,
			message: NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.QUESTIONS.SHOW_ALL_CUSTOM_OBJECTS),
			default: 0,
			choices: [
				{ name: NodeTranslationService.getMessage(YES), value: true },
				{ name: NodeTranslationService.getMessage(NO), value: false }
			]
		});

		questions.push({
			when: answers => !answers.typeall,
			type: CommandUtils.INQUIRER_TYPES.CHECKBOX,
			name: COMMAND_QUESTIONS_NAMES.TYPE,
			message: NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.QUESTIONS.FILTER_BY_CUSTOM_OBJECTS),
			pageSize: 15,
			choices: [
				...OBJECT_TYPES.map(customObject => ({ name: customObject.name, value: customObject.value.type })),
				new inquirer.Separator()
			],
			validate: (fieldValue: string) => showValidationResults(fieldValue, validateArrayIsNotEmpty)
		});

		questions.push({
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: COMMAND_QUESTIONS_NAMES.SPECIFY_SCRIPT_ID,
			message: NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.QUESTIONS.FILTER_BY_SCRIPT_ID),
			default: false,
			choices: [
				{ name: NodeTranslationService.getMessage(YES), value: true },
				{ name: NodeTranslationService.getMessage(NO), value: false }
			]
		});

		questions.push({
			when: response => response.specifyscriptid,
			type: CommandUtils.INQUIRER_TYPES.INPUT,
			name: COMMAND_QUESTIONS_NAMES.SCRIPT_ID,
			message: NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.QUESTIONS.SCRIPT_ID),
			validate: (fieldValue: string) => showValidationResults(fieldValue, validateFieldIsNotEmpty)
		});
		return await prompt(questions);
	}

	public async executeAction(answers: ListObjectsCommandAnswer) {
		try {
			const params = CommandUtils.extractCommandOptions(answers, this.commandMetadata);
			if (Array.isArray(params.type)) {
				params.type = params.type.join(' ');
			}
			const executionContext = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				params,
				includeProjectDefaultAuthId: true,
			});

			const actionListObjects = this._sdkExecutor.execute(executionContext);

			const operationResult = await executeWithSpinner({
				action: actionListObjects,
				message: NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.LISTING_OBJECTS),
			});

			return operationResult.status === SDKOperationResultUtils.STATUS.SUCCESS
				? ActionResult.Builder.withData(operationResult.data)
						.withResultMessage(operationResult.resultMessage)
						.build()
				: ActionResult.Builder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return ActionResult.Builder.withErrors([error]).build();
		}
	}
};
