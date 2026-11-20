import CryptoJS from "crypto-js";

const VERSION = 1;

/** 与原项目一致的私密频道加密格式。 */
export function encryptData(data, password, version = VERSION) {
	const salt = CryptoJS.lib.WordArray.random(16);
	const iv = CryptoJS.lib.WordArray.random(16);
	const key = CryptoJS.PBKDF2(password, salt, {
		keySize: 256 / 32,
		iterations: 100000,
		hasher: CryptoJS.algo.SHA256,
	});
	return {
		version,
		salt: salt.toString(),
		iv: iv.toString(),
		data: CryptoJS.AES.encrypt(JSON.stringify(data), key, { iv }).toString(),
	};
}

/** 解密原项目的私密频道数据。 */
export function decryptData(record, password, version = VERSION) {
	if (
		!record ||
		record.version !== version ||
		!record.salt ||
		!record.iv ||
		!record.data
	) {
		throw new Error("加密数据格式不受支持或已损坏");
	}
	const salt = CryptoJS.enc.Hex.parse(record.salt);
	const iv = CryptoJS.enc.Hex.parse(record.iv);
	const key = CryptoJS.PBKDF2(password, salt, {
		keySize: 256 / 32,
		iterations: 100000,
		hasher: CryptoJS.algo.SHA256,
	});
	const plaintext = CryptoJS.AES.decrypt(record.data, key, {
		iv,
	}).toString(CryptoJS.enc.Utf8);
	if (!plaintext) {
		throw new Error("无法解密，可能是凭证错误");
	}
	return JSON.parse(plaintext);
}
