let currentFormType = null; // this variable is used to store the current form type, which is "login" or "register"

const overlay = document.getElementsByClassName("overlay")[0];
const loginDiv = document.getElementsByClassName("login-div")[0];
const usernameInput = document.querySelector('.username-input');
const passwordQuestionDiv = document.querySelector('.password-question-div');
const passwordReplyDiv = document.querySelector('.password-reply-div');
const passwordInput = document.querySelector('.password-input');
const passwordConfirmQuestionDiv = document.querySelector('.password-confirm-question-div ');
const passwordConfirmReplyDiv = document.querySelector('.password-confirm-reply-div ');
const passwordConfirmInput = document.querySelector('.password-confirm-input');
const emailQuestionDiv = document.querySelector('.email-question-div');
const emailReplyDiv = document.querySelector('.email-reply-div');
const emailInput = document.querySelector('.email-input');
const cancelButton = document.querySelector('.cancel-button');
const submitButton = document.querySelector('.submit-button');
const switchType = document.querySelector('.switch_a_tag');

function resetForm() { // reset form to initial state
    overlay.classList.add("hidden");
    loginDiv.classList.add("hidden");
    usernameInput.value = '';
    passwordQuestionDiv.classList.add('hidden');
    passwordReplyDiv.classList.add('hidden');
    passwordInput.value = '';
    passwordConfirmQuestionDiv.classList.add('hidden');
    passwordConfirmReplyDiv.classList.add('hidden');
    passwordConfirmInput.value = '';
    emailQuestionDiv.classList.add('hidden');
    emailReplyDiv.classList.add('hidden');
    emailInput.value = '';
    currentFormType = null; // set current form type to null
    switchType.innerHTML = "";
    switchType.setAttribute('href', '');
    // redirect to homepage
    window.location.href = "/";
}

function form_action(type) {
    return function () {
        currentFormType = type; // set current form type to the type of the form
        overlay.classList.remove("hidden");
        loginDiv.classList.remove("hidden");

        // when the form type is "login", hide password confirm and email related elements
        if (type === "login") {
            passwordConfirmQuestionDiv.classList.add('hidden');
            passwordConfirmReplyDiv.classList.add('hidden');
            emailQuestionDiv.classList.add('hidden');
            emailReplyDiv.classList.add('hidden');
            // set switch tag
            switchType.innerHTML = "Switch to Sign Up";
            href = window.location.href;
            if (href.includes("action")) {
                switchType.href = href.replace("action=login", "action=register");
            } else {
                switchType.href = href + "?action=register";
            }
        } else if (type === "register") {
            switchType.innerHTML = "Already have an account? Log In";
            switchType.href = window.location.href.replace("action=register", "action=login");
            if (href.includes("action")) {
                switchType.href = href.replace("action=register", "action=login");
            } else {
                switchType.href = href + "?action=login";
            }
        }
    };
}

usernameInput.addEventListener('blur', function () {
    const username = usernameInput.value;
    if (username.trim() !== "") {
        if (currentFormType === "register") { // if the form type is "register", show password confirm related elements
            fetch(`/common/checkUsername?checked_username=${username}`)
                .then(response => response.json())
                .then(data => {
                    // if the username has been registered, the result will be true
                    if (data.result) {
                        alert('This username has been registered!');
                        usernameInput.value = '';
                    }
                });
        }
        passwordQuestionDiv.classList.remove('hidden');
        passwordReplyDiv.classList.remove('hidden');
    }

});

passwordInput.addEventListener('blur', function () {
    const password = passwordInput.value;
    if (password.trim() !== "") {
        if (currentFormType === "register") { // if the form type is "register", show password confirm related elements
            passwordConfirmQuestionDiv.classList.remove('hidden');
            passwordConfirmReplyDiv.classList.remove('hidden');
        }
    }
});

passwordConfirmInput.addEventListener('blur', function () {
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    // when this input is shown, it means the form type is "register"
    // so we don't need to check the form type here
    if (password.trim() !== "" && passwordConfirm.trim() !== "") {
        if (password !== passwordConfirm) {
            alert('Your password is not the same!');
        } else {
            emailQuestionDiv.classList.remove('hidden');
            emailReplyDiv.classList.remove('hidden');
        }
    }
});

cancelButton.addEventListener('click', resetForm); // reset form when click cancel button

submitButton.addEventListener('click', function () {
    const username = usernameInput.value;
    const passwordReply = passwordInput.value;

    if (currentFormType === "login") {
        if (username.trim() === "" || passwordReply.trim() === "") {
            alert('Your username or password is empty!');
        } else {
            document.getElementById("login-username").value = username;
            document.getElementById("login-password").value = passwordReply;
            document.getElementsByClassName("login-form")[0].submit();
        }
    } else if (currentFormType === "register") {
        const email = emailInput.value;
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

const loginTags = document.getElementsByClassName("login_tag");
if (loginTags.length > 0) {
    loginTags[0].addEventListener("click", form_action("login"));
}
const registerTags = document.getElementsByClassName("register_tag");
if (registerTags.length > 0) {
    registerTags[0].addEventListener("click", form_action("register"));
}

// supporting login and register actions when open current page
// and after login or register, supporting to return to the original page
const queryString = window.location.search;
if (queryString !== "") {
    const urlParams = new URLSearchParams(queryString);
    const hasAction = urlParams.has('action');

    if (hasAction) {
        action = urlParams.get("action");
        if (action === "login") {
            next_url = urlParams.get("next");
            if (next_url !== null) {
                document.getElementById("next_url").value = next_url;
            }
            document.getElementsByClassName("login_tag")[0].click();
        }
        if (action === "register") {
            document.getElementsByClassName("register_tag")[0].click();
        }
    }
}

// Add event listener to the single player button and multiplayer button here
document.getElementsByClassName("multiplayer-button")[0].addEventListener("click", function () {
    window.location.href = "/multiplayer/index";
});

document.getElementsByClassName("single-player-button")[0].addEventListener("click", function () {
    window.location.href = "/singleplayer/index";
});

// -----
