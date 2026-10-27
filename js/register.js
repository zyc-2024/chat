function register(username, password) {
	$.ajax({
		url: "https://global.frcapi.com/api/v2/captcha/siteverify",
		crossDomain: true,
		method: "post",
		headers: {
			"X-API-Key": "apikey_fc2bLLdeen_MYPz0qV4NbLu7SWFn0IcZUq8CBFR3sWy",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "*",
		},
		body: {
			response: $(".frc-captcha>input")[0].value,
		},
	}).then(function (response) {
		console.log(response);
		return typeof response === "string" ? JSON.parse(response) : response;
	});
}
