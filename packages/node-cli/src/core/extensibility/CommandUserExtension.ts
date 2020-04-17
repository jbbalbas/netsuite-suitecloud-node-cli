/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import assert from 'assert';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import { lineBreak } from '../../loggers/LoggerConstants';
import { ERRORS } from '../../services/TranslationKeys';
import { OperationResult } from '../../../types/OperationResult';

type CliConfig<T> = {
	beforeExecuting: (x: {command: string; projectPath: string; arguments: {[x:string]:string}}) => any;
	onCompleted?: (x: T) => any;
	onError?: (x: string) => any;
}
export default class CommandUserExtension<T extends OperationResult> {
	private cliConfig: CliConfig<T>;
	constructor(cliConfig: CliConfig<T>) {
		this.cliConfig = cliConfig;
	}

	public async beforeExecuting(options: any) {
		assert(options, 'options are mandatory');
		assert(options.command, 'options must include commandMetadata property');
		assert(options.arguments, 'options must include commandMetadata property');

		try {
			if (!this.cliConfig.beforeExecuting) {
				return options;
			}
			const beforeExecutingContext = {
				command: options.command.name,
				projectPath: options.command.projectFolder,
				arguments: options.arguments,
			};
			const result = await this.cliConfig.beforeExecuting(beforeExecutingContext);
			this.validateBeforeExecutingResult(result);
			return result;
		} catch (error) {
			throw NodeTranslationService.getMessage(ERRORS.CLI_CONFIG_BEFORE_EXECUTING_FAILED, lineBreak, error);
		}
	}

	public onCompleted(options: T) {
		if (!this.cliConfig.onCompleted) {
			return options;
		}
		this.cliConfig.onCompleted(options);
	}

	public onError(options: string) {
		if (!this.cliConfig.onError) {
			return options;
		}
		this.cliConfig.onError(options);
	}

	private validateBeforeExecutingResult(result: any) {
		if (typeof result === 'undefined' || typeof result.arguments !== 'object') {
			throw NodeTranslationService.getMessage(ERRORS.CLI_CONFIG_BEFORE_EXECUTING_WRONG_RETURN_VALUE);
		}
	}
};
