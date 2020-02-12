/*
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';
import BaseCommandGenerator from './BaseCommandGenerator';
import LocalCommand from '@oracle/suitecloud-cli-localserver-command';

import * as NodeUtils from './../utils/NodeUtils';
import { COMMAND_LOCAL } from './../services/TranslationKeys';
import TranslationService from './../services/TranslationService';
import { LocalCommandOptions } from '../../types/CommandOptions';
import { Prompt } from '../../types/Prompt';
import FileSystemService from '../services/FileSystemService';

export default class LocalCommandGenerator extends BaseCommandGenerator<LocalCommandOptions, any> {
	local: any;

	constructor(options: LocalCommandOptions) {

		super(options);
		options.filesystem = FileSystemService;
		options.colors = NodeUtils.COLORS;
		options.translation = [TranslationService, COMMAND_LOCAL];

		this.local = new LocalCommand(options);
	}

	public getCommandQuestions(prompt: Prompt<any>) {
		this.local.initialize();
		return this.local.getCommandQuestions(prompt);
	}

	public executeAction(answers: any) {
		this.local.initialize();
		return this.local.executeAction(answers);
	}
};
