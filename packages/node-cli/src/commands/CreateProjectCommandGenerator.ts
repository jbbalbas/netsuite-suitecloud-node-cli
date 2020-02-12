/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import CreateProjectActionResult from './actionresult/CreateProjectActionResult';

import BaseCommandGenerator from './BaseCommandGenerator';
import TemplateKeys from '../templates/TemplateKeys';
import FileSystemService from '../services/FileSystemService';
import * as CommandUtils from '../utils/CommandUtils';
import TranslationService from '../services/TranslationService';
import * as SDKOperationResultUtils from '../utils/SDKOperationResultUtils';
import * as NodeUtils from '../utils/NodeUtils';
import SDKExecutionContext from '../SDKExecutionContext';
import * as ApplicationConstants from '../ApplicationConstants';
import * as NpmInstallRunner from '../services/NpmInstallRunner';
import { COMMAND_CREATEPROJECT, YES, NO } from '../services/TranslationKeys';
import path from 'path';
import { CreateProjectCommandAnswer } from '../../types/CommandAnswers';
import { OperationResult, CreateProjectOperationResult } from '../../types/OperationResult';
import { BaseCommandParameters } from '../../types/CommandOptions';
const QUESTIONS = COMMAND_CREATEPROJECT.QUESTIONS;
const MESSAGES = COMMAND_CREATEPROJECT.MESSAGES;

const ACP_PROJECT_TYPE_DISPLAY = 'Account Customization Project';
const SUITEAPP_PROJECT_TYPE_DISPLAY = 'SuiteApp';
const DEFAULT_PROJECT_VERSION = '1.0.0';
const JEST_CONFIG_FILENAME = 'jest.config.js';
const JEST_CONFIG_PROJECT_TYPE_ACP = 'SuiteCloudJestConfiguration.ProjectType.ACP';
const JEST_CONFIG_PROJECT_TYPE_SUITEAPP = 'SuiteCloudJestConfiguration.ProjectType.SUITEAPP';
const JEST_CONFIG_REPLACE_STRING_PROJECT_TYPE = '{{projectType}}';
const PACKAGE_JSON_FILENAME = 'package.json';
const PACKAGE_JSON_DEFAULT_VERSION = '1.0.0';
const PACKAGE_JSON_REPLACE_STRING_VERSION = '{{version}}';

const SOURCE_FOLDER = 'src';
const UNIT_TEST_TEST_FOLDER = '__tests__';

const CLI_CONFIG_TEMPLATE_KEY = 'cliconfig';
const CLI_CONFIG_FILENAME = 'suitecloud.config';
const CLI_CONFIG_EXTENSION = 'js';
const UNIT_TEST_CLI_CONFIG_TEMPLATE_KEY = 'cliconfig';
const UNIT_TEST_CLI_CONFIG_FILENAME = 'suitecloud.config';
const UNIT_TEST_CLI_CONFIG_EXTENSION = 'js';
const UNIT_TEST_PACKAGE_TEMPLATE_KEY = 'packagejson';
const UNIT_TEST_PACKAGE_FILENAME = 'package';
const UNIT_TEST_PACKAGE_EXTENSION = 'json';
const UNIT_TEST_JEST_CONFIG_TEMPLATE_KEY = 'jestconfig';
const UNIT_TEST_JEST_CONFIG_FILENAME = 'jest.config';
const UNIT_TEST_JEST_CONFIG_EXTENSION = 'js';
const UNIT_TEST_SAMPLE_TEST_KEY = 'sampletest';
const UNIT_TEST_SAMPLE_TEST_FILENAME = 'sample-test';
const UNIT_TEST_SAMPLE_TEST_EXTENSION = 'js';

const COMMAND_OPTIONS = {
	OVERWRITE: 'overwrite',
	PARENT_DIRECTORY: 'parentdirectory',
	PROJECT_ID: 'projectid',
	PROJECT_NAME: 'projectname',
	PROJECT_VERSION: 'projectversion',
	PUBLISHER_ID: 'publisherid',
	TYPE: 'type',
	INCLUDE_UNIT_TESTING: 'includeunittesting',
};

