function form_action(type) { // 修改 form_action 的定义方式为普通函数

    return function () { // form_action 函数返回一个函数
        document.getElementsByClassName("overlay")[0].classList.remove("hidden");
        document.getElementsByClassName("login-div")[0].classList.remove("hidden");

        const usernameInput = document.querySelector('.username-input');
        const passwordQuestionDiv = document.querySelector('.password-question-div');
        const passwordReplyDiv = document.querySelector('.password-reply-div');

        usernameInput.addEventListener('blur', function () {
            const username = usernameInput.value;
            if (username.trim() !== "") {
                passwordQuestionDiv.classList.remove('hidden');
                passwordReplyDiv.classList.remove('hidden');
            }
        });

        if (type === "register") {
            const passwordInput = document.querySelector('.password-input');
            passwordInput.addEventListener('blur', function () {
                const password = passwordInput.value;
                if (password.trim() !== "") {
                    document.querySelector('.password-confirm-question-div ').classList.remove('hidden');
                    document.querySelector('.password-confirm-reply-div ').classList.remove('hidden');
                }
            });

            const passwordConfirmInput = document.querySelector('.password-confirm-input');
            passwordConfirmInput.addEventListener('blur', function () {
                const password = passwordInput.value;
                const passwordConfirm = passwordConfirmInput.value;
                if (password.trim() !== "" && passwordConfirm.trim() !== "") {
                    if (password !== passwordConfirm) {
                        alert('Your password is not the same!');
                    } else {
                        document.querySelector('.email-question-div').classList.remove('hidden');
                        document.querySelector('.email-reply-div').classList.remove('hidden');
                    }
                }
            });
        }

        const cancelButton = document.querySelector('.cancel-button');
        cancelButton.addEventListener('click', function () {
            document.getElementsByClassName("overlay")[0].classList.add("hidden");
            document.getElementsByClassName("login-div")[0].classList.add("hidden");
            usernameInput.value = '';
            passwordQuestionDiv.classList.add('hidden');
            passwordReplyDiv.classList.add('hidden');
        });

        const submitButton = document.querySelector('.submit-button');
        submitButton.addEventListener('click', function () {
            const username = usernameInput.value;
            const passwordReply = document.querySelector('.password-input').value;

            if (type === "login") {
                if (username.trim() === "" || passwordReply.trim() === "") {
                    alert('Your username or password is empty!');
                } else {
                    document.getElementById("login-username").value = username;
                    document.getElementById("login-password").value = passwordReply;
                    document.getElementsByClassName("login-form")[0].submit();
                }
            }
            if (type === "register") {
                const email = document.querySelector('.email-input').value;
                if (username.trim() === "" || passwordReply.trim() === "" || email.trim() === "") {
                    alert('Your username or password or email is empty!');
                } else {
                    document.getElementById("register-username").value = username;
                    document.getElementById("register-password").value = passwordReply;
                    document.getElementById("register-email").value = email;
                    document.getElementsByClassName("register-form")[0].submit();
                }
            }
        });
    };
}


document.getElementsByClassName("login_tag")[0].addEventListener("click", form_action("login")); //  传递 form_action("login") 函数的返回值 (一个函数)
document.getElementsByClassName("register_tag")[0].addEventListener("click", form_action("register")); // 传递 form_action("register") 函数的返回值 (一个函数)

const queryString = window.location.search;
if (queryString !== "") {
    const urlParams = new URLSearchParams(queryString);
    const hasAction = urlParams.has('action');

    if (hasAction) {
        action = urlParams.get("action");
        if (action === "login") {
            back_url = urlParams.get("back_url");
            if (back_url !== null) {
                document.getElementById("login-back-url").value = back_url;
            }
            document.getElementsByClassName("login_tag")[0].click();
        }
        if (action === "register") {
            document.getElementsByClassName("register_tag")[0].click();
        }
    }
}