/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import SDKExecutor from '../SDKExecutor';
import Command from './Command';
import assert from 'assert';
import AuthenticationService from '../core/authentication/AuthenticationService';
import { NodeConsoleLogger } from '../loggers/NodeConsoleLogger';
import OutputFormatter from './outputFormatters/OutputFormatter';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { Prompt } from '../../types/Prompt';
import { OperationResult } from '../../types/OperationResult';
import { BaseCommandAnswer } from '../../types/CommandAnswers';
import { InteractiveCommandInfo, NonInteractiveCommandInfo } from '../../types/Metadata';
import { ActionResult, ActionResultBuilder } from './actionresult/ActionResult';
import ConsoleLogger from '../loggers/ConsoleLogger';

export default abstract class BaseCommandGenerator<Parameters extends BaseCommandParameters, Answer extends BaseCommandAnswer> {
	public sdkExecutor: SDKExecutor;
	public commandMetadata: InteractiveCommandInfo | NonInteractiveCommandInfo;
	public projectFolder: string;
	public executionPath: string;
	public runInInteractiveMode?: boolean;
	public formatOutputFunc?: (x: OperationResult) => void;
	public outputFormatter: OutputFormatter;
	public consoleLogger: ConsoleLogger;
	protected abstract actionResultBuilder: ActionResultBuilder<any>;

	constructor(options: Parameters) {
		assert(options);
		assert(options.commandMetadata);
		assert(options.projectFolder);
		assert(typeof options.runInInteractiveMode === 'boolean');
		assert(options.consoleLogger);

		this.sdkExecutor = new SDKExecutor(new AuthenticationService(options.executionPath));

		this.commandMetadata = options.commandMetadata;
		this.projectFolder = options.projectFolder;
		this.executionPath = options.executionPath;
		this.runInInteractiveMode = options.runInInteractiveMode;
		this.consoleLogger = options.consoleLogger;
		this.outputFormatter = options.outputFormatter;
	}

	public getCommandQuestions(prompt: Prompt<Answer>, commandArguments?: {[x:string]:any}) {
		return prompt([]);
	}

	public abstract executeAction(x: Answer): Promise<ActionResult<any>>

	public preExecuteAction(args: Answer) {
		return args;
	}

	public formatOutput(x: ActionResult<any>) {}

	public create() {
		return new Command({
			commandMetadata: this.commandMetadata,
			projectFolder: this.projectFolder,
			getCommandQuestionsFunc: this.getCommandQuestions.bind(this),
			preActionFunc: this.preExecuteAction.bind(this),
			actionFunc: this.executeAction.bind(this),
			outputFormatter: this.outputFormatter ? this.outputFormatter : new OutputFormatter(this.consoleLogger),
			consoleLogger: this.consoleLogger ? this.consoleLogger : NodeConsoleLogger,			
		});
	}
};