import {
	validateFieldIsNotEmpty,
	showValidationResults,
	validateFieldHasNoSpaces,
	validateFieldIsLowerCase,
	validatePublisherId,
	validateProjectVersion,
	validateXMLCharacters,
	validateNotUndefined,
	validateProjectType,
	validateFolder
} from '../validation/InteractiveAnswersValidator';

import { throwValidationException } from '../utils/ExceptionUtils';
import { Prompt } from '../../types/Prompt';

export default class CreateProjectCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, CreateProjectCommandAnswer> {

	private fileSystemService: FileSystemService;

	constructor(options: BaseCommandParameters) {
		super(options);
		this.fileSystemService = new FileSystemService();
		this.outputFormatter = new CreateProjectOutputFormatter(options.consoleLogger);
	}

	public async getCommandQuestions(prompt: Prompt<CreateProjectCommandAnswer>) {
		const answers = await prompt([
			{
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND_OPTIONS.TYPE,
				message: NodeTranslationService.getMessage(QUESTIONS.CHOOSE_PROJECT_TYPE),
				default: 0,
				choices: [
					{ name: ACP_PROJECT_TYPE_DISPLAY, value: ApplicationConstants.PROJECT_ACP },
					{ name: SUITEAPP_PROJECT_TYPE_DISPLAY, value: ApplicationConstants.PROJECT_SUITEAPP }
				]
			},
			{
				type: CommandUtils.INQUIRER_TYPES.INPUT,
				name: COMMAND_OPTIONS.PROJECT_NAME,
				message: NodeTranslationService.getMessage(QUESTIONS.ENTER_PROJECT_NAME),
				filter: fieldValue => fieldValue.trim(),
				validate: fieldValue => showValidationResults( fieldValue, validateFieldIsNotEmpty, validateFolder)
			},
			{
				when: response => response.type === ApplicationConstants.PROJECT_SUITEAPP,
				type: CommandUtils.INQUIRER_TYPES.INPUT,
				name: COMMAND_OPTIONS.PUBLISHER_ID,
				message: NodeTranslationService.getMessage(QUESTIONS.ENTER_PUBLISHER_ID),
				validate: fieldValue => showValidationResults(fieldValue, validatePublisherId)
			},
			{
				when: response => response.type === ApplicationConstants.PROJECT_SUITEAPP,
				type: CommandUtils.INQUIRER_TYPES.INPUT,
				name: COMMAND_OPTIONS.PROJECT_ID,
				message: NodeTranslationService.getMessage(QUESTIONS.ENTER_PROJECT_ID),
				validate: fieldValue => showValidationResults(
						fieldValue,
						validateFieldIsNotEmpty,
						validateFieldHasNoSpaces,
						fieldValue => validateFieldIsLowerCase(COMMAND_OPTIONS.PROJECT_ID, fieldValue)
					)
			},
			{
				when: response => response.type === ApplicationConstants.PROJECT_SUITEAPP,
				type: CommandUtils.INQUIRER_TYPES.INPUT,
				name: COMMAND_OPTIONS.PROJECT_VERSION,
				message: NodeTranslationService.getMessage(QUESTIONS.ENTER_PROJECT_VERSION),
				default: DEFAULT_PROJECT_VERSION,
				validate: (fieldValue: string) => showValidationResults(fieldValue, validateProjectVersion),
			},
			{
				type: CommandUtils.INQUIRER_TYPES.LIST,
				name: COMMAND_OPTIONS.INCLUDE_UNIT_TESTING,
				message: NodeTranslationService.getMessage(QUESTIONS.INCLUDE_UNIT_TESTING),
				default: 0,
				choices: [
					{ name: NodeTranslationService.getMessage(YES), value: true },
					{ name: NodeTranslationService.getMessage(NO), value: false }
				]
			},
		]);

		const projectFolderName = this.getProjectFolderName(answers);
		const projectAbsolutePath = path.join(this.executionPath, projectFolderName);

		if (this.fileSystemService.folderExists(projectAbsolutePath) && !this.fileSystemService.isFolderEmpty(projectAbsolutePath)) {
			const overwriteAnswer = await prompt([
				{
					type: CommandUtils.INQUIRER_TYPES.LIST,
					name: COMMAND_OPTIONS.OVERWRITE,
					message: NodeTranslationService.getMessage(QUESTIONS.OVERWRITE_PROJECT, projectAbsolutePath),
					default: 0,
					choices: [
						{ name: NodeTranslationService.getMessage(NO), value: false },
						{ name: NodeTranslationService.getMessage(YES), value: true },
					],
				},
			]);
			answers.overwrite = overwriteAnswer.overwrite;
			if (!overwriteAnswer.overwrite) {
				throw NodeTranslationService.getMessage(MESSAGES.PROJECT_CREATION_CANCELED);
			}
		}
		return answers;
	}

