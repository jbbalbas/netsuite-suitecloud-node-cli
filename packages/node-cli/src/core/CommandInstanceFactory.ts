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

export default class CommandInstanceFactory {
	async create(options: {
		commandMetadata: InteractiveCommandInfo | NonInteractiveCommandInfo;
		projectFolder: string;
		executionPath: string;
		runInInteractiveMode: boolean;
	}) {
		assert(options);
		assert(options.commandMetadata);
		assert(options.projectFolder);
		assert(options.executionPath);
		assert(typeof options.runInInteractiveMode === 'boolean');
		assert(options.consoleLogger);

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
