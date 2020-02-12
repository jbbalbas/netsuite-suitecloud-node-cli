/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import path from 'path';
import * as FileUtils from '../utils/FileUtils';
import { 
	CommandGeneratorMetadata,
	SDKCommandInfo,
	NodeCommandInfo,
	SKDCommandOption,
	NodeCommandOption,
	ParsedCommandMetadata,
	BaseParsedCommandInfo,
	BaseParsedCommandMetadata,
	NonInteractiveCommandInfo,
	InteractiveCommandInfo,
	BaseCommandInfo,
	CommandMetadata, 
	NodeCommandMetadata,
	SDKCommandMetadata
} from '../../types/Metadata';
import { SDK_COMMANDS_METADATA_FILE, NODE_COMMANDS_METADATA_FILE, COMMAND_GENERATORS_METADATA_FILE } from '../ApplicationConstants';
const SDK_WRAPPER_GENERATOR = 'commands/SDKWrapperCommandGenerator';
let COMMANDS_METADATA_CACHE: ParsedCommandMetadata;

export default class CommandsMetadataService {
	private rootCLIPath: string;

	constructor(rootCLIPath: string = '') {
		this.rootCLIPath = rootCLIPath;
	}
	initializeCommandsMetadata() {
		const sdkCommandsMetadata: SDKCommandMetadata = this.getMetadataFromFile(path.join(this.rootCLIPath, SDK_COMMANDS_METADATA_FILE));
		const nodeCommandsMetadata: NodeCommandMetadata = this.getMetadataFromFile(path.join(this.rootCLIPath, NODE_COMMANDS_METADATA_FILE));
		const commandGeneratorsMetadata: CommandGeneratorMetadata[] = this.getMetadataFromFile(path.join(this.rootCLIPath, COMMAND_GENERATORS_METADATA_FILE));
		let combinedMetadata = {
			...sdkCommandsMetadata,
			...nodeCommandsMetadata,
		};
		let parsedCombinedMetadata = this.transformCommandsOptionsToObject(combinedMetadata);
		let pasedCombinedMetadata = this.addCommandGeneratorMetadata(commandGeneratorsMetadata, parsedCombinedMetadata);
		COMMANDS_METADATA_CACHE = pasedCombinedMetadata;
	}

	getCommandsMetadata() {
		return COMMANDS_METADATA_CACHE;
	}

	getCommandMetadataByName(commandName: string) {
		const commandMetadata = COMMANDS_METADATA_CACHE[commandName];
		if (!commandMetadata) {
			throw `No metadata found or initialized for Command ${commandName}`;
		}
		return commandMetadata;
	}

	private getMetadataFromFile(filepath: string) {
		if (!FileUtils.exists(filepath)) {
			throw `Commands Metadata in filepath ${filepath} not found`;
		}
		try {
			return FileUtils.readAsJson(filepath);
		} catch (error) {
			throw `Error parsing Commands Metadata from ${filepath}`;
		}
	}

	private transformCommandsOptionsToObject(commandsMetadata: CommandMetadata<SDKCommandInfo | NodeCommandInfo>) {
		return this.getBaseParsedMetadata(commandsMetadata, commandMetadata => {
			var options = commandMetadata.options;
			const optionsTransformedIntoObject = options.reduce((result: { [x: string]: SKDCommandOption | NodeCommandOption }, item: any) => {
				if (item.name == null) {
					throw 'Invalid Metadata, missing "name" property in command options';
				}
				result[item.name] = item;
				return result;
			}, {});

			return {
				name: commandMetadata.name,
				sdkCommand: commandMetadata.sdkCommand,
				description: commandMetadata.description,
				isSetupRequired: commandMetadata.isSetupRequired,
				usage: commandMetadata.usage,
				alias: commandMetadata.alias,
				forceInteractiveMode: commandMetadata.forceInteractiveMode,
				options: optionsTransformedIntoObject
			}
		});
	}

	private addCommandGeneratorMetadata(
		commandGeneratorsMetadata: CommandGeneratorMetadata[],
		commandsMetadata: BaseParsedCommandMetadata): ParsedCommandMetadata {
		return this.getParsedCommandsMetadata(commandsMetadata, commandMetadata => {

			const generatorMetadata = commandGeneratorsMetadata.find(generatorMetadata => {
				return generatorMetadata.commandName === commandMetadata.name;
			});
			const defaultGenerator = generatorMetadata && generatorMetadata.nonInteractiveGenerator
				? generatorMetadata.nonInteractiveGenerator
				: SDK_WRAPPER_GENERATOR;

			if (generatorMetadata && generatorMetadata.interactiveGenerator) {
				return {
					name: commandMetadata.name,
					sdkCommand: commandMetadata.sdkCommand,
					description: commandMetadata.description,
					isSetupRequired: commandMetadata.isSetupRequired,
					usage: commandMetadata.usage,
					alias: commandMetadata.alias,
					forceInteractiveMode: commandMetadata.forceInteractiveMode,
					options: commandMetadata.options,
					nonInteractiveGenerator: path.join(this.rootCLIPath, defaultGenerator),
					interactiveGenerator: path.join(this.rootCLIPath, generatorMetadata.interactiveGenerator),
					supportsInteractiveMode: true
				} as InteractiveCommandInfo;
			}
			else {
				return {
					name: commandMetadata.name,
					sdkCommand: commandMetadata.sdkCommand,
					description: commandMetadata.description,
					isSetupRequired: commandMetadata.isSetupRequired,
					usage: commandMetadata.usage,
					alias: commandMetadata.alias,
					forceInteractiveMode: commandMetadata.forceInteractiveMode,
					options: commandMetadata.options,
					nonInteractiveGenerator: path.join(this.rootCLIPath, defaultGenerator),
					supportsInteractiveMode: false,
				} as NonInteractiveCommandInfo;
			}
		});
	}
	private getBaseParsedMetadata(
		commandsMetadata: CommandMetadata<SDKCommandInfo | NodeCommandInfo>,
		func: (commandMetadata: BaseCommandInfo<SKDCommandOption | NodeCommandOption>) => BaseParsedCommandInfo): BaseParsedCommandMetadata {
		var parsedCommandsMetadata: BaseParsedCommandMetadata = {};
		for (const commandMetadataId in commandsMetadata) {
			if (commandsMetadata.hasOwnProperty(commandMetadataId)) {
				const commandMetadata = commandsMetadata[commandMetadataId];
				parsedCommandsMetadata[commandMetadataId] = func(commandMetadata);
			}
		}
		return parsedCommandsMetadata;
	}
	
	private getParsedCommandsMetadata(
		commandsMetadata: BaseParsedCommandMetadata,
		func: (commandMetadata: BaseParsedCommandInfo) => (InteractiveCommandInfo | NonInteractiveCommandInfo)): ParsedCommandMetadata {
		var parsedCommandsMetadata: ParsedCommandMetadata = {};
		for (const commandMetadataId in commandsMetadata) {
			if (commandsMetadata.hasOwnProperty(commandMetadataId)) {
				const commandMetadata = commandsMetadata[commandMetadataId];
				parsedCommandsMetadata[commandMetadataId] = func(commandMetadata);
			}
		}
		return parsedCommandsMetadata;
	}
};
