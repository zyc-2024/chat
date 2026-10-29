var uname = new URLSearchParams(window.location.search).get("u") || "";
var path = "ronly/users/" + uname + ".json";
var profile = null;
__name__ = "not_main";
get(
	path,
	(r, ...t) => {
		profile = r;
		$(".name").text(profile.user);
		$(".bg-image").css("background-image", "url('" + profile.pf_header + "')");
		$(".pfp").attr("src", profile.avatar);
		$(".info").text(profile.profile);
		$(".customtext").text(profile.pf_text);
		if (getCookie("uname") === uname) {
			$(".edit-button").prop("hidden", false);
		}
	},
	() => {
		$(".name").text("无法加载用户资料");
	},
);