	private getProjectFolderName(answers: CreateProjectCommandAnswer) {
		return answers.type === ApplicationConstants.PROJECT_SUITEAPP
			? answers.publisherid + '.' + answers.projectid
			: answers.projectname;
	}

	public preExecuteAction(answers: CreateProjectCommandAnswer) {
		const projectFolderName = this.getProjectFolderName(answers);
		if (projectFolderName) {
			answers.parentdirectory = path.join(
				this.executionPath,
				projectFolderName
			);
			answers.projectfoldername = projectFolderName;
		} else {
			// parentdirectory is a mandatory option in javaCLI but it must be computed in the nodeCLI
			answers.parentdirectory = 'not_specified';
		}

		return answers;
	}

	public async executeAction(answers: CreateProjectCommandAnswer) {
		try {
			const projectFolderName = answers.projectfoldername;
			const projectAbsolutePath = answers.parentdirectory;
			const manifestFilePath = path.join(projectAbsolutePath, SOURCE_FOLDER, ApplicationConstants.FILES.MANIFEST_XML);

			const validationErrors = this.validateParams(answers);

			if (validationErrors.length > 0) {
				throwValidationException(validationErrors, false, this.commandMetadata);
			}

			const projectType = answers.type;

			const params = {
				//Enclose in double quotes to also support project names with spaces
				parentdirectory: CommandUtils.quoteString(projectAbsolutePath),
				type: projectType,
				projectname: SOURCE_FOLDER,
				...(answers[COMMAND_OPTIONS.OVERWRITE] && { overwrite: '' }),
				...(projectType === ApplicationConstants.PROJECT_SUITEAPP && {
					publisherid: answers[COMMAND_OPTIONS.PUBLISHER_ID],
					projectid: answers[COMMAND_OPTIONS.PROJECT_ID],
					projectversion: answers[COMMAND_OPTIONS.PROJECT_VERSION],
				}),
			};

			this.fileSystemService.createFolder(this.executionPath, projectFolderName);

			const createProjectAction = new Promise(this.createProject(params, answers, projectAbsolutePath, projectFolderName, manifestFilePath));

			const createProjectActionData = await createProjectAction;

			var projectName = answers[COMMAND_OPTIONS.PROJECT_NAME];
			var includeUnitTesting = answers[COMMAND_OPTIONS.INCLUDE_UNIT_TESTING];

			return createProjectActionData.operationResult.status === SDKOperationResultUtils.STATUS.SUCCESS
				? CreateProjectActionResult.Builder.withData(createProjectActionData.operationResult.data)
						.withResultMessage(createProjectActionData.operationResult.resultMessage)
						.withProjectType(projectType)
						.withProjectName(projectName)
						.withProjectDirectory(createProjectActionData.projectDirectory)
						.withUnitTesting(includeUnitTesting)
						.withNpmPackageInitialized(createProjectActionData.npmInstallSuccess)
						.build()
				: CreateProjectActionResult.Builder.withErrors(
						SDKOperationResultUtils.collectErrorMessages(createProjectActionData.operationResult)
				  ).build();
		} catch (error) {
			return CreateProjectActionResult.Builder.withErrors([unwrapExceptionMessage(error)]).build();
		}
	}

