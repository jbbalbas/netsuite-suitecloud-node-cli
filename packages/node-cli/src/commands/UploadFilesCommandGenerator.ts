/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import BaseCommandGenerator from './BaseCommandGenerator';
import * as CommandUtils from '../utils/CommandUtils';
import { executeWithSpinner } from '../ui/CliSpinner';
import FileCabinetService from '../services/FileCabinetService';
import FileSystemService from '../services/FileSystemService';
import path from 'path';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import UploadFilesOutputFormatter from './outputFormatters/UploadFilesOutputFormatter';
import SDKExecutionContext from '../SDKExecutionContext';
import { NodeTranslationService } from '../services/NodeTranslationService';
import { ActionResultBuilder } from '../commands/actionresult/ActionResult';
import { COMMAND_UPLOADFILES, YES, NO } from '../services/TranslationKeys';
import { FOLDERS } from '../ApplicationConstants';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { UploadFilesCommandAnswer } from '../../types/CommandAnswers';
import { Prompt } from '../../types/Prompt';

const COMMAND_OPTIONS = {
	PATHS: 'paths',
	PROJECT: 'project',
};

const COMMAND_ANSWERS = {
	SELECTED_FOLDER: 'selectedFolder',
	OVERWRITE_FILES: 'overwrite',
};

import { validateArrayIsNotEmpty, showValidationResults } from '../validation/InteractiveAnswersValidator';

export default class UploadFilesCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, UploadFilesCommandAnswer> {

	private fileSystemService: FileSystemService;
	private localFileCabinetFolder: string;
	private fileCabinetService: FileCabinetService;
	protected actionResultBuilder = new ActionResultBuilder();

	constructor(options: BaseCommandParameters) {
		super(options);
		this.fileSystemService = new FileSystemService();
		this.localFileCabinetFolder = path.join(this.projectFolder, FOLDERS.FILE_CABINET);
		this.fileCabinetService = new FileCabinetService(this.localFileCabinetFolder);
		this.outputFormatter = new UploadFilesOutputFormatter(options.consoleLogger);
	}

	public async getCommandQuestions(prompt: Prompt<UploadFilesCommandAnswer>) {
		const selectFolderQuestion = this.generateSelectFolderQuestion();
		const selectFolderAnswer = await prompt(selectFolderQuestion);

		const selectFilesQuestion = this.generateSelectFilesQuestion(selectFolderAnswer.selectedFolder);
		const selectFilesAnswer = await prompt(selectFilesQuestion);

		const overwriteAnswer = await prompt([this.generateOverwriteQuestion()]);
		if (overwriteAnswer.overwrite === false) {
			throw NodeTranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.CANCEL_UPLOAD);
		}

		return selectFilesAnswer;
	}

	private generateSelectFolderQuestion() {
		const localFileCabinetSubFolders = this.fileCabinetService.getFileCabinetFolders();

		const transformFoldersToChoicesFunc = (folder: string) => {
			const name = this.fileCabinetService.getFileCabinetRelativePath(folder);

			let disabledMessage = '';
			if (!this.fileCabinetService.isUnrestrictedPath(name)) {
				disabledMessage = NodeTranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.RESTRICTED_FOLDER);
			} else if (!this.fileSystemService.getFilesFromDirectory(folder).length) {
				disabledMessage = NodeTranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.EMPTY_FOLDER);
			}

			return {
				name: name,
				value: folder,
				disabled: disabledMessage,
			};
		};

		const localFileCabinetFoldersChoices = localFileCabinetSubFolders.map(transformFoldersToChoicesFunc);

		if (!localFileCabinetFoldersChoices.some(choice => !choice.disabled)) {
			throw NodeTranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.NOTHING_TO_UPLOAD);
		}

		return [
			{
				message: NodeTranslationService.getMessage(COMMAND_UPLOADFILES.QUESTIONS.SELECT_FOLDER),
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND_ANSWERS.SELECTED_FOLDER,
				choices: localFileCabinetFoldersChoices,
			},
		];
	}

	private generateSelectFilesQuestion(selectedFolder: string) {
		const files = this.fileSystemService.getFilesFromDirectory(selectedFolder);

		const transformFilesToChoicesFunc = (file: string) => {
			const path = this.fileCabinetService.getFileCabinetRelativePath(file);
			return { name: path, value: path };
		};
		const filesChoices = files.map(transformFilesToChoicesFunc);

		return [
			{
				message: NodeTranslationService.getMessage(COMMAND_UPLOADFILES.QUESTIONS.SELECT_FILES),
				type: CommandUtils.INQUIRER_TYPES.CHECKBOX,
				name: COMMAND_OPTIONS.PATHS,
				choices: filesChoices,
				validate: (fieldValue: string) => showValidationResults(fieldValue, validateArrayIsNotEmpty),
			},
		];
	}

	private generateOverwriteQuestion() {
		return {
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: COMMAND_ANSWERS.OVERWRITE_FILES,
			message: NodeTranslationService.getMessage(COMMAND_UPLOADFILES.QUESTIONS.OVERWRITE_FILES),
			default: 0,
			choices: [
				{ name: NodeTranslationService.getMessage(YES), value: true },
				{ name: NodeTranslationService.getMessage(NO), value: false },
			],
		};
	}

	public preExecuteAction(answers: UploadFilesCommandAnswer) {
		answers.project = CommandUtils.quoteString(this.projectFolder);
		if (answers.hasOwnProperty('paths')) {
			if (Array.isArray(answers.paths)) {
				answers.paths = answers.paths.map(CommandUtils.quoteString).join(' ');
			} else {
				answers.paths = CommandUtils.quoteString(answers.paths);
			}
		}
		return answers;
	}

	public async executeAction(answers: UploadFilesCommandAnswer) {
		try {
			const executionContextUploadFiles = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				includeProjectDefaultAuthId: true,
				params: answers,
			});

			const operationResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContextUploadFiles),
				message: NodeTranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.UPLOADING_FILES),
			});
			return operationResult.status === SDKOperationResultUtils.STATUS.SUCCESS
				? this.actionResultBuilder.withData(operationResult.data)
						.withResultMessage(operationResult.resultMessage)
						.withProjectFolder(this.projectFolder)
						.build()
				: this.actionResultBuilder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return this.actionResultBuilder.withErrors([error]).build();
		}
	}
};
