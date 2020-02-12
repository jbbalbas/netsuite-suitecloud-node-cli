/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import BaseCommandGenerator from './BaseCommandGenerator';
import OBJECT_TYPES from '../metadata/ObjectTypesMetadata';
import FileSystemService from '../services/FileSystemService';
import TemplateKeys from '../templates/TemplateKeys';
import chalk from 'chalk';
import { join } from 'path';
import { FOLDERS } from '../ApplicationConstants';
import { CreateObjectCommandAnswer } from '../../types/CommandAnswers';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { Prompt } from '../../types/Prompt';

export default class CreateObjectCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, CreateObjectCommandAnswer> {

	private fileSystemService: FileSystemService;

	constructor(options: BaseCommandParameters) {
		super(options);
		this.fileSystemService = new FileSystemService();
	}

	public async getCommandQuestions(prompt: Prompt<CreateObjectCommandAnswer>) {
		const transformFoldersToChoicesFunc = (folder: string) => {
			return { name: folder.replace(this.projectFolder, ''), value: folder };
		};
		const objectDirectoryChoices = this.fileSystemService.getFoldersFromDirectory(join(this.projectFolder, FOLDERS.OBJECTS))
			.map(transformFoldersToChoicesFunc);

		return await prompt([
			{
				type: 'list',
				name: 'type',
				message: 'What object type would you like to create?',
				choices: OBJECT_TYPES,
			},
			{
				type: 'input',
				name: 'objectfilename',
				message: answers => {
					return `Please specify the filename for the ${chalk.green.bold(answers.type.name)} object`;
				},
				transformer: (input, answers) => {
					return `${answers.type.prefix}${input}.xml`;
				},
			},
			{
				type: 'list',
				name: 'folder',
				message: answers => {
					return `Where would you like to store the ${chalk.green.bold(answers.type.prefix + answers.objectfilename + '.xml')} file?`;
				},
				choices: objectDirectoryChoices,
			},
			{
				type: 'confirm',
				name: 'createrelatedfiles',
				message: 'Would you like to also create associated files with this object?',
				when: answers => {
					return answers.type.hasRelatedFiles;
				},
			},
		]).then(async mainAnswers => {
			if (mainAnswers.createrelatedfiles) {
				const fileCabinetDirectoryChoices = this.fileSystemService.getFoldersFromDirectory(join(this.projectFolder, FOLDERS.FILE_CABINET))
					.map(transformFoldersToChoicesFunc);

				return await prompt([
					{
						type: 'input',
						name: 'relatedfilename',
						message: 'Please specify the script filename',
						transformer: (input, answers, flags) => {
							return `${input}.js`;
						},
					},
					{
						type: 'list',
						name: 'relatedfiledestinationfolder',
						message: answers => {
							return `Where would you like to store the ${chalk.green.bold(answers.relatedfilename)}.js file?`;
						},
						choices: fileCabinetDirectoryChoices,
					},
				]).then(answers => {
					return { ...answers, ...mainAnswers };
				});
			}

			return mainAnswers;
		});
	}

	public executeAction(answers: CreateObjectCommandAnswer) {
		const createFilePromise = this.fileSystemService.createFileFromTemplate({
			template: TemplateKeys.SCRIPTS['blankscript'],
			destinationFolder: answers.relatedfiledestinationfolder,
			fileName: answers.relatedfilename,
			fileExtension: 'js',
		});
		const createObjectPromise = this.fileSystemService.createFileFromTemplate({
			template: TemplateKeys.OBJECTS['commerceextension'],
			destinationFolder: answers.folder,
			fileName: answers.objectfilename,
			fileExtension: 'xml',
			bindings: [{ id: 'scriptid', value: answers.type.prefix + answers.objectfilename }],
		});
		return Promise.all([createFilePromise, createObjectPromise]).then(() => {
			console.log(`${answers.objectfilename} & ${answers.relatedfilename} were created successfully.`);
		});
	}
};