	createProject(params, answers, projectAbsolutePath, projectFolderName, manifestFilePath) {
		return async (resolve, reject) => {
			try {
				this.consoleLogger.info(NodeTranslationService.getMessage(MESSAGES.CREATING_PROJECT_STRUCTURE));
				if (answers[COMMAND_OPTIONS.OVERWRITE]) {
					this.fileSystemService.emptyFolderRecursive(projectAbsolutePath);
				}
				const executionContextCreateProject = new SDKExecutionContext({
					command: this.commandMetadata.sdkCommand,
					params: params,
				});

				const operationResult: OperationResult = await this.sdkExecutor.execute(executionContextCreateProject);

				if (operationResult.status === SDKOperationResultUtils.STATUS.ERROR) {
					resolve({
						operationResult: operationResult,
						projectType: answers.type,
						projectDirectory: projectAbsolutePath,
					});
					return;
				}
				if (answers.type === ApplicationConstants.PROJECT_SUITEAPP) {
					const oldPath = path.join(projectAbsolutePath, projectFolderName);
					const newPath = path.join(projectAbsolutePath, SOURCE_FOLDER);
					this.fileSystemService.deleteFolderRecursive(newPath);
					this.fileSystemService.renameFolder(oldPath, newPath);
				}
				this.fileSystemService.replaceStringInFile(manifestFilePath, SOURCE_FOLDER, answers.projectname);
				let npmInstallSuccess;
				if (answers.includeunittesting) {
					this.consoleLogger.info(NodeTranslationService.getMessage(MESSAGES.SETUP_TEST_ENV));
					await this.createUnitTestFiles(
						answers.type,
						answers.projectname,
						answers.projectversion,
						projectAbsolutePath
					);

					this.consoleLogger.info(NodeTranslationService.getMessage(MESSAGES.INIT_NPM_DEPENDENCIES));
					npmInstallSuccess = await this.runNpmInstall(projectAbsolutePath);
				} else {
					await this.fileSystemService.createFileFromTemplate({
						template: TemplateKeys.PROJECTCONFIGS[CLI_CONFIG_TEMPLATE_KEY],
						destinationFolder: projectAbsolutePath,
						fileName: CLI_CONFIG_FILENAME,
						fileExtension: CLI_CONFIG_EXTENSION,
					});
				}
				return resolve({
					operationResult: operationResult,
					projectDirectory: projectAbsolutePath,
					npmInstallSuccess: npmInstallSuccess,
				});
			} catch (error) {
				this.fileSystemService.deleteFolderRecursive(path.join(this.executionPath, projectFolderName));
				reject(error);
			}
		};
	}

	private async createUnitTestFiles(type: string, projectName: string, projectVersion: string, projectAbsolutePath: string) {
		await this.createUnitTestCliConfigFile(projectAbsolutePath);
		await this.createUnitTestPackageJsonFile(type, projectName, projectVersion, projectAbsolutePath);
		await this.createJestConfigFile(type, projectAbsolutePath);
		await this.createSampleUnitTestFile(projectAbsolutePath);
	}

	private async createUnitTestCliConfigFile(projectAbsolutePath: string) {
		await this.fileSystemService.createFileFromTemplate({
			template: TemplateKeys.UNIT_TEST[UNIT_TEST_CLI_CONFIG_TEMPLATE_KEY],
			destinationFolder: projectAbsolutePath,
			fileName: UNIT_TEST_CLI_CONFIG_FILENAME,
			fileExtension: UNIT_TEST_CLI_CONFIG_EXTENSION,
		});
	}

