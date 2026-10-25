(function () {
	const SALT = "zyc2024-chat-auth-v1";
	const USER_PREFIX = "private/user_";
	const SESSION_KEY = "chat_auth_v1";
	const SESSION_DAYS = 7;
	const API = "https://gitee.com/api/v5/repos/zyc-2024/chat";
	const TOKEN = "19f7b43872c256d52d1bc71cbd2d0ffa";
	const SITEKEY = "FCMJOIQHSPPBEI93";

	const K = [
		0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
		0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
		0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
		0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
		0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
		0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
		0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
		0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
		0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
		0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
		0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
	];

	function rotr(x, n) {
		return (x >>> n) | (x << (32 - n));
	}

	function sha256Fallback(bytes) {
		const length = bytes.length;
		const bitLength = length * 8;
		const paddedLength = ((length + 9 + 63) >> 6) << 6;
		const data = new Uint8Array(paddedLength);
		data.set(bytes);
		data[length] = 0x80;
		const high = Math.floor(bitLength / 0x100000000);
		const low = bitLength >>> 0;
		data[paddedLength - 8] = (high >>> 24) & 0xff;
		data[paddedLength - 7] = (high >>> 16) & 0xff;
		data[paddedLength - 6] = (high >>> 8) & 0xff;
		data[paddedLength - 5] = high & 0xff;
		data[paddedLength - 4] = (low >>> 24) & 0xff;
		data[paddedLength - 3] = (low >>> 16) & 0xff;
		data[paddedLength - 2] = (low >>> 8) & 0xff;
		data[paddedLength - 1] = low & 0xff;
		const H = [
			0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
			0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
		];
		const w = new Uint32Array(64);
		for (let offset = 0; offset < paddedLength; offset += 64) {
			for (let t = 0; t < 16; t++) {
				const i = offset + t * 4;
				w[t] =
					(data[i] << 24) |
					(data[i + 1] << 16) |
					(data[i + 2] << 8) |
					data[i + 3];
			}
			for (let t = 16; t < 64; t++) {
				const s0 =
					rotr(w[t - 15], 7) ^
					rotr(w[t - 15], 18) ^
					(w[t - 15] >>> 3);
				const s1 =
					rotr(w[t - 2], 17) ^
					rotr(w[t - 2], 19) ^
					(w[t - 2] >>> 10);
				w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
			}
			let a = H[0];
			let b = H[1];
			let c = H[2];
			let d = H[3];
			let e = H[4];
			let f = H[5];
			let g = H[6];
			let h = H[7];
			for (let t = 0; t < 64; t++) {
				const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
				const ch = (e & f) ^ (~e & g);
				const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
				const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
				const maj = (a & b) ^ (a & c) ^ (b & c);
				const temp2 = (S0 + maj) >>> 0;
				h = g;
				g = f;
				f = e;
				e = (d + temp1) >>> 0;
				d = c;
				c = b;
				b = a;
				a = (temp1 + temp2) >>> 0;
			}
			H[0] = (H[0] + a) >>> 0;
			H[1] = (H[1] + b) >>> 0;
			H[2] = (H[2] + c) >>> 0;
			H[3] = (H[3] + d) >>> 0;
			H[4] = (H[4] + e) >>> 0;
			H[5] = (H[5] + f) >>> 0;
			H[6] = (H[6] + g) >>> 0;
			H[7] = (H[7] + h) >>> 0;
		}
		return H.map(function (x) {
			return x.toString(16).padStart(8, "0");
		}).join("");
	}

	function toHex(buffer) {
		return Array.from(new Uint8Array(buffer))
			.map(function (b) {
				return b.toString(16).padStart(2, "0");
			})
			.join("");
	}

	async function sha256(text) {
		const bytes = new TextEncoder().encode(text);
		if (window.crypto && crypto.subtle && crypto.subtle.digest) {
			try {
				const digest = await crypto.subtle.digest("SHA-256", bytes);
				return toHex(digest);
			} catch (e) {}
		}
		return sha256Fallback(bytes);
	}

	function b64Encode(text) {
		const bytes = new TextEncoder().encode(text);
		let binary = "";
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	function b64Decode(text) {
		const binary = atob(String(text).replace(/\s+/g, ""));
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return new TextDecoder().decode(bytes);
	}

	function setCookie(name, value) {
		document.cookie =
			name +
			"=" +
			encodeURIComponent(value) +
			";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;max-age=2147483647";
	}

	function deleteCookie(name) {
		document.cookie =
			name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
	}

	async function accountPath(username) {
		return USER_PREFIX + (await sha256(SALT + ":user:" + username)) + ".json";
	}

	async function passwordHash(username, password) {
		return sha256(SALT + ":pass:" + username + ":" + password);
	}

	async function apiGet(path) {
		const response = await fetch(
			API + "/contents/" + encodeURIComponent(path) + "?access_token=" + TOKEN,
			{ cache: "no-store" },
		);
		if (response.status === 404) return null;
		if (!response.ok) {
			throw new Error("读取账号失败（" + response.status + "）");
		}
		const data = await response.json();
		if (Array.isArray(data) || !data || !data.content) return null;
		return data;
	}

	async function apiWrite(method, path, data, message, sha) {
		const body = {
			access_token: TOKEN,
			message: message,
			content: b64Encode(JSON.stringify(data)),
		};
		if (sha) body.sha = sha;
		const response = await fetch(
			API + "/contents/" + encodeURIComponent(path),
			{
				method: method,
				headers: { "Content-Type": "application/json;charset=UTF-8" },
				body: JSON.stringify(body),
			},
		);
		if (!response.ok) {
			throw new Error("保存账号失败（" + response.status + "）");
		}
		return response.json();
	}

	async function readAccount(username) {
		const path = await accountPath(username);
		const file = await apiGet(path);
		if (!file) return null;
		return {
			path: path,
			sha: file.sha,
			data: JSON.parse(b64Decode(file.content)),
		};
	}

	function getSession() {
		try {
			const raw = localStorage.getItem(SESSION_KEY);
			if (!raw) return null;
			const session = JSON.parse(raw);
			if (!session.username || !session.expires || Date.now() > session.expires) {
				localStorage.removeItem(SESSION_KEY);
				return null;
			}
			return session;
		} catch (e) {
			return null;
		}
	}

	function saveSession(username, displayName) {
		const session = {
			username: username,
			displayName: displayName || username,
			expires: Date.now() + SESSION_DAYS * 86400000,
		};
		try {
			localStorage.setItem(SESSION_KEY, JSON.stringify(session));
		} catch (e) {}
		setCookie("n", session.displayName);
		setCookie("auth", username);
		return session;
	}

	let overlay = null;
	let captchaLogin = "";
	let captchaRegister = "";
	let loginCaptchaBound = false;
	let registerCaptchaBound = false;

	function setMsg(panel, text, ok) {
		const el = overlay && overlay.querySelector("#" + panel + "-msg");
		if (!el) return;
		el.textContent = text || "";
		el.className = "auth-msg" + (ok ? " ok" : "");
	}

	function bindCaptcha(widget, assign) {
		if (!widget) return;
		widget.addEventListener("frc:widget.complete", function (event) {
			assign(
				(event.detail && event.detail.response) ||
					widget.frcWidget.getResponse(),
			);
		});
		widget.addEventListener("frc:widget.expire", function () {
			assign("");
		});
		widget.addEventListener("frc:widget.error", function () {
			assign("");
		});
		let attempts = 0;
		const timer = setInterval(function () {
			attempts++;
			if (window.frcaptcha) {
				clearInterval(timer);
				try {
					window.frcaptcha.attach(widget);
				} catch (e) {}
			} else if (
				attempts > 120 ||
				!overlay ||
				overlay.style.display === "none"
			) {
				clearInterval(timer);
			}
		}, 100);
	}

	function captchaWidget(panel) {
		return overlay && overlay.querySelector("#" + panel + " .frc-captcha");
	}

	function getCaptchaToken(panel, current) {
		const widget = captchaWidget(panel);
		let token = current;
		if (!token && widget && widget.frcWidget && widget.frcWidget.getResponse) {
			token = widget.frcWidget.getResponse();
		}
		if (!token && widget) {
			const input = widget.querySelector('input[name="frc-captcha-response"]');
			if (input) token = input.value;
		}
		if (!token || token.charAt(0) === ".") return "";
		return token;
	}

	function resetCaptcha(panel, assign) {
		assign("");
		const widget = captchaWidget(panel);
		if (widget && widget.frcWidget && widget.frcWidget.reset) {
			try {
				widget.frcWidget.reset({ trigger: "root" });
			} catch (e) {}
		}
	}

	function mountLoginCaptcha() {
		if (loginCaptchaBound || !overlay) return;
		const widget = captchaWidget("auth-login-panel");
		if (!widget) return;
		loginCaptchaBound = true;
		bindCaptcha(widget, function (value) {
			captchaLogin = value;
		});
	}

	function mountRegisterCaptcha() {
		if (registerCaptchaBound || !overlay) return;
		const slot = overlay.querySelector("#register-captcha-slot");
		if (!slot) return;
		registerCaptchaBound = true;
		const widget = document.createElement("div");
		widget.className = "frc-captcha";
		widget.dataset.sitekey = SITEKEY;
		widget.dataset.start = "auto";
		widget.dataset.lang = "zh";
		slot.appendChild(widget);
		bindCaptcha(widget, function (value) {
			captchaRegister = value;
		});
	}

	function ensureOverlay() {
		if (overlay || !document.body) return overlay;
		overlay = document.createElement("div");
		overlay.className = "auth-overlay";
		overlay.innerHTML =
			'<div class="mask"></div>' +
			'<div class="alert" id="auth-login-panel">' +
			'<div class="alerttext">登录</div>' +
			'<div class="auth-body">' +
			'<label class="auth-line">用户名 <input id="login-username" maxlength="32" autocomplete="username"></label>' +
			'<label class="auth-line">密码 <input id="login-password" type="password" autocomplete="current-password"></label>' +
			'<div class="captcha"><div class="frc-captcha" data-sitekey="' +
			SITEKEY +
			'" data-start="auto" data-lang="zh"></div></div>' +
			'<div class="auth-msg" id="login-msg"></div>' +
			"</div>" +
			'<div class="alert-actions">' +
			'<button type="button" class="buttonnn graybutton left" id="auth-to-register">注册</button>' +
			'<button type="button" class="buttonnn redbutton right" id="auth-login-submit">登录</button>' +
			"</div></div>" +
			'<div class="alert" id="auth-register-panel" hidden>' +
			'<div class="alerttext">注册</div>' +
			'<div class="auth-body">' +
			'<form id="auth-register-form">' +
			'<label class="auth-line">用户名 <input id="reg-username" maxlength="32" autocomplete="username"></label>' +
			'<label class="auth-line">密码 <input id="reg-password" type="password" autocomplete="new-password"></label>' +
			'<label class="auth-line">确认密码 <input id="reg-confirm" type="password" autocomplete="new-password"></label>' +
			'<div class="captcha" id="register-captcha-slot"></div>' +
			'<div class="auth-msg" id="register-msg"></div>' +
			"</form></div>" +
			'<div class="alert-actions">' +
			'<button type="button" class="buttonnn graybutton left" id="auth-to-login">返回登录</button>' +
			'<button type="submit" form="auth-register-form" class="buttonnn redbutton right" id="auth-register-submit">注册</button>' +
			"</div></div>";
		document.body.appendChild(overlay);
		overlay
			.querySelector("#auth-to-register")
			.addEventListener("click", function () {
				setMode("register");
			});
		overlay
			.querySelector("#auth-to-login")
			.addEventListener("click", function () {
				setMode("login");
			});
		overlay
			.querySelector("#auth-login-submit")
			.addEventListener("click", submitLogin);
		overlay
			.querySelector("#auth-register-form")
			.addEventListener("submit", function (event) {
				event.preventDefault();
				submitRegister();
			});
		return overlay;
	}

	function setMode(next) {
		if (!overlay) return;
		const isLogin = next !== "register";
		overlay.querySelector("#auth-login-panel").hidden = !isLogin;
		overlay.querySelector("#auth-register-panel").hidden = isLogin;
		setMsg("login", "");
		setMsg("register", "");
		if (isLogin) {
			mountLoginCaptcha();
			const input = overlay.querySelector("#login-username");
			setTimeout(function () {
				if (overlay.style.display !== "none") input.focus();
			}, 30);
		} else {
			mountRegisterCaptcha();
			const input = overlay.querySelector("#reg-username");
			setTimeout(function () {
				if (overlay.style.display !== "none") input.focus();
			}, 30);
		}
	}

	function showLogin(nextMode) {
		if (!document.body) return;
		ensureOverlay();
		overlay.style.display = "block";
		document.body.style.overflow = "hidden";
		setMode(nextMode || "login");
	}

	function hideLogin() {
		if (!overlay) return;
		overlay.style.display = "none";
		document.body.style.overflow = "";
	}

	function setBusy(button, busy, label) {
		if (!button) return;
		button.disabled = busy;
		button.textContent = busy ? "请稍候…" : label;
	}

	async function submitLogin() {
		if (!overlay) return;
		const button = overlay.querySelector("#auth-login-submit");
		const username = overlay.querySelector("#login-username").value.trim();
		const password = overlay.querySelector("#login-password").value;
		if (!username) {
			setMsg("login", "请输入用户名");
			return;
		}
		if (!password) {
			setMsg("login", "请输入密码");
			return;
		}
		if (!getCaptchaToken("auth-login-panel", captchaLogin)) {
			setMsg("login", "请先完成人机验证");
			return;
		}
		setBusy(button, true, "登录");
		setMsg("login", "正在处理…", true);
		try {
			await login(username, password);
		} catch (error) {
			setMsg("login", error && error.message ? error.message : String(error));
			resetCaptcha("auth-login-panel", function (value) {
				captchaLogin = value;
			});
			setBusy(button, false, "登录");
		}
	}

	async function submitRegister() {
		if (!overlay) return;
		const button = overlay.querySelector("#auth-register-submit");
		const username = overlay.querySelector("#reg-username").value.trim();
		const password = overlay.querySelector("#reg-password").value;
		const confirm = overlay.querySelector("#reg-confirm").value;
		if (!username) {
			setMsg("register", "请输入用户名");
			return;
		}
		if (password.length < 6) {
			setMsg("register", "密码至少需要 6 位");
			return;
		}
		if (password !== confirm) {
			setMsg("register", "两次输入的密码不一致");
			return;
		}
		if (!getCaptchaToken("auth-register-panel", captchaRegister)) {
			setMsg("register", "请先完成人机验证");
			return;
		}
		setBusy(button, true, "注册");
		setMsg("register", "正在处理…", true);
		try {
			await register(username, password);
		} catch (error) {
			setMsg(
				"register",
				error && error.message ? error.message : String(error),
			);
			resetCaptcha("auth-register-panel", function (value) {
				captchaRegister = value;
			});
			setBusy(button, false, "注册");
		}
	}

	async function login(username, password) {
		const account = await readAccount(username);
		if (!account || account.data.username !== username) {
			throw new Error("用户不存在或密码错误");
		}
		const hash = await passwordHash(username, password);
		if (account.data.password !== hash) {
			throw new Error("用户不存在或密码错误");
		}
		const displayName =
			(account.data.settings && account.data.settings.lastName) || username;
		saveSession(username, displayName);
		finishLogin();
	}

	async function register(username, password) {
		if (!/^[\w\u4e00-\u9fa5.-]{1,32}$/.test(username)) {
			throw new Error("用户名只能包含中英文、数字和 _-.，长度 1-32");
		}
		const existing = await readAccount(username);
		if (existing) {
			throw new Error("该用户名已被注册");
		}
		const now = new Date().toISOString();
		const data = {
			username: username,
			password: await passwordHash(username, password),
			registeredAt: now,
			settings: { lastName: username, lastLogin: now },
			profile: { username: username, bio: "" },
		};
		const path = await accountPath(username);
		await apiWrite("POST", path, data, "register " + username);
		saveSession(username, username);
		finishLogin();
	}

	function finishLogin() {
		if (overlay) {
			setMsg("login", "登录成功，正在刷新…", true);
			setMsg("register", "登录成功，正在刷新…", true);
			setBusy(overlay.querySelector("#auth-login-submit"), true, "登录");
			setBusy(overlay.querySelector("#auth-register-submit"), true, "注册");
		}
		setTimeout(function () {
			window.location.reload();
		}, 300);
	}

	async function setDisplayName(name) {
		const session = getSession();
		if (!session) {
			setCookie("n", name);
			return;
		}
		const account = await readAccount(session.username);
		if (!account) {
			saveSession(session.username, name);
			return;
		}
		account.data.settings = account.data.settings || {};
		account.data.settings.lastName = name;
		account.data.profile = account.data.profile || {};
		account.data.profile.username = account.data.username;
		await apiWrite(
			"PUT",
			account.path,
			account.data,
			"rename " + session.username,
			account.sha,
		);
		saveSession(session.username, name);
		renderStatus();
	}

	async function getProfile(username) {
		const account = await readAccount(username);
		if (!account || account.data.username !== username) return null;
		const data = account.data;
		delete data.password;
		return data;
	}

	function currentUser() {
		const session = getSession();
		return session ? session.username : "";
	}

	function getDisplayName() {
		const session = getSession();
		return session ? session.displayName : "";
	}

	function isLoggedIn() {
		return !!getSession();
	}

	function isRequired() {
		try {
			if (document.body && document.body.dataset.authRequired === "true") {
				return true;
			}
			if (
				window.top !== window &&
				window.top.document &&
				window.top.document.body &&
				window.top.document.body.dataset.authRequired === "true"
			) {
				return true;
			}
		} catch (e) {}
		return false;
	}

	function renderStatus() {
		const el = document.getElementById("auth-status");
		if (!el) return;
		const session = getSession();
		el.textContent = "";
		if (!session) return;
		const span = document.createElement("span");
		span.textContent = "当前用户：" + session.username + " ";
		const button = document.createElement("button");
		button.type = "button";
		button.className = "buttonnn graybutton";
		button.textContent = "退出登录";
		button.addEventListener("click", logout);
		el.appendChild(span);
		el.appendChild(button);
	}

	function logout() {
		try {
			localStorage.removeItem(SESSION_KEY);
		} catch (e) {}
		deleteCookie("n");
		deleteCookie("auth");
		window.location.reload();
	}

	function showLoginWhenRequired() {
		renderStatus();
		if (
			document.body &&
			document.body.dataset.authRequired === "true" &&
			!getSession()
		) {
			showLogin("login");
		}
	}

	window.Auth = {
		showLogin: showLogin,
		logout: logout,
		login: login,
		register: register,
		currentUser: currentUser,
		getDisplayName: getDisplayName,
		setDisplayName: setDisplayName,
		getProfile: getProfile,
		isLoggedIn: isLoggedIn,
		isRequired: isRequired,
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", showLoginWhenRequired);
	} else {
		showLoginWhenRequired();
	}
})();
