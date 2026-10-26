(function () {
  var form = document.getElementById("login-form");
  var user = document.getElementById("login-user");
  var password = document.getElementById("login-password");
  var captcha = document.getElementById("login-captcha");
  var captchaButton = document.getElementById("captcha-code");
  var message = document.getElementById("login-message");
  var codes = ["DWE8", "AI26", "8DWE", "DW56"];
  var codeIndex = 0;
  function notify(text, error) {
    message.textContent = text;
    message.className = "login-message show" + (error ? " error" : "");
    setTimeout(function () { message.className = "login-message"; }, 1800);
  }
  captchaButton.addEventListener("click", function () {
    codeIndex = (codeIndex + 1) % codes.length;
    captchaButton.textContent = codes[codeIndex];
    captcha.value = codes[codeIndex];
    notify("验证码已刷新");
  });
  document.getElementById("toggle-password").addEventListener("click", function () {
    var visible = password.type === "text";
    password.type = visible ? "password" : "text";
    this.textContent = visible ? "◉" : "◎";
    this.setAttribute("aria-label", visible ? "显示密码" : "隐藏密码");
  });
  document.getElementById("forgot-password").addEventListener("click", function () { notify("请联系平台管理员重置密码"); });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!user.value.trim() || !password.value.trim()) return notify("请输入账号和密码", true);
    if (captcha.value.trim().toUpperCase() !== captchaButton.textContent) return notify("验证码不正确", true);
    sessionStorage.setItem("dweUser", user.value.trim());
    notify("登录成功，正在进入数据看板");
    setTimeout(function () { window.location.href = "首页-AI行为分析数据看板.html"; }, 650);
  });
})();
