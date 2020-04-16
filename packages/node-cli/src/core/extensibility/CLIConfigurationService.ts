/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { NodeVM } from 'vm2';
import { lineBreak } from '../../loggers/LoggerConstants';
import * as FileUtils from '../../utils/FileUtils';
import path from 'path';
import { NodeTranslationService } from './../../services/NodeTranslationService';
import { ERRORS } from './../../services/TranslationKeys';
import CommandUserExtension from './CommandUserExtension';
const CLI_CONFIG_JS_FILE = 'suitecloud.config.js';
const DEFAULT_CONFIG = {
	defaultProjectFolder: '',
	commands: {},
};

const isString = (str: any) => typeof str === 'string' || str instanceof String;

export default class CLIConfigurationService {
	private cliConfig: {
		defaultProjectFolder: string;
		commands: { [x:string]: any };
	};
	private executionPath: string = '';

	constructor() {
		this.cliConfig = DEFAULT_CONFIG;
	}

	public initialize(executionPath: string) {
		this.executionPath = executionPath;
		const cliConfigFile = path.join(this.executionPath, CLI_CONFIG_JS_FILE);
		if (!FileUtils.exists(cliConfigFile)) {
			return;
		}

		try {
			const nodeVm = new NodeVM({
				console: 'inherit',
				sandbox: {},
				require: {
					external: true,
					builtin: ['*'],
					root: this.executionPath,
				},
			});
			const cliConfigFileContent = FileUtils.readAsString(cliConfigFile);
			this.cliConfig = nodeVm.run(cliConfigFileContent, cliConfigFile);
		} catch (error) {
			throw NodeTranslationService.getMessage(ERRORS.CLI_CONFIG_ERROR_LOADING_CONFIGURATION_MODULE, cliConfigFile, lineBreak, error);
		}
	}

	public getCommandUserExtension(commandName: string) {
		const commandExtension =
			this.cliConfig && this.cliConfig.commands[commandName]
				? this.cliConfig.commands[commandName]
				: {};
		return new CommandUserExtension(commandExtension);
	}

	public getProjectFolder(command: string) {
		const defaultProjectFolder = isString(this.cliConfig.defaultProjectFolder)
			? this.cliConfig.defaultProjectFolder
			: '';

		const commandConfig = this.cliConfig && this.cliConfig.commands[command];
		let commandOverridenProjectFolder;
		if (commandConfig && isString(commandConfig.projectFolder)) {
			commandOverridenProjectFolder = commandConfig.projectFolder;
		}
		return path.join(
			this.executionPath,
			commandOverridenProjectFolder ? commandOverridenProjectFolder : defaultProjectFolder
		);
	}
};
