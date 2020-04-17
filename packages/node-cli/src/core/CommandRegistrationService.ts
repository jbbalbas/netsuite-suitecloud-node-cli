/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import assert from 'assert';
const OPTION_TYPE_FLAG = 'FLAG';
const INTERACTIVE_OPTION_NAME = 'interactive';
const INTERACTIVE_OPTION_ALIAS = 'i';
import { NodeTranslationService } from '../services/NodeTranslationService';
import { COMMAND_OPTION_INTERACTIVE_HELP } from '../services/TranslationKeys';
import { SKDCommandOption, NodeCommandOption, InteractiveCommandInfo, NonInteractiveCommandInfo } from '../../types/Metadata';
import { CommanderStatic, Command as LocalCommand } from 'commander';

export default class CommandRegistrationService {
	register(options: {
		commandMetadata: InteractiveCommandInfo | NonInteractiveCommandInfo;
		program: CommanderStatic;
		executeCommandFunction: (x: any) => Promise<any>;
		runInInteractiveMode: boolean;
	}) {
		assert(options, 'options are mandatory');
		assert(options.commandMetadata, 'options must include commandMetadata property');
		assert(options.program, 'options must include program property');
		assert(options.executeCommandFunction, 'options must include executeCommandFunction property');
		assert(typeof options.runInInteractiveMode === 'boolean', 'options property runInInteractiveMode must be a boolean');

		const commandMetadata = options.commandMetadata;
		const program = options.program;
		const executeCommandFunction = options.executeCommandFunction;
		const runInInteractiveMode = options.runInInteractiveMode;

		let commandSetup: LocalCommand = program.command(`${commandMetadata.name} folder>`);
		//program.alias(this._alias)

		if (!runInInteractiveMode) {
			if (commandMetadata.supportsInteractiveMode) {
				const interactiveOptionHelp = NodeTranslationService.getMessage(
					COMMAND_OPTION_INTERACTIVE_HELP,
					commandMetadata.name
				);
				commandMetadata.options.interactive = {
					name: INTERACTIVE_OPTION_NAME,
					alias: INTERACTIVE_OPTION_ALIAS,
					description: interactiveOptionHelp,
					type: OPTION_TYPE_FLAG,
					mandatory: false,
				};
			}
			commandSetup = this.addNonInteractiveCommandOptions(
				commandSetup,
				commandMetadata.options
			);
		}

		commandSetup.description(commandMetadata.description).action(options => {
			executeCommandFunction(options);
		});
	}

	private addNonInteractiveCommandOptions(commandSetup: LocalCommand, options: {[x: string] : (SKDCommandOption | NodeCommandOption)}) {
		const optionsSortedByName = Object.values(options).sort((option1, option2) =>
			option1.name.localeCompare(option2.name)
		);
		optionsSortedByName.forEach(option => {
			if (option.disableInIntegrationMode) {
				return;
			}
			let mandatoryOptionString = '';
			let optionString = '';
			if (option.type !== OPTION_TYPE_FLAG) {
				mandatoryOptionString = '<argument>';
			}
			if (option.alias) {
				optionString = `-${option.alias}, `;
			}
			optionString += `--${option.name} ${mandatoryOptionString}`;
			commandSetup.option(optionString, option.description);
		});
		return commandSetup;
	}
};
