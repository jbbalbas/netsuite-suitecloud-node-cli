/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import path from 'path';
import assert from 'assert';
import program from 'commander';
import { NodeConsoleLogger } from './loggers/NodeConsoleLogger';
import { NodeTranslationService } from './services/NodeTranslationService';
import * as Keys from './services/TranslationKeys';
import { unwrapExceptionMessage } from './utils/ExceptionUtils';
const INTERACTIVE_ALIAS = '-i';
const INTERACTIVE_OPTION = '--interactive';

// suitecloud executable is in {root}/src/suitecloud.js. package.json file is one level before
const PACKAGE_FILE = `${path.dirname(require.main?.filename || '.')}/../package.json`;
const configFile = require(PACKAGE_FILE);
const CLI_VERSION = configFile ? configFile.version : 'unknown';
const COMPATIBLE_NS_VERSION = '2020.1';

export default class CLI {
	private commandsMetadataService: any;
	private commandActionExecutor: any;
	private commandRegistrationService: any;

	constructor(dependencies: {commandsMetadataService: any; commandActionExecutor: any; commandRegistrationService: any}) {
		assert(dependencies);
		assert(dependencies.commandsMetadataService);
		assert(dependencies.commandActionExecutor);
		assert(dependencies.commandRegistrationService);

		this.commandsMetadataService = dependencies.commandsMetadataService;
		this.commandActionExecutor = dependencies.commandActionExecutor;
		this.commandRegistrationService = dependencies.commandRegistrationService;
	}

	public start(process: {argv: string[]}) {
		try {
			this.commandsMetadataService.initializeCommandsMetadata();
			const runInInteractiveMode = this.isRunningInInteractiveMode();

			const commandMetadataList = this.commandsMetadataService.getCommandsMetadata();
			this.initializeCommands(commandMetadataList, runInInteractiveMode);

			program
				.version(CLI_VERSION, '--version')
				.option(`${INTERACTIVE_ALIAS}, ${INTERACTIVE_OPTION}`, NodeTranslationService.getMessage(Keys.CLI.INTERACTIVE_OPTION_DESCRIPTION))
				.on('command:*', (args: string[]) => {
					NodeConsoleLogger.error(NodeTranslationService.getMessage(Keys.ERRORS.COMMAND_DOES_NOT_EXIST, args[0]));
				})
				.usage(NodeTranslationService.getMessage(Keys.CLI.USAGE))
				.parse(process.argv);

			if (!program.args.length) {
				this.printHelp();
			}
		} catch (exception) {
			NodeConsoleLogger.error(unwrapExceptionMessage(exception));
		}
	}

	private initializeCommands(commandMetadataList: any[], runInInteractiveMode: boolean) {
		const commandsMetadataArraySortedByCommandName = Object.values(commandMetadataList).sort((command1, command2) =>
			command1.name.localeCompare(command2.name)
		);

		commandsMetadataArraySortedByCommandName.forEach(commandMetadata => {
			this.commandRegistrationService.register({
				commandMetadata: commandMetadata,
				program: program,
				runInInteractiveMode: runInInteractiveMode,
				executeCommandFunction: async (options: any) => {
					await this.commandActionExecutor.executeAction({
						commandName: commandMetadata.name,
						runInInteractiveMode: runInInteractiveMode,
						arguments: options,
					});
				},
			});
		});
	}

	private isRunningInInteractiveMode() {
		return process.argv[3] === INTERACTIVE_ALIAS || process.argv[3] === INTERACTIVE_OPTION;
	}

	private printHelp() {
		NodeConsoleLogger.info(NodeTranslationService.getMessage(Keys.CLI.TITLE, COMPATIBLE_NS_VERSION));
		program.help();
	}
};
