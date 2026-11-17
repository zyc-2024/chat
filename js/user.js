var uname = getarg().u || "";
var path = "ronly/users/" + uname + ".json";
var profile = null;
__name__ = "not_main";
get(
	path,
	(r, ...t) => {
		profile = r;
		$(".name").text(profile.user);
		$("title").text(profile.user+"的个人主页")
		$(".bg-image").css("background-image", "url('" + profile.pf_header + "')");
		$(".pfp").attr("src", profile.avatar);
		$(".info").html(window.renderMarkdown(profile.profile || ""));
		$(".customtext").html(window.renderMarkdown(profile.pf_text || ""));
		hljs.highlightAll();
		if (getCookie("uname") === uname) {
			$(".edit-button").prop("hidden", false);
		}
	},
	() => {
		$(".name").text("没这个用户!");
	},
);
