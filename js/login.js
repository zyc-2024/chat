function login(username, password) {
	var error = $("#error");
	password=CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
	get(
		"users/" + encodeURIComponent(username) + ".json",
		function (record) {
			try {
				var userdata = _decrypt(record, password);
				if (!userdata) {
					throw new Error("？？？");
				}
				error.text("");
				setCookie("session", password);
				setCookie("uname", username);
				error.text("登录成功！正在跳转回主页……");
				window.location.href = "..";
				return userdata;
			} catch {
				error.text("用户名或密码错误");
			}
		},
		function () {
			error.text("用户名或密码错误");
		},
	);
}
