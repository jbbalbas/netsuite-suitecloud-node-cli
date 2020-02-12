/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import assert from 'assert';
import OutputFormatter from '../commands/outputFormatters/OutputFormatter';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { OperationResult } from '../../types/OperationResult';
import { InteractiveCommandInfo, NonInteractiveCommandInfo } from '../../types/Metadata';

export default class Command {
	public commandMetadata: InteractiveCommandInfo | NonInteractiveCommandInfo;;
	public projectFolder: string;
	public getCommandQuestions: Function;
	public preActionFunc: Function;
	public action: Function;
	protected options?: {[x: string]: string};
	public formatOutputFunc?: (x: OperationResult) => void;

	constructor(options: CommandParameters) {
		assert(options);
		assert(options.commandMetadata);
		assert(options.projectFolder);
		assert(options.getCommandQuestionsFunc instanceof Function);
		assert(options.preActionFunc instanceof Function);
		assert(options.actionFunc instanceof Function);
		assert(options.outputFormatter instanceof OutputFormatter);

		this.commandMetadata = options.commandMetadata;
		this.projectFolder = options.projectFolder;
		this.getCommandQuestions = options.getCommandQuestionsFunc;
		this.preActionFunc = options.preActionFunc;
		this.action = options.actionFunc;
		this.options = options.options;
		this.outputFormatter = options.outputFormatter;
	}
};
