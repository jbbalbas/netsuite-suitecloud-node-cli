/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import assert from 'assert';
import OutputFormatter from '../commands/outputFormatters/OutputFormatter';
import { CommandParameters } from '../../types/CommandOptions';
import { InteractiveCommandInfo, NonInteractiveCommandInfo } from '../../types/Metadata';
import ConsoleLogger from '../loggers/ConsoleLogger';

export default class Command {
	public commandMetadata: InteractiveCommandInfo | NonInteractiveCommandInfo;;
	public projectFolder: string;
	public getCommandQuestions: Function;
	public preActionFunc: Function;
	public action: Function;
	protected options?: {[x: string]: string};
	public outputFormatter: OutputFormatter;
	public consoleLogger?: ConsoleLogger;

	constructor(options: CommandParameters) {
		assert(options, 'options are mandatory');
		assert(options.commandMetadata, 'options must include commandMetadata property');
		assert(options.projectFolder, 'options must include projectFolder property');
		assert(options.getCommandQuestionsFunc instanceof Function, 'options property getCommandQuestionsFunc must be a Function');
		assert(options.preActionFunc instanceof Function, 'options property preActionFunc must be a Function');
		assert(options.actionFunc instanceof Function, 'options property actionFunc must be a Function');
		assert(options.outputFormatter instanceof OutputFormatter, 'options property outputFormatter must be a Function');

		this.commandMetadata = options.commandMetadata;
		this.projectFolder = options.projectFolder;
		this.getCommandQuestions = options.getCommandQuestionsFunc;
		this.preActionFunc = options.preActionFunc;
		this.action = options.actionFunc;
		this.options = options.options;
		this.outputFormatter = options.outputFormatter;
	}
};
