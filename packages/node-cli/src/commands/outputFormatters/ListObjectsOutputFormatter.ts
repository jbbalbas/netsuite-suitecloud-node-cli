/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import * as ActionResultUtils from '../../utils/ActionResultUtils';

import { COMMAND_LISTOBJECTS } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ActionResult } from '../actionresult/ActionResult';

type ListObjectsData = {
	type: string;
	scriptId: string;
}[];

export default class ListObjectsOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: ActionResult<ListObjectsData>) {
		ActionResultUtils.logResultMessage(actionResult, this.consoleLogger);
		if (Array.isArray(actionResult.data) && actionResult.data.length) {
			this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.SUCCESS_OBJECTS_IMPORTED));
			actionResult.data.forEach(object => this.consoleLogger.result(`${object.type}:${object.scriptId}`));
		} else {
			this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_LISTOBJECTS.SUCCESS_NO_OBJECTS));
		}
	}
}