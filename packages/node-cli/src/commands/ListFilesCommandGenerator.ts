/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { ActionResult } from '../commands/actionresult/ActionResult';
import BaseCommandGenerator from './BaseCommandGenerator';

import BaseCommandGenerator from './BaseCommandGenerator';
import * as CommandUtils from '../utils/CommandUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import NodeTranslationService from '../services/NodeTranslationService';
import { executeWithSpinner } from '../ui/CliSpinner';
import * as NodeUtils from '../utils/NodeUtils';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import { COMMAND_LISTFILES } from '../services/TranslationKeys';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { ListFilesCommandAnswer } from '../../types/CommandAnswers';
import { ListFilesOperationResult } from '../../types/OperationResult';
import { Prompt } from '../../types/Prompt';
import ListFilesOutputFormatter from './outputFormatters/ListFilesOutputFormatter';

const LIST_FOLDERS_COMMAND = 'listfolders';
const SUITE_SCRIPTS_FOLDER = '/SuiteScripts';

export default class ListFilesCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, ListFilesCommandAnswer> {
	constructor(options: BaseCommandParameters) {
		super(options);
		this._outputFormatter = new ListFilesOutputFormatter(options.consoleLogger);
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
				message: TranslationService.getMessage(COMMAND_LISTFILES.SELECT_FOLDER),
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
				? ActionResult.Builder.withData(operationResult.data)
						.withResultMessage(operationResult.resultMessage)
						.build()
				: ActionResult.Builder.withErrors(SDKOperationResultUtils.collectErrorMessages(operationResult)).build();
		} catch (error) {
			return ActionResult.Builder.withErrors([error]).build();
		}
	}
};
