const form = document.querySelector("#auth-form");
const message = document.querySelector("#message");
const submitButton = document.querySelector("#submit-button");
const submitLabel = submitButton.querySelector("span");
const modeButton = document.querySelector("#mode-button");
const modePrompt = document.querySelector("#mode-prompt");
const formTitle = document.querySelector("#form-title");
const formDescription = document.querySelector("#form-description");
const passwordInput = form.elements.password;
const passwordHint = document.querySelector("#password-hint");
const passwordToggle = document.querySelector("#password-toggle");
let isRegistering = false;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

modeButton.addEventListener("click", () => {
  isRegistering = !isRegistering;
  formTitle.textContent = isRegistering ? "إنشاء حساب جديد" : "تسجيل الدخول";
  formDescription.textContent = isRegistering
    ? "أنشئ حسابك وابدأ رحلتك التعليمية."
    : "أدخل بياناتك للمتابعة إلى حسابك.";
  submitLabel.textContent = isRegistering ? "إنشاء الحساب" : "دخول إلى حسابي";
  modePrompt.textContent = isRegistering ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟";
  modeButton.textContent = isRegistering ? "سجّل الدخول" : "أنشئ حساباً جديداً";
  passwordInput.autocomplete = isRegistering ? "new-password" : "current-password";
  passwordHint.hidden = !isRegistering;
  showMessage("");
});

passwordToggle.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  passwordToggle.setAttribute("aria-pressed", String(!isVisible));
  passwordToggle.setAttribute(
    "aria-label",
    isVisible ? "إظهار كلمة المرور" : "إخفاء كلمة المرور"
  );
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");
  submitButton.disabled = true;
  modeButton.disabled = true;
  submitLabel.textContent = isRegistering ? "جارٍ إنشاء الحساب..." : "جارٍ تسجيل الدخول...";

  try {
    const response = await fetch(isRegistering ? "/api/register" : "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.elements.username.value,
        password: passwordInput.value
      })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "تعذّر إكمال الطلب. حاول مرة أخرى.");
    }

    if (!isRegistering) {
      sessionStorage.setItem("studentName", form.elements.username.value.trim());
      window.location.assign("/dashboard.html");
      return;
    }

    showMessage(result.message);
    if (isRegistering) {
      isRegistering = false;
      formTitle.textContent = "تسجيل الدخول";
      formDescription.textContent = "تم إنشاء حسابك. أدخل بياناتك لتسجيل الدخول.";
      submitLabel.textContent = "دخول إلى حسابي";
      modePrompt.textContent = "ليس لديك حساب؟";
      modeButton.textContent = "أنشئ حساباً جديداً";
      passwordInput.autocomplete = "current-password";
      passwordHint.hidden = true;
      passwordInput.value = "";
      passwordInput.focus();
    }
  } catch (error) {
    showMessage(
      error instanceof TypeError ? "تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً." : error.message,
      true
    );
  } finally {
    submitButton.disabled = false;
    modeButton.disabled = false;
    submitLabel.textContent = isRegistering ? "إنشاء الحساب" : "دخول إلى حسابي";
  }
});
