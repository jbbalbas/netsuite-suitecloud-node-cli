/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';


export const SDK_COMMANDS_METADATA_FILE = 'metadata/SDKCommandsMetadata.json';
export const NODE_COMMANDS_METADATA_FILE = 'metadata/NodeCommandsMetadata.json';
export const COMMAND_GENERATORS_METADATA_FILE = 'metadata/CommandGenerators.json';
export const SDK_FILENAME = 'cli-2020.1.0.jar';
export const SDK_REQUIRED_JAVA_VERSION = '11';
export const SDK_INTEGRATION_MODE_JVM_OPTION = '-DintegrationMode';
export const SDK_DEVELOPMENT_MODE_JVM_OPTION = '-DdevelopmentMode';
export const SDK_CLIENT_PLATFORM_VERSION_JVM_OPTION = '-DclientPlatformVersion';
export const SDK_PROXY_JVM_OPTIONS = {
	PROTOCOL: '-DproxyProtocol',
	HOST: '-DproxyHost',
	PORT: '-DproxyPort',
};
export const FILES = {
	PROJECT_JSON: 'project.json',
	HIDING_PREFERENCE: 'hiding.xml',
	LOCKING_PREFERENCE: 'locking.xml',
	MANIFEST_XML: 'manifest.xml',
	CLI_SETTINGS: 'nodejs-cli-settings.json'
};
export const FOLDERS = {
	FILE_CABINET: '/FileCabinet',
	INSTALLATION_PREFERENCES: '/InstallationPreferences',
	OBJECTS: '/Objects',
	SUITECLOUD_SDK: '.suitecloud-sdk',
};
export const DEFAULT_MESSAGES_FILE = '../../messages.json';
export const PROJECT_ACP = 'ACCOUNTCUSTOMIZATION';
export const PROJECT_SUITEAPP = 'SUITEAPP';
export const PROD_ENVIRONMENT_ADDRESS = 'https://system.netsuite.com';
export const HTTP_PROTOCOL = 'http://';
export const REST_ROLES_URL = '/rest/roles';
export const LINKS = {
	HOW_TO: {
		CREATE_HIDDING_XML:
			'https://system.netsuite.com/app/help/helpcenter.nl?fid=section_1515950176.html',
		CREATE_LOCKING_XML:
			'https://system.netsuite.com/app/help/helpcenter.nl?fid=section_1543865613.html',
		ISSUE_A_TOKEN:
			'https://system.netsuite.com/app/help/helpcenter.nl?fid=bridgehead_4254083671.html',
	},
};
export const SDK_FALSE = 'F';
export const SDK_TRUE = 'T';
