/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import crypto from 'crypto';
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY_BUFFER_LENGTH = 16;
const IV_LENGTH = 16;
const HEX = 'hex';
const DELIMITER = ':';

export function encrypt(text: string, key: string) {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);

	return iv.toString(HEX) + DELIMITER + encrypted.toString(HEX);
}

export function decrypt(text: string, key: string) {
	const textParts = text.split(DELIMITER);
	const first = textParts.shift();
	if (first) {
		const iv = Buffer.from(first, HEX);
		const encryptedText = Buffer.from(textParts.join(DELIMITER), HEX);
		const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
		let decrypted = decipher.update(encryptedText);
		decrypted = Buffer.concat([decrypted, decipher.final()]);
		return decrypted.toString();
	}
}

export function generateRandomKey() {
	return crypto
		.randomBytes(ENCRYPTION_KEY_BUFFER_LENGTH)
		.toString(HEX)
		.substr(0, 32);
}
