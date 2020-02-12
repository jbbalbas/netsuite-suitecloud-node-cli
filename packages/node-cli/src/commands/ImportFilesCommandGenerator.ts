/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { ActionResult } from '../commands/actionresult/ActionResult';
import ActionResultUtils from '../utils/ActionResultUtils';
import BaseCommandGenerator from './BaseCommandGenerator';
import * as CommandUtils from '../utils/CommandUtils';
import NodeTranslationService from '../services/NodeTranslationService';
import { executeWithSpinner } from '../ui/CliSpinner';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import ProjectInfoService from '../services/ProjectInfoService';
import { PROJECT_SUITEAPP } from '../ApplicationConstants';
import { COMMAND_IMPORTFILES, NO, YES} from '../services/TranslationKeys';
import { validateArrayIsNotEmpty, showValidationResults} from '../validation/InteractiveAnswersValidator';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { ImportFilesCommandAnswer } from '../../types/CommandAnswers';
import { ImportFilesOperationResult } from '../../types/OperationResult';
import { Prompt } from '../../types/Prompt';
import ImportFilesOutputFormatter from './outputFormatters/ImportFilesOutputFormatter';

const SUITE_SCRIPTS_FOLDER = '/SuiteScripts';
const COMMAND_OPTIONS = {
	FOLDER: 'folder',
	PATHS: 'paths',
	EXCLUDE_PROPERTIES: 'excludeproperties',
	PROJECT: 'project',
};
const INTERMEDIATE_COMMANDS = {
	LISTFILES: 'listfiles',
	LISTFOLDERS: 'listfolders',
};
const COMMAND_ANSWERS = {
	OVERWRITE_FILES: 'overwrite',
};

const { validateArrayIsNotEmpty, showValidationResults } = require('../validation/InteractiveAnswersValidator');


export default class ImportFilesCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, ImportFilesCommandAnswer> {
	private projectInfoService: ProjectInfoService;

	constructor(options: BaseCommandParameters) {
		super(options);
		this.projectInfoService = new ProjectInfoService(this.projectFolder);
		this.outputFormatter = new ImportFilesOutputFormatter(options.consoleLogger);
	}

	public async getCommandQuestions(prompt: Prompt<ImportFilesCommandAnswer>) {
		if (this.projectInfoService.getProjectType() === PROJECT_SUITEAPP) {
			throw NodeTranslationService.getMessage(COMMAND_IMPORTFILES.ERRORS.IS_SUITEAPP);
		}

		const listFoldersResult = await this.listFolders();

		if (listFoldersResult.status === SDKOperationResultUtils.STATUS.ERROR) {
			throw SDKOperationResultUtils.collectErrorMessages(listFoldersResult);
		}

		const selectFolderQuestion = this.generateSelectFolderQuestion(listFoldersResult);
		const selectFolderAnswer = await prompt([selectFolderQuestion]);
		const listFilesResult = await this.listFiles(selectFolderAnswer);

		if (listFilesResult.status === SDKOperationResultUtils.STATUS.ERROR) {
			throw SDKOperationResultUtils.collectErrorMessages(listFilesResult);
		}
		if (Array.isArray(listFilesResult.data) && listFilesResult.data.length === 0) {
			throw SDKOperationResultUtils.getResultMessage(listFilesResult);
		}

		const selectFilesQuestions = this.generateSelectFilesQuestions(listFilesResult);
		const selectFilesAnswer = await prompt(selectFilesQuestions);

		const overwriteAnswer = await prompt([this.generateOverwriteQuestion()]);
		if (overwriteAnswer.overwrite === false) {
			throw NodeTranslationService.getMessage(COMMAND_IMPORTFILES.MESSAGES.CANCEL_IMPORT);
		}

		return selectFilesAnswer;
	}

	private listFolders() {
		const executionContext = new SDKExecutionContext({
			command: INTERMEDIATE_COMMANDS.LISTFOLDERS,
			includeProjectDefaultAuthId: true
		});

		return executeWithSpinner({
			action: this.sdkExecutor.execute(executionContext),
			message: NodeTranslationService.getMessage(COMMAND_IMPORTFILES.MESSAGES.LOADING_FOLDERS)
		});
	}

