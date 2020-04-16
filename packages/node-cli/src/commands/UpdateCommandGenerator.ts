/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import path from 'path';
import inquirer from 'inquirer';
import BaseCommandGenerator from './BaseCommandGenerator';
import * as CommandUtils from '../utils/CommandUtils';
import { NodeTranslationService } from '../services/NodeTranslationService';
import FileSystemService from '../services/FileSystemService';
import { executeWithSpinner } from '../ui/CliSpinner';
import SDKExecutionContext from '../SDKExecutionContext';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import UpdateOutputFormatter from './outputFormatters/UpdateOutputFormatter';
import { COMMAND_UPDATE, YES, NO } from '../services/TranslationKeys';
import { validateArrayIsNotEmpty, validateScriptId, showValidationResults } from '../validation/InteractiveAnswersValidator';
import { FOLDERS } from '../ApplicationConstants';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { Prompt } from '../../types/Prompt';
import { UpdateCommandAnswer } from '../../types/CommandAnswers';
import { ActionResultBuilder } from './actionresult/ActionResult';

enum ANSWERS_NAMES {
	FILTER_BY_SCRIPT_ID = 'filterByScriptId',
	OVERWRITE_OBJECTS = 'overwriteObjects',
	SCRIPT_ID_LIST = 'scriptid',
	SCRIPT_ID_FILTER = 'scriptIdFilter',
};

const MAX_ENTRIES_BEFORE_FILTER = 30;
const XML_EXTENSION = '.xml';

export default class UpdateCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, UpdateCommandAnswer> {

	private fileSystemService: FileSystemService;
	protected actionResultBuilder = new ActionResultBuilder();

	constructor(options: BaseCommandParameters) {
		super(options);
		this.fileSystemService = new FileSystemService();
		this.outputFormatter = new UpdateOutputFormatter(options.consoleLogger);
	}

	public async getCommandQuestions(prompt: Prompt<UpdateCommandAnswer>) {
		const pathToObjectsFolder = path.join(this.projectFolder, FOLDERS.OBJECTS);
		const filesInObjectsFolder = this.fileSystemService.getFilesFromDirectory(pathToObjectsFolder);
		const foundXMLFiles = filesInObjectsFolder
			.filter(filename => filename.endsWith(XML_EXTENSION))
			.map(file => ({
				name: file.replace(this.projectFolder, '').slice(0, -XML_EXTENSION.length),
				value: path.basename(file, XML_EXTENSION),
			}));

		if (foundXMLFiles.length === 0) {
			throw NodeTranslationService.getMessage(COMMAND_UPDATE.ERRORS.NO_OBJECTS_IN_PROJECT);
		}

		let filteredObjects: any[];

		if (foundXMLFiles.length > MAX_ENTRIES_BEFORE_FILTER) {
			const filterAnswers = await prompt([
				{
					type: CommandUtils.INQUIRER_TYPES.LIST,
					name: ANSWERS_NAMES.FILTER_BY_SCRIPT_ID,
					message: NodeTranslationService.getMessage(COMMAND_UPDATE.QUESTIONS.FILTER_BY_SCRIPT_ID),
					default: false,
					choices: [
						{ name: NodeTranslationService.getMessage(YES), value: true },
						{ name: NodeTranslationService.getMessage(NO), value: false },
					],
				},
				{
					when: response => {
						return !!response.filterByScriptId;
					},
					type: CommandUtils.INQUIRER_TYPES.INPUT,
					name: ANSWERS_NAMES.SCRIPT_ID_FILTER,
					message: NodeTranslationService.getMessage(COMMAND_UPDATE.QUESTIONS.SCRIPT_ID_FILTER),
					validate: fieldValue => showValidationResults(fieldValue, validateScriptId),
				},
			]);
			filteredObjects = filterAnswers.filterByScriptId
				? foundXMLFiles.filter(element => (filterAnswers.scriptIdFilter && element.value.includes(filterAnswers.scriptIdFilter)))
				: foundXMLFiles;
			if (filteredObjects.length === 0) {
				throw NodeTranslationService.getMessage(COMMAND_UPDATE.MESSAGES.NO_OBJECTS_WITH_SCRIPT_ID_FILTER);
			}
		} else {
			filteredObjects = foundXMLFiles;
		}

		filteredObjects.push(new inquirer.Separator());

		const answers = await prompt([
			{
				when: foundXMLFiles.length > 1,
				type: CommandUtils.INQUIRER_TYPES.CHECKBOX,
				name: ANSWERS_NAMES.SCRIPT_ID_LIST,
				message: NodeTranslationService.getMessage(COMMAND_UPDATE.QUESTIONS.SCRIPT_ID),
				default: 1,
				choices: filteredObjects,
				validate: fieldValue => showValidationResults(fieldValue, validateArrayIsNotEmpty),
			},
			{
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: ANSWERS_NAMES.OVERWRITE_OBJECTS,
				message: NodeTranslationService.getMessage(COMMAND_UPDATE.QUESTIONS.OVERWRITE_OBJECTS),
				default: 0,
				choices: [
					{ name: NodeTranslationService.getMessage(YES), value: true },
					{ name: NodeTranslationService.getMessage(NO), value: false },
				],
			},
		]);

		return {
			overwriteObjects: answers.overwriteObjects,
			scriptid: [...new Set(answers.scriptid)].join(' '),
		};
	}

	public preExecuteAction(args: UpdateCommandAnswer) {
		return {
			...args,
			project: CommandUtils.quoteString(this.projectFolder),
		};
	}

	public async executeAction(args: UpdateCommandAnswer) {
		try {
			if (args.overwriteObjects !== undefined && !args.overwriteObjects) {
				throw NodeTranslationService.getMessage(COMMAND_UPDATE.MESSAGES.CANCEL_UPDATE);
			}
			const SDKParams = CommandUtils.extractCommandOptions(args, this.commandMetadata);

			const executionContextForUpdate = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				includeProjectDefaultAuthId: true,
				params: SDKParams,
			});

			const operationResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContextForUpdate),
				message: NodeTranslationService.getMessage(COMMAND_UPDATE.MESSAGES.UPDATING_OBJECTS),
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
};
