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
import * as NodeUtils from '../utils/NodeUtils';
import path from 'path';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import ActionResultUtils from '../utils/ActionResultUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import TranslationService from '../services/TranslationService';
import { ActionResult } from '../commands/actionresult/ActionResult';
import { COMMAND_UPLOADFILES, NO, YES} from '../services/TranslationKeys';
import * as ApplicationConstants from '../ApplicationConstants';
import { BaseCommandOptions } from '../../types/Metadata';

const COMMAND_OPTIONS = {
	PATHS: 'paths',
	PROJECT: 'project',
};

const COMMAND_ANSWERS = {
	SELECTED_FOLDER: 'selectedFolder',
	OVERWRITE_FILES: 'overwrite',
};

const UPLOAD_FILE_RESULT_STATUS = {
	SUCCESS: 'SUCCESS',
	ERROR: 'ERROR',
};

const { validateArrayIsNotEmpty, showValidationResults } = require('../validation/InteractiveAnswersValidator');

module.exports = class UploadFilesCommandGenerator extends BaseCommandGenerator<BaseCommandOptions, any> {
	private fileSystemService: FileSystemService;
	private localFileCabinetFolder: string;
	private fileCabinetService: FileCabinetService;

	constructor(options) {
		super(options);
		this.fileSystemService = new FileSystemService();
		this.localFileCabinetFolder = path.join(this.projectFolder, ApplicationConstants.FOLDERS.FILE_CABINET);
		this.fileCabinetService = new FileCabinetService(this.localFileCabinetFolder);
	}

	public async getCommandQuestions(prompt) {
		const selectFolderQuestion = this.generateSelectFolderQuestion();
		const selectFolderAnswer = await prompt(selectFolderQuestion);

		const selectFilesQuestion = this.generateSelectFilesQuestion(selectFolderAnswer.selectedFolder);
		const selectFilesAnswer = await prompt(selectFilesQuestion);

		const overwriteAnswer = await prompt([this.generateOverwriteQuestion()]);
		if (overwriteAnswer[COMMAND_ANSWERS.OVERWRITE_FILES] === false) {
			throw TranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.CANCEL_UPLOAD);
		}

		return selectFilesAnswer;
	}

	private generateSelectFolderQuestion() {
		const localFileCabinetSubFolders = this.fileCabinetService.getFileCabinetFoldersRecursively(this.localFileCabinetFolder);

		const transformFoldersToChoicesFunc = (folder: string) => {
			const name = this.fileCabinetService.getFileCabinetRelativePath(folder);

			let disabledMessage = '';
			if (!this.fileCabinetService.isUnrestrictedPath(name)) {
				disabledMessage = TranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.RESTRICTED_FOLDER);
			} else if (!this.fileSystemService.getFilesFromDirectory(folder).length) {
				disabledMessage = TranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.EMPTY_FOLDER);
			}

			return {
				name: name,
				value: folder,
				disabled: disabledMessage,
			};
		};

		const localFileCabinetFoldersChoices = localFileCabinetSubFolders.map(transformFoldersToChoicesFunc);

		if (!localFileCabinetFoldersChoices.some(choice => !choice.disabled)) {
			throw TranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.NOTHING_TO_UPLOAD);
		}

		return [
			{
				message: TranslationService.getMessage(COMMAND_UPLOADFILES.QUESTIONS.SELECT_FOLDER),
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
				message: TranslationService.getMessage(COMMAND_UPLOADFILES.QUESTIONS.SELECT_FILES),
				type: CommandUtils.INQUIRER_TYPES.CHECKBOX,
				name: COMMAND_OPTIONS.PATHS,
				choices: filesChoices,
				validate: fieldValue => showValidationResults(fieldValue, validateArrayIsNotEmpty),
			},
		];
	}

	private generateOverwriteQuestion() {
		return {
			type: CommandUtils.INQUIRER_TYPES.LIST,
			name: COMMAND_ANSWERS.OVERWRITE_FILES,
			message: TranslationService.getMessage(COMMAND_UPLOADFILES.QUESTIONS.OVERWRITE_FILES),
			default: 0,
			choices: [
				{ name: TranslationService.getMessage(YES), value: true },
				{ name: TranslationService.getMessage(NO), value: false },
			],
		};
	}

	public preExecuteAction(answers) {
		const { PROJECT, PATHS } = COMMAND_OPTIONS;
		answers[PROJECT] = CommandUtils.quoteString(this.projectFolder);
		if (answers.hasOwnProperty(PATHS)) {
			if (Array.isArray(answers[PATHS])) {
				answers[PATHS] = answers[PATHS].map(CommandUtils.quoteString).join(' ');
			} else {
				answers[PATHS] = CommandUtils.quoteString(answers[PATHS]);
			}
		}
		return answers;
	}

	public async executeAction(answers) {
		try {
			const executionContextUploadFiles = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				includeProjectDefaultAuthId: true,
				params: answers,
			});

			const operationResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContextUploadFiles),
				message: TranslationService.getMessage(COMMAND_UPLOADFILES.MESSAGES.UPLOADING_FILES),
			});
			return operationResult.status === SDKOperationResultUtils.SUCCESS
				? ActionResult.Builder.withData(operationResult.data)
						.withResultMessage(operationResult.resultMessage)
						.build()
				: ActionResult.Builder.withErrors(ActionResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return ActionResult.Builder.withErrors([error]).build();
		}
	}

	public formatOutput(actionResult) {
		const { data } = actionResult;

		if (actionResult.status === ActionResult.ERROR) {
			ActionResultUtils.logErrors(actionResult.errorMessages);
			return;
		}

		if (Array.isArray(data)) {
			const successfulUploads = data.filter(result => result.type === UPLOAD_FILE_RESULT_STATUS.SUCCESS);
			const unsuccessfulUploads = data.filter(result => result.type === UPLOAD_FILE_RESULT_STATUS.ERROR);
			if (successfulUploads && successfulUploads.length) {
				NodeUtils.println(TranslationService.getMessage(COMMAND_UPLOADFILES.OUTPUT.FILES_UPLOADED), NodeUtils.COLORS.RESULT);
				successfulUploads.forEach(result => {
					NodeUtils.println(this.fileCabinetService.getFileCabinetRelativePath(result.file.path), NodeUtils.COLORS.RESULT);
				});
			}
			if (unsuccessfulUploads && unsuccessfulUploads.length) {
				NodeUtils.println(TranslationService.getMessage(COMMAND_UPLOADFILES.OUTPUT.FILES_NOT_UPLOADED), NodeUtils.COLORS.WARNING);
				unsuccessfulUploads.forEach(result => {
					NodeUtils.println(
						`${this.fileCabinetService.getFileCabinetRelativePath(result.file.path)}: ${result.errorMessage}`,
						NodeUtils.COLORS.WARNING
					);
				});
			}
		}
	}
};