	private generateSelectFolderQuestion(listFoldersResult: {data: {path: string; isRestricted: boolean}[]}) {
		return {
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: COMMAND_OPTIONS.FOLDER,
			message: NodeTranslationService.getMessage(COMMAND_IMPORTFILES.QUESTIONS.SELECT_FOLDER),
			default: SUITE_SCRIPTS_FOLDER,
			choices: this.getFileCabinetFolders(listFoldersResult)
		};
	}

	private getFileCabinetFolders(listFoldersResponse: {data: {path: string; isRestricted: boolean}[]}) {
		return listFoldersResponse.data.map(folder => ({
			name: folder.path,
			value: folder.path,
			disabled: folder.isRestricted ? NodeTranslationService.getMessage(COMMAND_IMPORTFILES.MESSAGES.RESTRICTED_FOLDER): ''
		}));
	}

	private listFiles(selectFolderAnswer: ImportFilesCommandAnswer) {
		// quote folder path to preserve spaces
		selectFolderAnswer.folder = CommandUtils.quoteString(selectFolderAnswer.folder);
		const executionContext = new SDKExecutionContext({
			command: INTERMEDIATE_COMMANDS.LISTFILES,
			includeProjectDefaultAuthId: true,
			params: selectFolderAnswer
		});

		return executeWithSpinner({
			action: this.sdkExecutor.execute(executionContext),
			message: NodeTranslationService.getMessage(COMMAND_IMPORTFILES.MESSAGES.LOADING_FILES)
		});
	}

	private generateSelectFilesQuestions(listFilesResult: {data: {path: string; isRestricted: boolean}[]}) {
		return [
			{
				type: CommandUtils.INQUIRER_TYPES.CHECKBOX,
				name: COMMAND_OPTIONS.PATHS,
				message: NodeTranslationService.getMessage(COMMAND_IMPORTFILES.QUESTIONS.SELECT_FILES),
				choices: listFilesResult.data.map(path => ({ name: path, value: path })),
				validate: (fieldValue: string) => showValidationResults(fieldValue, validateArrayIsNotEmpty)
			},
			{
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND_OPTIONS.EXCLUDE_PROPERTIES,
				message: NodeTranslationService.getMessage(COMMAND_IMPORTFILES.QUESTIONS.EXCLUDE_PROPERTIES),
				choices: [
					{ name: NodeTranslationService.getMessage(YES), value: true },
					{ name: NodeTranslationService.getMessage(NO), value: false }
				]
			}
		];
	}

	private generateOverwriteQuestion() {
		return {
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: COMMAND_ANSWERS.OVERWRITE_FILES,
			message: NodeTranslationService.getMessage(COMMAND_IMPORTFILES.QUESTIONS.OVERWRITE_FILES),
			default: 0,
			choices: [
				{ name: NodeTranslationService.getMessage(YES), value: true },
				{ name: NodeTranslationService.getMessage(NO), value: false }
			]
		};
	}

	public preExecuteAction(answers: ImportFilesCommandAnswer) {
		answers.project = CommandUtils.quoteString(this.projectFolder);
		if (answers.paths && Array.isArray(answers.paths)) {
			answers.paths = answers.paths.map(CommandUtils.quoteString).join(' ');
		} else if (answers.paths) {
			answers.paths = CommandUtils.quoteString(answers.paths);
		}
		if (answers.excludeproperties) {
			answers.excludeproperties = '';
		} else {
			delete answers.excludeproperties;
		}
		return answers;
	}

	public async executeAction(answers: ImportFilesCommandAnswer) {
		try {
			if (this.projectInfoService.getProjectType() === PROJECT_SUITEAPP) {
				throw NodeTranslationService.getMessage(COMMAND_IMPORTFILES.ERRORS.IS_SUITEAPP);
			}

			const executionContextImportObjects = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				includeProjectDefaultAuthId: true,
				params: answers,
			});

			const operationResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContextImportObjects),
				message: NodeTranslationService.getMessage(COMMAND_IMPORTFILES.MESSAGES.IMPORTING_FILES),
			});

			return operationResult.status === SDKOperationResultUtils.STATUS.SUCCESS
				? ActionResult.Builder.withData(operationResult.data)
						.withResultMessage(operationResult.resultMessage)
						.build()
				: ActionResult.Builder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return ActionResult.Builder.withErrors([error]).build;
		}
	}
};
