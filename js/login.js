function login(username, password) {
	var notok = false;
	var userdatar = null;
	get(
		"users/" + username + ".json",
		function (e, ...f) {
			userdatar = Base64.decode((typeof e === "string" ? JSON.parse(e) : e).content);
		},
		function (...e) {
			notok = true;
		},
	);
	if (notok) {
		a.text("用户名或密码错误");
		return;
	}
	try {
		getdata(userdatar, password);
	} catch {
		var error = $("#error");
		error.text("用户名或密码错误");
		return;
	}
	alert("ok");
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
