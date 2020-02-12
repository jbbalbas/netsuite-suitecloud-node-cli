/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import ProxyActionResult from '../commands/actionresult/ProxyActionResult';
import BaseCommandGenerator from './BaseCommandGenerator';
import NodeTranslationService from '../services/NodeTranslationService';
import { COMMAND_PROXY } from '../services/TranslationKeys';
import CLISettingsService from '../services/settings/CLISettingsService';
import url from 'url';
import { BaseCommandParameters } from '../../types/CommandOptions';
import { ProxyCommandAnswer } from '../../types/CommandAnswers';
import { ProxyOperationResult } from '../../types/OperationResult';
import ProxyOutputFormatter from './outputFormatters/ProxyOutputFormatter';

export default class ProxyCommandGenerator extends BaseCommandGenerator<BaseCommandParameters, ProxyCommandAnswer> {
	private CLISettingsService: CLISettingsService
	constructor(options: BaseCommandParameters) {
		super(options);
		this.CLISettingsService = new CLISettingsService();
		this.outputFormatter = new ProxyOutputFormatter(options.consoleLogger);
	}

	public async executeAction(args: ProxyCommandAnswer) {
		try {
			const proxyUrlArgument = args.set;
			const shouldClearArgument = args.clear;

			this.validateArguments(proxyUrlArgument, shouldClearArgument);
			const isSettingProxy = !!proxyUrlArgument;

			const proxyCommandAction : ProxyCommandAnswer= {
				isSettingProxy: isSettingProxy,
				proxyUrl: proxyUrlArgument,
			};
			if (isSettingProxy) {
				this.validateProxyUrl(proxyUrlArgument);
				const setProxyResult = this.setProxy(proxyUrlArgument);
				proxyCommandAction.isProxyOverridden = setProxyResult.isProxyOverridden;
			} else {
				this.CLISettingsService.clearProxy();
			}

			const proxyCommandData = await Promise.resolve(proxyCommandAction);
			return ProxyActionResult.Builder.success()
				.withProxySetOption(proxyCommandData.isSettingProxy)
				.withProxyUrl(proxyCommandData.proxyUrl)
				.withProxyOverridden(proxyCommandData.isProxyOverridden)
				.build();
		} catch (error) {
			return ProxyActionResult.Builder.withErrors([error]).build();
		}
	}

	private validateArguments(proxyUrlArgument?: string, shouldClearArgument?: boolean) {
		if (!proxyUrlArgument && !shouldClearArgument) {
			throw NodeTranslationService.getMessage(COMMAND_PROXY.ARGS_VALIDATION.SET_CLEAR_NEITHER_SPECIFIED);
		}
		if (proxyUrlArgument && shouldClearArgument) {
			throw NodeTranslationService.getMessage(COMMAND_PROXY.ARGS_VALIDATION.SET_CLEAR_BOTH_SPECIFIED);
		}
	}

	private validateProxyUrl(proxyUrlArgument: string) {
		const proxyUrl = url.parse(proxyUrlArgument);
		if (!proxyUrl.protocol || !proxyUrl.port || !proxyUrl.hostname) {
			throw NodeTranslationService.getMessage(COMMAND_PROXY.ARGS_VALIDATION.PROXY_URL);
		}
	}

	private setProxy(proxyUrl: string) {
		const proxyUrlIsDifferent = this.CLISettingsService.getProxyUrl() !== proxyUrl;
		this.CLISettingsService.setProxyUrl(proxyUrl);
		return { isProxyOverridden: proxyUrlIsDifferent };
	}
};
