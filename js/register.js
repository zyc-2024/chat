function register(username, password, password2) {
	var error = $("#error");
	error.text("");
	var notok = false;
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
	username = username.trim();
	if (!username || !password) {
		error.text("错误：请输入用户名和密码！");
		return;
	}
	if (password !== password2) {
		error.text("错误：两次输入的密码不一致！");
		return;
	}

	var captcha = $(".frc-captcha>input")[0];
	if (!captcha || !captcha.value.startsWith("AQQA.")) {
		error.text("错误：请完成验证码！");
		return;
	}
	password = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
	var salt = CryptoJS.lib.WordArray.random(16);
	var iv = CryptoJS.lib.WordArray.random(16);
	var key = CryptoJS.PBKDF2(password, salt, {
		keySize: 256 / 32,
		iterations: 100000,
		hasher: CryptoJS.algo.SHA256,
	});
	var profile = {
		user: username,
		reg_time: new Date().toISOString(),
		pf_header: "https://zyc-2024.github.io/res/1.18.png",
		avatar: "https://zyc-2024.github.io/res/nailong.png",
		profile: "Hello everyone!\nMy name is" + username,
		pf_text: "Nothing here to be viewed...",
	};
	var safeprofile = {
		user: username,
		pf_header: "https://zyc-2024.github.io/res/1.18.png",
		avatar: "https://zyc-2024.github.io/res/nailong.png",
		profile: "Hello everyone!\nMy name is" + username,
		pf_text: "Nothing here to be viewed...",
	};
	var record = {
		version: 1,
		salt: salt.toString(),
		iv: iv.toString(),
		data: CryptoJS.AES.encrypt(JSON.stringify(profile), key, { iv: iv }).toString(),
	};
	var path = "users/" + username + ".json";
	var c_msg="user_register_" + new Date().toISOString() + "_" + username;
	get(
		path,
		function () {
			error.text("错误：用户名已存在！");
		},
		function (request) {
			post(
				path,
				c_msg,
				record,
				function () {
					post("ronly/" + path, c_msg, safeprofile, function () {
						setCookie("session", password);
						setCookie("uname", username);
						error.text("注册成功！正在跳转回主页……");
						window.location.href = "/";
					});
				},
				function () {
					error.text("错误：注册数据保存失败，请稍后重试！");
				},
			);
		},
	);
}
