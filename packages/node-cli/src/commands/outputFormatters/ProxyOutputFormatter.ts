/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import { COMMAND_PROXY } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ProxyActionResult } from '../actionresult/ProxyActionResult';

export default class ProxyOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: ProxyActionResult) {
		if (actionResult.isSettingProxy) {
			if (actionResult.isProxyOverridden) {
				this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_PROXY.MESSAGES.PROXY_OVERRIDDEN, actionResult.proxyUrl));
			} else {
				this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_PROXY.MESSAGES.SUCCESFULLY_SETUP, actionResult.proxyUrl));
			}
		} else {
			this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_PROXY.MESSAGES.SUCCESFULLY_CLEARED));
		}
	}
}
