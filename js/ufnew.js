function sc(s) {
	if (s < 1024) {
		return s + "B";
	} else if (s < 1048576) {
		return (s / 1024).toFixed(2) + "KB";
	} else {
		return (s / 1048576).toFixed(2) + "MB";
	}
}
function fb64(buffer) {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
async function fmd5(arrayBuffer) {
	return SparkMD5.ArrayBuffer.hash(arrayBuffer);
}

let f = document.getElementById("i");
let s = document.getElementById("s");
let l = document.getElementById("l");
let m = document.getElementById("l2");
function udf() {
	let file = f.files[0];
	if (file) {
		// fmd5(file).then((md5) => {
		s.innerHTML =
			"选择了：" +
			file.name +
			"<br>大小：" +
			sc(file.size) /* + "<br>MD5：" + md5*/;
		// });
	} else {
		s.innerHTML = "你选了个寂寞a";
	}
}
// const octokit = new Octokit({
// 	auth: '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'
// })
/*const data = '{"message":"my commit message","committer":{"name":"Monalisa Octocat","email":"octocat@github.com"},"content":"bXkgbmV3IGZpbGUgY29udGVudHM="}';

let xhr = new XMLHttpRequest();
xhr.withCredentials = true;
xhr.open('PUT', 'https://api.github.com/repos/OWNER/REPO/contents/PATH');
xhr.setRequestHeader('Accept', 'application/vnd.github+json');
xhr.setRequestHeader('Authorization', 'Bearer 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');
xhr.setRequestHeader('X-GitHub-Api-Version', '2022-11-28');
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

xhr.onload = function() {
};

xhr.send(data); */
// await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
// 	owner: 'OWNER',
// 	repo: 'REPO',
// 	path: 'PATH',
// 	message: 'my commit message',
// 	committer: {
// 		name: 'Monalisa Octocat',
// 		email: 'octocat@github.com'
// 	},
// 	content: 'bXkgbmV3IGZpbGUgY29udGVudHM=',
// 	headers: {
// 		'X-GitHub-Api-Version': '2022-11-28'
// 	}
// });
function upf() {
	let file = f.files[0];
	if (!file) {
		alert("没文件你传什么传？");
		return;
	}
	if (file.size >= 104857600) {
		// 100MB
		alert("文件太大了，不能超过100MB！");
	}
	if (m) {
		m.innerText = "已经开始上传了，请勿重复点击！";
	}
	document.getElementById("p1b").innerText = "读取中……";
	var fr = new FileReader();
	fr.readAsArrayBuffer(file);
	document.getElementById("p1b").innerText = "读取完成！";
	fr.onload = function () {
		var b64ab = fb64(fr.result);
		fmd5(fr.result).then((md5) => {
			const data = JSON.stringify({
				"message": "api-u-n[" + file.name + "]-s[" + file.size + "]-md5[" + md5 + ']',
				"committer": {
					"name": "zyc-2024",
					"email": "61992011@qq.com"
				},
				"content": b64ab
			});

			let xhr = new XMLHttpRequest();
			xhr.withCredentials = true;
			xhr.open('PUT', 'https://api.github.com/repos/zyc-2024/chat-file/contents/f/' +
				md5.slice(0, 6) +
				"%2F" +
				encodeURIComponent(file.name));
			xhr.setRequestHeader('Accept', 'application/vnd.github+json');
			xhr.setRequestHeader('Authorization', 'Bearer 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');
			xhr.setRequestHeader('X-GitHub-Api-Version', '2022-11-28');
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.upload.onprogress = function (e) {
				if (e.lengthComputable) {
					let percent = e.loaded / e.total;
					document.getElementById("p2a").value = percent;
					document.getElementById("p2b").innerText =
						sc(e.loaded) + " / " + sc(e.total);
				}
			};
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (l.innerHTML === "输出在这里！！") {
						l.innerHTML = "";
					}
					if (
						(xhr.status >= 200 && xhr.status < 300) ||
						xhr.responseText == { message: "文件名已存在" }
					) {
						// fetch('https://api.github.com/repos/OWNER/REPO/contents/PATH', {
						//   headers: {
						//     'Accept': 'application/vnd.github.object',
						//     'Authorization': 'Bearer <YOUR-TOKEN>',
						//     'X-GitHub-Api-Version': '2022-11-28'
						//   }
						// });
						l.innerHTML =
							"上传成功！这是链接：<br><code class='l'>https://gitee.com/api/v5/repos/zyc-2024/chat/raw/f%2F" +
							md5.slice(0, 6) +
							"%2F" +
							encodeURIComponent(file.name) +
							"?access_token=19f7b43872c256d52d1bc71cbd2d0ffa)</code><br><br>" +
							l.innerHTML;
					} else {
						console.error("上传失败：", xhr.status, xhr.statusText);
						l.innerHTML =
							"上传失败！这是链接：<br><code class='l'>https://gitee.com/api/v5/repos/zyc-2024/chat/raw/f%2F" +
							md5.slice(0, 6) +
							"%2F" +
							encodeURIComponent(file.name) +
							"?access_token=19f7b43872c256d52d1bc71cbd2d0ffa)</code><br><br>" +
							l.innerHTML;
					}
				}
			};
			xhr.send(data);
		});
	};

	document.getElementById("p1b").innerText = "";
}
