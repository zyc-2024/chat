var un = getCookie("uname");
var finishButton = document.getElementById("ok_btn");

function errtxt() {
	document.getElementsByClassName("showresult")[0].style.display = "block";
}

function decprofile(record, session) {
	try {
		return { profile: _decrypt(record, session), session: session };
	} catch (error) {
		if (/^[a-f0-9]{64}$/i.test(session)) {
			throw error;
		}
		var hs = CryptoJS.SHA256(session).toString(CryptoJS.enc.Hex);
		return { profile: _decrypt(record, hs), session: hs };
	}
}

function loadProfile() {
	var session = getCookie("session");
	if (!un || !session) {
		errtxt();
		return;
	}

	var path = "users/" + un + ".json";
	get(
		path,
		function (record) {
			try {
				var decrypted = decprofile(record, session);
				if (decrypted.session !== session) {
					setCookie("session", decrypted.session);
				}
				document.getElementById("preview1").value = decrypted.profile.avatar || "";
				document.getElementById("preview4").value = decrypted.profile.pf_header || "";
				document.getElementById("editor3").value = decrypted.profile.pf_text || "";
				document.getElementById("editor2").value = decrypted.profile.profile || "";
				// errtxt("");

				// render2();
				// render3();
				finishButton.disabled = false;
			} catch (error) {
				console.error("Unable to decrypt profile:", error);
				errtxt();
			}
		},
		function () {
			errtxt();
		},
	);
}

function saveProfile() {
	var username = getCookie("uname");
	var session = getCookie("session");
	if (!username || !session || username !== un) {
		errtxt();
		return;
	}

	var changes = {
		avatar: document.getElementById("preview1").value.trim(),
		pf_header: document.getElementById("preview4").value.trim(),
		pf_text: document.getElementById("editor3").value,
		profile: document.getElementById("editor2").value,
	};
	errtxt();

	var path = "users/" + username + ".json";
	var publicPath = "ronly/" + path;
	get(
		path,
		function (record, privateSha) {
			var decrypted;
			var updatedProfile;
			var encryptedProfile;
			try {
				decrypted = decprofile(record, session);
				updatedProfile = Object.assign({}, decrypted.profile, changes);
				encryptedProfile = _encrypt(updatedProfile, decrypted.session);
				if (decrypted.session !== session) {
					setCookie("session", decrypted.session);
				}
			} catch (error) {
				console.error(error);
				errtxt();
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
									console.error(error);
									// errtxt();
								},
							);
						},
						function (error) {
							console.error(error);
							errtxt();
						},
					);
				},
				function (error) {
					console.error(error);
					errtxt();
				},
			);
		},
		function (error) {
			console.error(error);
			errtxt();
		},
	);
}

document.getElementById("ok_btn").addEventListener("click", function (event) {
	event.preventDefault();
	saveProfile();
});
loadProfile();
