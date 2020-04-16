/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import BaseCommandGenerator from './BaseCommandGenerator';
import * as CommandUtils from '../utils/CommandUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import { NodeTranslationService } from '../services/NodeTranslationService';
import { executeWithSpinner } from '../ui/CliSpinner';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import { COMMAND_LISTFILES } from '../services/TranslationKeys';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { ListFilesCommandAnswer } from '../../types/CommandAnswers';
import { Prompt } from '../../types/Prompt';
import ListFilesOutputFormatter from './outputFormatters/ListFilesOutputFormatter';
import { ActionResultBuilder } from './actionresult/ActionResult';

const LIST_FOLDERS_COMMAND = 'listfolders';
const SUITE_SCRIPTS_FOLDER = '/SuiteScripts';

export default class ListFilesCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, ListFilesCommandAnswer> {
	protected actionResultBuilder = new ActionResultBuilder();
	
	constructor(options: BaseCommandParameters) {
		super(options);
		this.outputFormatter = new ListFilesOutputFormatter(options.consoleLogger);
	}

	public async _getCommandQuestions(prompt: Prompt<ListFilesCommandAnswer>) {
		const executionContext = new SDKExecutionContext({
			command: LIST_FOLDERS_COMMAND,
			includeProjectDefaultAuthId: true
		});

		const operationResult = await executeWithSpinner({
			action: this.sdkExecutor.execute(executionContext),
			message: NodeTranslationService.getMessage(COMMAND_LISTFILES.LOADING_FOLDERS)
		});
		return await prompt([
			{
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: this.commandMetadata.options.folder.name,
				message: NodeTranslationService.getMessage(COMMAND_LISTFILES.SELECT_FOLDER),
				default: SUITE_SCRIPTS_FOLDER,
				choices: this.getFileCabinetFolders(operationResult)
			}
		]);
	};

	private getFileCabinetFolders(listFoldersResponse: {data: {path: string; isRestricted: boolean}[]}) {
		return listFoldersResponse.data.map(folder => {
			return {
				name: folder.path,
				value: folder.path,
				disabled: folder.isRestricted ? NodeTranslationService.getMessage(COMMAND_LISTFILES.RESTRICTED_FOLDER) : ''
			};
		});
	}

	public async executeAction(answers: ListFilesCommandAnswer) {
		try {
			// quote folder path to preserve spaces
			answers.folder = `\"${answers.folder}\"`;
			const executionContext = new SDKExecutionContext({
				command: this.commandMetadata.sdkCommand,
				params: answers,
				includeProjectDefaultAuthId: true,
			});

			const operationResult = await executeWithSpinner({
				action: this.sdkExecutor.execute(executionContext),
				message: NodeTranslationService.getMessage(COMMAND_LISTFILES.LOADING_FILES),
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
