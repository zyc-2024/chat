var editorUsername = getCookie("uname");
var statusMessage = document.getElementById("status");
var finishButton = document.getElementById("finish");

function showStatus(message) {
	statusMessage.textContent = message;
}

function decryptProfile(record, session) {
	try {
		return { profile: _decrypt(record, session), session: session };
	} catch (error) {
		if (/^[a-f0-9]{64}$/i.test(session)) {
			throw error;
		}
		var hashedSession = CryptoJS.SHA256(session).toString(CryptoJS.enc.Hex);
		return { profile: _decrypt(record, hashedSession), session: hashedSession };
	}
}

function loadProfile() {
	var session = getCookie("session");
	if (!editorUsername || !session) {
		showStatus("请先登录后再编辑个人资料。");
		return;
	}

	var path = "users/" + editorUsername + ".json";
	get(
		path,
		function (record) {
			try {
				var decrypted = decryptProfile(record, session);
				if (decrypted.session !== session) {
					setCookie("session", decrypted.session);
				}
				document.getElementById("avatar").value = decrypted.profile.avatar || "";
				document.getElementById("background").value = decrypted.profile.pf_header || "";
				document.getElementById("custom-text").value = decrypted.profile.pf_text || "";
				document.getElementById("profile-info").value = decrypted.profile.profile || "";
				showStatus("");
				finishButton.disabled = false;
			} catch (error) {
				console.error("Unable to decrypt profile:", error);
				showStatus("无法读取个人资料，请确认登录状态后重试。");
			}
		},
		function () {
			showStatus("读取个人资料失败，请稍后重试。");
		},
	);
}

function showSavingMessage(message) {
	var heading = document.createElement("h1");
	heading.className = "page-message";
	heading.textContent = message;
	document.body.replaceChildren(heading);
}

function saveProfile() {
	var username = getCookie("uname");
	var session = getCookie("session");
	if (!username || !session || username !== editorUsername) {
		showSavingMessage("登录状态已失效，请重新登录后再试。");
		return;
	}

	var changes = {
		avatar: document.getElementById("avatar").value.trim(),
		pf_header: document.getElementById("background").value.trim(),
		pf_text: document.getElementById("custom-text").value,
		profile: document.getElementById("profile-info").value,
	};
	showSavingMessage("保存修改中，请稍后……");

	var path = "users/" + username + ".json";
	var publicPath = "ronly/" + path;
	get(
		path,
		function (record, privateSha) {
			var decrypted;
			var updatedProfile;
			var encryptedProfile;
			try {
				decrypted = decryptProfile(record, session);
				updatedProfile = Object.assign({}, decrypted.profile, changes);
				encryptedProfile = _encrypt(updatedProfile, decrypted.session);
				if (decrypted.session !== session) {
					setCookie("session", decrypted.session);
				}
			} catch (error) {
				console.error("Unable to prepare profile update:", error);
				showSavingMessage("无法解密个人资料，修改未保存。");
				return;
			}

			get(
				publicPath,
				function (publicProfile, publicSha) {
					var safeProfile = {
						user: updatedProfile.user,
						pf_header: updatedProfile.pf_header,
						avatar: updatedProfile.avatar,
						profile: updatedProfile.profile,
						pf_text: updatedProfile.pf_text,
					};
					var message = "user_profile_update_" + new Date().toISOString() + "_" + username;
					put(
						path,
						message,
						encryptedProfile,
						privateSha,
						function () {
							put(
								publicPath,
								message,
								safeProfile,
								publicSha,
								function () {
									window.location.href = "user.html?u=" + encodeURIComponent(username);
								},
								function (error) {
									console.error("Unable to update public profile:", error);
									showSavingMessage("私有资料已保存，但公开资料更新失败，请重新编辑后重试。");
								},
							);
						},
						function (error) {
							console.error("Unable to save private profile:", error);
							showSavingMessage("保存失败，请稍后重试。");
						},
					);
				},
				function (error) {
					console.error("Unable to read public profile:", error);
					showSavingMessage("无法读取公开资料，修改未保存。");
				},
			);
		},
		function (error) {
			console.error("Unable to read private profile:", error);
			showSavingMessage("无法读取个人资料，修改未保存。");
		},
	);
}

document.getElementById("profile-form").addEventListener("submit", function (event) {
	event.preventDefault();
	saveProfile();
});
loadProfile();
