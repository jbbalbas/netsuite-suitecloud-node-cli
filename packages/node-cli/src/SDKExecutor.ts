/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import {
	SDK_INTEGRATION_MODE_JVM_OPTION,
	SDK_CLIENT_PLATFORM_VERSION_JVM_OPTION,
	SDK_PROXY_JVM_OPTIONS,
	FOLDERS,
	SDK_REQUIRED_JAVA_VERSION,
} from './ApplicationConstants';
import SDKProperties from './core/sdksetup/SDKProperties';
import path from 'path';
import os from 'os';
import * as FileUtils from './utils/FileUtils';
import { spawn } from 'child_process';
import CLISettingsService from './services/settings/CLISettingsService';
import EnvironmentInformationService from './services/EnvironmentInformationService';
import url from 'url';
import { NodeTranslationService } from './services/NodeTranslationService';
import { ERRORS } from './services/TranslationKeys';
import SDKErrorCodes from './SDKErrorCodes';
import AuthenticationService from './core/authentication/AuthenticationService'
import SDKExecutionContext from "./SDKExecutionContext";
import { OperationResult } from '../types/OperationResult';

const HOME_PATH = os.homedir();
const DATA_EVENT = 'data';
const CLOSE_EVENT = 'close';
const UTF8 = 'utf8';

export default class SDKExecutor {
	private CLISettingsService: CLISettingsService;
	private authenticationService: AuthenticationService;
	private environmentInformationService: EnvironmentInformationService;
	constructor(authenticationService: AuthenticationService) {
		this.CLISettingsService = new CLISettingsService();
		this.authenticationService = authenticationService;
		this.environmentInformationService = new EnvironmentInformationService();
	}

	public execute(executionContext: SDKExecutionContext) {
		const proxyOptions = this.getProxyOptions();
		const authId = executionContext.includeProjectDefaultAuthId
			? this.authenticationService.getProjectDefaultAuthId()
			: null;

		return new Promise((resolve: (value?: OperationResult) => any, reject: (value?: string) => any) => {
			let lastSdkOutput = '';
			let lastSdkError = '';

			if (!this.CLISettingsService.isJavaVersionValid()) {
				const javaVersionError = this.checkIfJavaVersionIssue();
				if (javaVersionError) {
					reject(javaVersionError);
					return;
				}
			}

			if (executionContext.includeProjectDefaultAuthId) {
				executionContext.addParam('authId', authId);
			}

			const cliParams = this.convertParamsObjToString(
				executionContext.getParams(),
				executionContext.getFlags()
			);

			const integrationModeOption = executionContext.isIntegrationMode()
				? SDK_INTEGRATION_MODE_JVM_OPTION
				: '';

			const clientPlatformVersionOption = `${SDK_CLIENT_PLATFORM_VERSION_JVM_OPTION}=${process.versions.node}`;

			const sdkJarPath = path.join(
				HOME_PATH,
				`${FOLDERS.SUITECLOUD_SDK}/${SDKProperties.getSDKFileName()}`
			);
			if (!FileUtils.exists(sdkJarPath)) {
				throw NodeTranslationService.getMessage(
					ERRORS.SDKEXECUTOR.NO_JAR_FILE_FOUND,
					path.join(__dirname, '..')
				);
			}
			const quotedSdkJarPath = `"${sdkJarPath}"`;
			
			const vmOptions = `${proxyOptions} ${integrationModeOption} ${clientPlatformVersionOption}`;
			const jvmCommand = `java -jar ${vmOptions} ${quotedSdkJarPath} ${executionContext.getCommand()} ${cliParams}`;

			const childProcess = spawn(jvmCommand, [], { shell: true });

			childProcess.stderr.on(DATA_EVENT, data => {
				lastSdkError += data.toString(UTF8);
			});

			childProcess.stdout.on(DATA_EVENT, data => {
				lastSdkOutput += data.toString(UTF8);
			});

			childProcess.on(CLOSE_EVENT, code => {
				if (code === 0) {
					try {
						const output: OperationResult = executionContext.isIntegrationMode()
							? JSON.parse(lastSdkOutput)
							: lastSdkOutput;
						if (
							executionContext.isIntegrationMode &&
							output.errorCode &&
							output.errorCode === SDKErrorCodes.NO_TBA_SET_FOR_ACCOUNT
						) {
							reject(
								NodeTranslationService.getMessage(
									ERRORS.SDKEXECUTOR.NO_TBA_FOR_ACCOUNT_AND_ROLE
								)
							);
						}
						resolve(output);
					} catch (error) {
						reject(
							NodeTranslationService.getMessage(ERRORS.SDKEXECUTOR.RUNNING_COMMAND, error)
						);
					}
				} else if (code !== 0) {
					// check if the problem was due to bad Java Version
					const javaVersionError = this.checkIfJavaVersionIssue();

					const sdkErrorMessage = NodeTranslationService.getMessage(
						ERRORS.SDKEXECUTOR.SDK_ERROR,
						code.toString(),
						lastSdkError
					);

					reject(javaVersionError ? javaVersionError : sdkErrorMessage);
				}
			});
		});
	}

	private getProxyOptions() {
		if (!this.CLISettingsService.useProxy()) {
			return '';
		}
		const proxyUrl = url.parse(this.CLISettingsService.getProxyUrl());
		if (!proxyUrl.protocol || !proxyUrl.port || !proxyUrl.hostname) {
			throw NodeTranslationService.getMessage(ERRORS.WRONG_PROXY_SETTING, this.CLISettingsService.getProxyUrl());
		}
		const protocolWithoutColon = proxyUrl.protocol.slice(0, -1);
		const hostName = proxyUrl.hostname;
		const port = proxyUrl.port;
		const { PROTOCOL, HOST, PORT } = SDK_PROXY_JVM_OPTIONS;

		return `${PROTOCOL}=${protocolWithoutColon} ${HOST}=${hostName} ${PORT}=${port}`;
	}

	private convertParamsObjToString(cliParams: {[x: string]: any}, flags: string[]) {
		let cliParamsAsString = '';
		for (const param in cliParams) {
			if (cliParams.hasOwnProperty(param)) {
				const value = cliParams[param] ? ` ${cliParams[param]} ` : ' ';
				cliParamsAsString += param + value;
			}
		}

		if (flags && Array.isArray(flags)) {
			flags.forEach(flag => {
				cliParamsAsString += ` ${flag} `;
			});
		}

		return cliParamsAsString;
	}

	private checkIfJavaVersionIssue() {
		const javaVersionInstalled = this.environmentInformationService.getInstalledJavaVersionString();
		if (javaVersionInstalled.startsWith(SDK_REQUIRED_JAVA_VERSION)) {
			this.CLISettingsService.setJavaVersionValid(true);
			return;
		}

		this.CLISettingsService.setJavaVersionValid(false);
		if (javaVersionInstalled === '') {
			return NodeTranslationService.getMessage(
				ERRORS.CLI_SDK_JAVA_VERSION_NOT_INSTALLED,
				SDK_REQUIRED_JAVA_VERSION
			);
		}
		return NodeTranslationService.getMessage(
			ERRORS.CLI_SDK_JAVA_VERSION_NOT_COMPATIBLE,
			javaVersionInstalled,
			SDK_REQUIRED_JAVA_VERSION
		);
	}
};
