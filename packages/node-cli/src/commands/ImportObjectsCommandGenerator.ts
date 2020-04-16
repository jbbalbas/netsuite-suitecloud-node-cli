/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import inquirer from 'inquirer';
import BaseCommandGenerator from './BaseCommandGenerator';
import * as CommandUtils from '../utils/CommandUtils';
import OBJECT_TYPES from '../metadata/ObjectTypesMetadata';
import ProjectInfoService from '../services/ProjectInfoService';
import { NodeTranslationService } from '../services/NodeTranslationService';
import FileSystemService from '../services/FileSystemService';
import { join } from 'path';
import CommandsMetadataService from '../core/CommandsMetadataService';
import { executeWithSpinner } from '../ui/CliSpinner';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import { PROJECT_SUITEAPP, PROJECT_ACP, FOLDERS } from '../ApplicationConstants';
import { COMMAND_IMPORTOBJECTS,ERRORS,YES,NO } from '../services/TranslationKeys';
import { validateArrayIsNotEmpty, validateScriptId, validateSuiteApp, showValidationResults } from '../validation/InteractiveAnswersValidator';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { ImportObjectsCommandAnswers } from '../../types/CommandAnswers';
import { ImportObjectsOperationResult, ListObjectsOperationResult } from '../../types/OperationResult';
import { Prompt, PromptParameters } from '../../types/Prompt';
import { InteractiveCommandInfo, NonInteractiveCommandInfo } from '../../types/Metadata';
import ImportObjectsOutputFormatter from './outputFormatters/ImportObjectsOutputFormatter';
import { ActionResultBuilder } from './actionresult/ActionResult';
import { lineBreak } from '../loggers/LoggerConstants';


const ANSWERS_NAMES = {
	APP_ID: 'appid',
	SCRIPT_ID: 'scriptid',
	SPECIFY_SCRIPT_ID: 'specifyscriptid',
	SPECIFY_SUITEAPP: 'specifysuiteapp',
	OBJECT_TYPE: 'type',
	SPECIFY_OBJECT_TYPE: 'specifyObjectType',
	TYPE_CHOICES_ARRAY: 'typeChoicesArray',
	DESTINATION_FOLDER: 'destinationfolder',
	PROJECT_FOLDER: 'project',
	OBJECTS_SELECTED: 'objects_selected',
	OVERWRITE_OBJECTS: 'overwrite_objects',
	IMPORT_REFERENCED_SUITESCRIPTS: 'import_referenced_suitescripts',
};

const COMMAND_FLAGS = {
	EXCLUDE_FILES: 'excludefiles',
};

const LIST_OBJECTS_COMMAND_NAME = 'object:list';

const CUSTOM_SCRIPT_PREFIX = 'customscript';

export default class ImportObjectsCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, ImportObjectsCommandAnswers> {
	private projectInfoService: ProjectInfoService;
	private listObjectsMetadata: InteractiveCommandInfo | NonInteractiveCommandInfo;
	private fileSystemService: FileSystemService;
	protected actionResultBuilder = new ActionResultBuilder();

	constructor(options: BaseCommandParameters) {
		super(options);
		this.projectInfoService = new ProjectInfoService(this.projectFolder);
		this.fileSystemService = new FileSystemService();
		const commandsMetadataService = new CommandsMetadataService();
		this.listObjectsMetadata = commandsMetadataService.getCommandMetadataByName(LIST_OBJECTS_COMMAND_NAME);
		this.outputFormatter = new ImportObjectsOutputFormatter(options.consoleLogger);
	}

