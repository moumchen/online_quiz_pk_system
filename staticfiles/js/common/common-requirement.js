const overlay = document.getElementsByClassName("overlay")[0];
const loginDiv = document.getElementsByClassName("login-div")[0];
const fieldInput = document.querySelector('.field-input');
const difficultyDiv = document.querySelector('.difficulty-question-div');
const difficultyReplyDiv = document.querySelector('.difficulty-reply-div');
const difficultyInput = document.querySelector('.difficulty-input');
const numberQuestionDiv = document.querySelector('.number-question-div ');
const numberReplyDiv = document.querySelector('.number-reply-div ');
const numberInput = document.querySelector('.number-input');
const cancelButton = document.querySelector('.cancel-button');
const submitButton = document.querySelector('.submit-button');

function resetForm() { // reset form to initial state
    overlay.classList.add("hidden");
    loginDiv.classList.add("hidden");
    fieldInput.value = '';
    difficultyDiv.classList.add('hidden');
    difficultyReplyDiv.classList.add('hidden');
    difficultyInput.value = '';
    numberQuestionDiv.classList.add('hidden');
    numberReplyDiv.classList.add('hidden');
    numberInput.value = '';
}

function form_action(type) {
    return function () {
        overlay.classList.remove("hidden");
        loginDiv.classList.remove("hidden");
        numberQuestionDiv.classList.add('hidden');
        numberReplyDiv.classList.add('hidden');
    };
}

fieldInput.addEventListener('blur', function () {
    const field = fieldInput.value;
    if (field.trim() !== "") {
        difficultyDiv.classList.remove('hidden');
        difficultyReplyDiv.classList.remove('hidden');
    }

});

difficultyInput.addEventListener('blur', function () {
    const difficulty = difficultyInput.value;
    if (difficulty.trim() !== "") {
        numberQuestionDiv.classList.remove('hidden');
        numberReplyDiv.classList.remove('hidden');
    }
});


cancelButton.addEventListener('click', function (){
    // 返回上一页
    window.history.back();
});

submitButton.addEventListener('click', function () {
    const field = fieldInput.value;
    const difficulty = difficultyInput.value;
    const number = numberInput.value;

    if (field.trim() === "" || difficulty.trim() === "" || number.trim() === "") {
        alert("Please fill in all fields");
        return;
    }
    // number field should be integer
    if (isNaN(parseInt(number))) {
        alert("Please enter a valid number");
        return;
    }
    if (parseInt(number) < 1 || parseInt(number) > 10) {
        alert("Number of questions should be between 1 and 10");
        return;
    }

    // send data to server
    document.getElementsByClassName("overlay")[0].classList.remove("hidden");
    document.getElementsByClassName("generating-tip")[0].classList.remove("hidden");
    let quiz_type = document.getElementsByClassName("quiz-type")[0].innerHTML;
    fetch('/common/generate_quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({'topic': field, "difficulty": difficulty, num_questions: number}),

    }).then(response => response.json()).then(data => {
        if (data.status === 'success') {
            let quiz_id = data.generation_id;

            // two ways to send data to server : 1. single player, 2- multiplayer
            if (quiz_type === "single") {
                 // redirect to multiplayer page
                window.location.href = `/singleplayer/battle?quiz_id=${quiz_id}`;
            } else if (quiz_type === "multi") {
                // redirect to multiplayer page
                window.location.href = `/multiplayer/create-room?quiz=${quiz_id}`;
            }
        } else {
            window.location.href = "/common/info?error=Generation failed, please try again";
        }
    });


});