	private async createUnitTestPackageJsonFile(type: string, projectName: string, projectVersion: string, projectAbsolutePath: string) {
		await this.fileSystemService.createFileFromTemplate({
			template: TemplateKeys.UNIT_TEST[UNIT_TEST_PACKAGE_TEMPLATE_KEY],
			destinationFolder: projectAbsolutePath,
			fileName: UNIT_TEST_PACKAGE_FILENAME,
			fileExtension: UNIT_TEST_PACKAGE_EXTENSION,
		});

		let packageJsonAbsolutePath = path.join(projectAbsolutePath, PACKAGE_JSON_FILENAME);

		let version = PACKAGE_JSON_DEFAULT_VERSION;
		if (type === ApplicationConstants.PROJECT_SUITEAPP) {
			version = projectVersion;
		}
		await this.fileSystemService.replaceStringInFile(
			packageJsonAbsolutePath,
			PACKAGE_JSON_REPLACE_STRING_VERSION,
			version
		);
	}

	private async createJestConfigFile(type: string, projectAbsolutePath: string) {
		await this.fileSystemService.createFileFromTemplate({
			template: TemplateKeys.UNIT_TEST[UNIT_TEST_JEST_CONFIG_TEMPLATE_KEY],
			destinationFolder: projectAbsolutePath,
			fileName: UNIT_TEST_JEST_CONFIG_FILENAME,
			fileExtension: UNIT_TEST_JEST_CONFIG_EXTENSION,
		});

		let jestConfigProjectType = JEST_CONFIG_PROJECT_TYPE_ACP;
		if (type === ApplicationConstants.PROJECT_SUITEAPP) {
			jestConfigProjectType = JEST_CONFIG_PROJECT_TYPE_SUITEAPP;
		}
		let jestConfigAbsolutePath = path.join(projectAbsolutePath, JEST_CONFIG_FILENAME);
		await this.fileSystemService.replaceStringInFile(jestConfigAbsolutePath, JEST_CONFIG_REPLACE_STRING_PROJECT_TYPE, jestConfigProjectType);
	}

	private async createSampleUnitTestFile(projectAbsolutePath: string) {
		let testsFolderAbsolutePath = this.fileSystemService.createFolder(projectAbsolutePath, UNIT_TEST_TEST_FOLDER);
		await this.fileSystemService.createFileFromTemplate({
			template: TemplateKeys.UNIT_TEST[UNIT_TEST_SAMPLE_TEST_KEY],
			destinationFolder: testsFolderAbsolutePath,
			fileName: UNIT_TEST_SAMPLE_TEST_FILENAME,
			fileExtension: UNIT_TEST_SAMPLE_TEST_EXTENSION,
		});
	}

	private async runNpmInstall(projectAbsolutePath: string) {
		try {
			await NpmInstallRunner.run(projectAbsolutePath);
			return true;
		} catch (error) {
			return false;
		}
	}

	private validateParams(answers: CreateProjectCommandAnswer) {
		const validationErrors = [];
		validationErrors.push(
			showValidationResults(
				answers.projectname,
				validateFieldIsNotEmpty,
				validateXMLCharacters
			)
		);
		validationErrors.push(
			showValidationResults(answers.type, validateProjectType)
		);
		if (answers.type === ApplicationConstants.PROJECT_SUITEAPP) {
			validationErrors.push(
				showValidationResults(
					answers.publisherid,
					(optionValue: string) => validateNotUndefined(optionValue, COMMAND_OPTIONS.PUBLISHER_ID),
					validatePublisherId
				)
			);

			validationErrors.push(
				showValidationResults(
					answers.projectversion,
					(optionValue: string) => validateNotUndefined(optionValue, COMMAND_OPTIONS.PROJECT_VERSION),
					validateProjectVersion
				)
			);

			validationErrors.push(
				showValidationResults(
					answers.projectid,
					(optionValue: string) => validateNotUndefined(optionValue, COMMAND_OPTIONS.PROJECT_ID),
					validateFieldIsNotEmpty,
					validateFieldHasNoSpaces,
					(optionValue: string) => validateFieldIsLowerCase(COMMAND_OPTIONS.PROJECT_ID, optionValue)
				)
			);
		}

		return validationErrors.filter(item => item !== true);
	}
};