	public async getCommandQuestions(prompt: Prompt<ImportObjectsCommandAnswers>) {
		const listObjectQuestions = this.generateListObjectQuestions();
		const listObjectAnswers = await prompt(listObjectQuestions);

		const paramsForListObjects = this.arrangeAnswersForListObjects(listObjectAnswers);
		const executionContextForListObjects = new SDKExecutionContext({
			command: this.listObjectsMetadata.sdkCommand,
			params: paramsForListObjects,
			includeProjectDefaultAuthId: true,
		});

		let listObjectsResult;
		try {
			listObjectsResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContextForListObjects),
				message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.MESSAGES.LOADING_OBJECTS),
			});
		} catch (error) {
			throw NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.ERRORS.CALLING_LIST_OBJECTS, lineBreak, error);
		}

		if (listObjectsResult.status === SDKOperationResultUtils.STATUS.ERROR) {
			throw SDKOperationResultUtils.collectErrorMessages(listObjectsResult);
		}
		const { data } = listObjectsResult;

		if (Array.isArray(data) && listObjectsResult.data.length === 0) {
			throw NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.MESSAGES.NO_OBJECTS_TO_LIST);
		}

		let selectionObjectAnswers;
		let answersAfterObjectSelection;
		let overwriteConfirmationAnswer;
		try {
			const selectionObjectQuestions = this.generateSelectionObjectQuestions(listObjectsResult);
			selectionObjectAnswers = await prompt(selectionObjectQuestions);

			const questionsAfterObjectSelection = this.generateQuestionsAfterObjectSelection(selectionObjectAnswers);
			answersAfterObjectSelection = await prompt(questionsAfterObjectSelection);

			const overwriteConfirmationQuestion = this.generateOverwriteConfirmationQuestion(answersAfterObjectSelection);
			overwriteConfirmationAnswer = await prompt(overwriteConfirmationQuestion);
		} catch (error) {
			throw NodeTranslationService.getMessage(ERRORS.PROMPTING_INTERACTIVE_QUESTIONS_FAILED, lineBreak, error);
		}

		const combinedAnswers = { ...listObjectAnswers, ...selectionObjectAnswers, ...answersAfterObjectSelection, ...overwriteConfirmationAnswer };
		return this.arrangeAnswersForImportObjects(combinedAnswers);
	}

	private generateListObjectQuestions() {
		const questions = [];
		if (this.projectInfoService.getProjectType() === PROJECT_SUITEAPP) {
			const specifySuiteApp = {
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: ANSWERS_NAMES.SPECIFY_SUITEAPP,
				message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.SPECIFIC_APPID),
				default: 0,
				choices: [
					{ name: NodeTranslationService.getMessage(YES), value: true },
					{ name: NodeTranslationService.getMessage(NO), value: false }
				],
				validate: (fieldValue: string) => showValidationResults(fieldValue, validateArrayIsNotEmpty)
			};
			questions.push(specifySuiteApp);

			const specifyAppId = {
				when: function(response: ImportObjectsCommandAnswers) {
					return response.specifysuiteapp;
				},
				type: CommandUtils.INQUIRER_TYPES.INPUT,
				name: ANSWERS_NAMES.APP_ID,
				message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.APPID),
				validate: (fieldValue: string) => showValidationResults(fieldValue, validateSuiteApp)
			};
			questions.push(specifyAppId);
		}

		const showAllObjects = {
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: ANSWERS_NAMES.SPECIFY_OBJECT_TYPE,
			message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.SHOW_ALL_CUSTOM_OBJECTS),
			default: 0,
			choices: [
				{ name: NodeTranslationService.getMessage(YES), value: false },
				{ name: NodeTranslationService.getMessage(NO), value: true }
			]
		};
		questions.push(showAllObjects);

		const selectObjectType = {
			when: function(answers: ImportObjectsCommandAnswers) {
				return answers.specifyObjectType;
			},
			type: CommandUtils.INQUIRER_TYPES.CHECKBOX,
			name: ANSWERS_NAMES.TYPE_CHOICES_ARRAY,
			message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.FILTER_BY_CUSTOM_OBJECTS),
			pageSize: 15,
			choices: [
				...OBJECT_TYPES.map(customObject => ({ name: customObject.name, value: customObject.value.type })),
				new inquirer.Separator()
			],
			validate: (fieldValue: string) => showValidationResults(fieldValue, validateArrayIsNotEmpty)
		};
		questions.push(selectObjectType);

		const filterByScriptId = {
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: ANSWERS_NAMES.SPECIFY_SCRIPT_ID,
			message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.FILTER_BY_SCRIPT_ID),
			default: false,
			choices: [
				{ name: NodeTranslationService.getMessage(YES), value: true },
				{ name: NodeTranslationService.getMessage(NO), value: false }
			]
		};
		questions.push(filterByScriptId);

		const specifyScriptId = {
			when: (response: ImportObjectsCommandAnswers) =>  response.specifyscriptid,
			type: CommandUtils.INQUIRER_TYPES.INPUT,
			name: ANSWERS_NAMES.SCRIPT_ID,
			message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.SCRIPT_ID),
			validate: (fieldValue: string) => showValidationResults(fieldValue, validateScriptId)
		};
		questions.push(specifyScriptId);

		return questions;
	}

	private generateSelectionObjectQuestions(operationResult: ListObjectsOperationResult) {
		const questions = [];
		const { data } = operationResult;

		const choicesToShow = data.map(object => ({
			name: object.type + ':' + object.scriptId,
			value: object
		}));

		const questionListObjectsSelection: PromptParameters<ImportObjectsCommandAnswers> = {
			type: CommandUtils.INQUIRER_TYPES.CHECKBOX,
			name: ANSWERS_NAMES.OBJECTS_SELECTED,
			message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.SELECT_OBJECTS),
			choices: choicesToShow,
			validate: fieldValue => showValidationResults(fieldValue, validateArrayIsNotEmpty)
		};
		questions.push(questionListObjectsSelection);
		return questions;
	}

	private generateQuestionsAfterObjectSelection(selectionObjectAnswers: ImportObjectsCommandAnswers) {
		const questions = [];

		const hasCustomScript = selectionObjectAnswers.objects_selected.some((element) => element.scriptId.startsWith(CUSTOM_SCRIPT_PREFIX));
		if (this.projectInfoService.getProjectType() === PROJECT_ACP && hasCustomScript) {
			const questionImportReferencedSuiteScripts = {
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: ANSWERS_NAMES.IMPORT_REFERENCED_SUITESCRIPTS,
				message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.IMPORT_REFERENCED_SUITESCRIPTS),
				default: 0,
				choices: [
					{ name: NodeTranslationService.getMessage(YES), value: true },
					{ name: NodeTranslationService.getMessage(NO), value: false }
				]
			};
			questions.push(questionImportReferencedSuiteScripts);
		}

		// extracting root prefix
		// replacing '\' for '/', this is done because destinationfolder option in java-sdf works only with '/'
		// sourroundig "" to the folder string so it will handle blank spaces case
		const transformFoldersToChoicesFunc = (folder: string) => ({
			name: folder.replace(this.projectFolder, ''),
			value: `\"${folder.replace(this.projectFolder, '').replace(/\\/g, '/')}\"`
		});
		const objectDirectoryChoices = this.fileSystemService.getFoldersFromDirectory(join(this.projectFolder, FOLDERS.OBJECTS))
			.map(transformFoldersToChoicesFunc);

		const questionDestinationFolder = {
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: ANSWERS_NAMES.DESTINATION_FOLDER,
			message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.QUESTIONS.DESTINATION_FOLDER),
			choices: objectDirectoryChoices
		};
		questions.push(questionDestinationFolder);
		return questions;
	}

	private generateOverwriteConfirmationQuestion(answersAfterObjectSelection: ImportObjectsCommandAnswers) {
		const questions = [];

		let overwriteConfirmationMessageKey;
		if (
			answersAfterObjectSelection.import_referenced_suitescripts !== undefined &&
			answersAfterObjectSelection.import_referenced_suitescripts
		) {
			overwriteConfirmationMessageKey = COMMAND_IMPORTOBJECTS.QUESTIONS.OVERWRITE_OBJECTS_AND_FILES;
		} else {
			overwriteConfirmationMessageKey = COMMAND_IMPORTOBJECTS.QUESTIONS.OVERWRITE_OBJECTS;
		}

		const questionOverwriteConfirmation = {
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: ANSWERS_NAMES.OVERWRITE_OBJECTS,
			message: NodeTranslationService.getMessage(overwriteConfirmationMessageKey),
			default: 0,
			choices: [
				{ name: NodeTranslationService.getMessage(YES), value: true },
				{ name: NodeTranslationService.getMessage(NO), value: false }
			]
		};
		questions.push(questionOverwriteConfirmation);
		return questions;
	}

	private arrangeAnswersForListObjects(answers: ImportObjectsCommandAnswers) {
		if (answers.specifyObjectType) {
			answers.type = answers.typeChoicesArray.join(' ');
		}
		return CommandUtils.extractCommandOptions(answers, this.listObjectsMetadata);
	}

	private arrangeAnswersForImportObjects(answers: ImportObjectsCommandAnswers) {
		if (!answers.specifyObjectType) {
			answers.type = 'ALL';
		} else if (answers.typeChoicesArray.length > 1) {
			answers.type = 'ALL';
		}
		answers.scriptid = answers.objects_selected.map(el => el.scriptId).join(' ');
		return answers;
	}

	public preExecuteAction(answers: ImportObjectsCommandAnswers) {
		answers.project = CommandUtils.quoteString(this.projectFolder);
		return answers;
	}

	public async executeAction(answers: ImportObjectsCommandAnswers) {
		if (answers.overwrite_objects === false) {
			throw NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.MESSAGES.CANCEL_IMPORT);
		}

		try {
			const flags = [];
			if (this.runInInteractiveMode) {
				if (answers.import_referenced_suitescripts !== undefined && !answers.import_referenced_suitescripts) {
					flags.push(COMMAND_FLAGS.EXCLUDE_FILES);
					delete answers.import_referenced_suitescripts;
				}
			} else {
				if (answers.excludefiles) {
					flags.push(COMMAND_FLAGS.EXCLUDE_FILES);
					delete answers.excludefiles;
				}
			}

			const params = CommandUtils.extractCommandOptions(answers, this.commandMetadata);
			const executionContextForImportObjects = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				params,
				flags,
				includeProjectDefaultAuthId: true
			});

			const operationResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContextForImportObjects),
				message: NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.MESSAGES.IMPORTING_OBJECTS),
			});

			return operationResult.status === SDKOperationResultUtils.STATUS.SUCCESS
				? this.actionResultBuilder.withData(operationResult.data).withResultMessage(operationResult.resultMessage).build()
				: this.actionResultBuilder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return this.actionResultBuilder.withErrors([error]).build();
		}
	}
};
