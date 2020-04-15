/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import * as ActionResultUtils from '../../utils/ActionResultUtils';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ActionResult } from '../actionresult/ActionResult';

type ListFilesData = string[];

export default class ListFilesOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: ActionResult<ListFilesData>) {
		ActionResultUtils.logResultMessage(actionResult, this.consoleLogger);

		if (Array.isArray(actionResult.data)) {
			actionResult.data.forEach(fileName => {
				this.consoleLogger.result(fileName);
			});
		}
	}
}
