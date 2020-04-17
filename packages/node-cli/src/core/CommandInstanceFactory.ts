/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import assert from 'assert';
import { InteractiveCommandInfo, NonInteractiveCommandInfo } from '../../types/Metadata';
import BaseCommandGenerator from '../commands/BaseCommandGenerator';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { BaseCommandAnswer } from '../../types/CommandAnswers';
import ConsoleLogger from '../loggers/ConsoleLogger';

export default class CommandInstanceFactory {
	async create(options: {
		commandMetadata: InteractiveCommandInfo | NonInteractiveCommandInfo;
		projectFolder: string;
		executionPath: string;
		runInInteractiveMode: boolean;
		consoleLogger: ConsoleLogger;
	}) {
		assert(options, 'options are mandatory');
		assert(options.commandMetadata, 'options must include commandMetadata property');
		assert(options.projectFolder, 'options must include projectFolder property');
		assert(options.executionPath, 'options must include executionPath property');
		assert(typeof options.runInInteractiveMode === 'boolean', 'options property runInInteractiveMode must be a boolean');
		assert(options.consoleLogger, 'options must include consoleLogger property');

		const commandMetadata = options.commandMetadata;
		const commandGeneratorPath = options.runInInteractiveMode
			? (commandMetadata.interactiveGenerator ? commandMetadata.interactiveGenerator : commandMetadata.nonInteractiveGenerator)
			: commandMetadata.nonInteractiveGenerator;

		const Generator = (await import(commandGeneratorPath)).default;
		const generatorInstance: BaseCommandGenerator<BaseCommandParameters, BaseCommandAnswer> = new Generator({
			commandMetadata,
			projectFolder: options.projectFolder,
			executionPath: options.executionPath,
			runInInteractiveMode: options.runInInteractiveMode,
			consoleLogger: options.consoleLogger,
		});

		return generatorInstance.create();
	}
};
