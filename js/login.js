function login(username,password){
	var notok=false;
	get(
		"users/" + username + ".json",
		function (...e) {},
		function (...e) {
			notok = true;
		},
	);
	if (notok) {
		a.text("错误：用户名已存在！（此用户名不与实际聊天中用户名对应）");
		return;
	}
}

function getdata(record, password) {
	if (!record || record.version !== 1 || !record.salt || !record.iv || !record.data) {
		throw new Error("Unsupported or incomplete user record");
	}

	var salt = CryptoJS.enc.Hex.parse(record.salt);
	var iv = CryptoJS.enc.Hex.parse(record.iv);
	var key = CryptoJS.PBKDF2(password, salt, {
		keySize: 256 / 32,
		iterations: 100000,
		hasher: CryptoJS.algo.SHA256,
	});
	var plaintext = CryptoJS.AES.decrypt(record.data, key, { iv: iv }).toString(CryptoJS.enc.Utf8);
	if (!plaintext) {
		throw new Error("Unable to decrypt user record");
	}
	return JSON.parse(plaintext);
}
