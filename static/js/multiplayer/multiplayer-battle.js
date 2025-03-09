const matchId = document.getElementsByClassName("match_id")[0];
const currentUserId = document.getElementsByClassName("current_user_id")[0];
const currentUsername = document.getElementsByClassName("current_username")[0];
const opponentUserId = document.getElementsByClassName("opponent_user_id")[0];
const opponentUsername = document.getElementsByClassName("opponent_username")[0];
const waitingConnectTip = document.getElementsByClassName("waiting-connect-tips")[0];
const overlay = document.getElementsByClassName("overlay")[0];
const startGameTip = document.getElementsByClassName("start-tips")[0];
const timeLimit = document.getElementsByClassName("time_limit")[0];
const countdown = document.getElementsByClassName("countdown")[0];
const waitingFinishTip = document.getElementsByClassName("waiting-finish-tips")[0];
const matchState = document.getElementsByClassName("match_state")[0];
const questionTitle = document.getElementsByClassName("question-title")[0];
const questionOptionA = document.getElementsByClassName("question-option-a")[0];
const questionOptionB = document.getElementsByClassName("question-option-b")[0];
const questionOptionC = document.getElementsByClassName("question-option-c")[0];
const questionOptionD = document.getElementsByClassName("question-option-d")[0];
const rightProgress = document.getElementsByClassName("right-progress")[0];
const leftProgress = document.getElementsByClassName("left-progress")[0];
const leftUsername = document.getElementsByClassName("left-username")[0];
const rightUsername = document.getElementsByClassName("right-username")[0];
const leftScore = document.getElementsByClassName("left-score")[0];
const rightScore = document.getElementsByClassName("right-score")[0];


// ------ websocket connection ------

let websocket;

document.addEventListener('DOMContentLoaded', () => {
    leftUsername.innerHTML = currentUsername.value;
    rightUsername.innerHTML = opponentUsername.value;
    connectWebSocket();
});


let reconnecting = false; // a marker to indicate if the client is currently reconnecting
let reconnectionDelay = 1000; //  initial reconnection delay in milliseconds
const maxReconnectionDelay = 30000; // the maximum reconnection delay in milliseconds
let isPageUnloading = false;
let isVoluntarilyLeaving = false;
let answerAMessage;
let answerBMessage;
let answerCMessage;
let answerDMessage;
let questionStartTime; // used to calculate the time used to answer the question


window.onbeforeunload = function () {
    isPageUnloading = true;
};

function connectWebSocket() {
    if (reconnecting) { // if already reconnecting, skip
        console.log("Already reconnecting, skipping...");
        return;
    }

    const host = window.location.host;
    const wsUrl = `ws://${host}/ws/match/`;

    websocket = new WebSocket(wsUrl);

    websocket.onopen = (event) => {
        console.log("WebSocket Connected");
        reconnecting = false; // reset reconnecting flag
        reconnectionDelay = 1000; // reset reconnection delay
        // ------ try to join the match
        joinMessage = {"message_type": "join_in_the_match", "match_id": matchId.value, "user_id": currentUserId.value}
        sendMessage(JSON.stringify(joinMessage));
        // ------ waiting for the opponent
        waitingConnectTip.classList.remove("hidden");
        overlay.classList.remove("hidden");
    };

    websocket.onmessage = (event) => {
        console.log("Received Message:", event.data);
        const message = JSON.parse(event.data);
        messageType = message['type']
        let joinedUserId;
        let leftUserId;
        let countdownTimer;
        if (messageType === 'error') {
            alert(message['message'])
            window.location.href = "/multiplayer/index";
        } else {
            sub_type = message['sub_type'];
            if (sub_type === "user_joined") {
                joinedUserId = message['user_id'];
                if (joinedUserId === parseInt(currentUserId.value)) {
                    opponentUserId.value = joinedUserId;
                    opponentUsername.value = message['username'];
                    waitingConnectTip.classList.add("hidden");
                    // show the start game tip
                    startGameTip.classList.remove("hidden");
                    // modify the tip content every second
                    let count = 3;
                    let timer = setInterval(() => {
                        count--;
                        startGameTip.innerHTML = `The game will start in ${count} seconds`;
                        if (count === 0) {
                            clearInterval(timer);
                            overlay.classList.add("hidden");
                            startGameTip.classList.add("hidden");
                            // ------ start the game
                            startMessage = {
                                "message_type": "start_game",
                                "match_id": matchId.value,
                                "user_id": currentUserId.value
                            }
                            sendMessage(JSON.stringify(startMessage))
                            matchState.value = "1";
                            // ------ set countdown
                            let time = timeLimit.value;
                            countdownTimer = setInterval(() => {
                                time--;
                                timeLimit.value = time;
                                countdown.innerHTML = time;
                                if (time === 0) {
                                    clearInterval(countdownTimer);
                                    // ------ game over
                                    gameOverMessage = {
                                        "message_type": "time_over",
                                        "match_id": matchId.value,
                                        "user_id": currentUserId.value
                                    }
                                    sendMessage(JSON.stringify(gameOverMessage))
                                    overlay.classList.remove("hidden")
                                    waitingFinishTip.classList.remove("hidden")
                                }
                            }, 1000);
                        }
                    }, 1000);
                }
            } else if (sub_type === "all_finish_game") {
                window.location.href = "/multiplayer/report-detail?match_id=" + matchId.value;
            } else if (sub_type === "you_finish_game" && parseInt(currentUserId.value) === message['user_id']) {
                matchState.value = "2";
                overlay.classList.remove("hidden");
                waitingFinishTip.classList.remove("hidden");
                clearInterval(countdownTimer);
            } else if (sub_type === "user_left" && matchState.value === "1") {
                leftUserId = message['user_id'];
                if (leftUserId !== parseInt(currentUserId.value)) {
                    waitingConnectTip.classList.remove("hidden");
                    overlay.classList.remove("hidden");
                    // pause the countdown
                    clearInterval(countdownTimer);
                }
            } else if (sub_type === "question_info" && parseInt(currentUserId.value) === message['user_id']) {
                // ------ show the question
                question = message['question'];
                questionId = question['id']
                title = question['title']
                optionA = question['option_a']
                optionB = question['option_b']
                optionC = question['option_c']
                optionD = question['option_d']
                questionTitle.textContent = title;
                questionOptionA.textContent = optionA;
                questionOptionB.textContent = optionB;
                questionOptionC.textContent = optionC;
                questionOptionD.textContent = optionD;
                adjustTitleFontSize("questionTitle");
                adjustTitleFontSize("questionOptionA");
                adjustTitleFontSize("questionOptionB");
                adjustTitleFontSize("questionOptionC");
                adjustTitleFontSize("questionOptionD");

                answerAMessage = {
                    "message_type": "answer",
                    "match_id": matchId.value,
                    "user_id": currentUserId.value,
                    "choice": "A",
                    "question_id": questionId,
                    "used_time": 0
                };
                answerBMessage = {
                    "message_type": "answer",
                    "match_id": matchId.value,
                    "user_id": currentUserId.value,
                    "choice": "B",
                    "question_id": questionId,
                    "used_time": 0
                }
                answerCMessage = {
                    "message_type": "answer",
                    "match_id": matchId.value,
                    "user_id": currentUserId.value,
                    "choice": "C",
                    "question_id": questionId,
                    "used_time": 0
                }
                answerDMessage = {
                    "message_type": "answer",
                    "match_id": matchId.value,
                    "user_id": currentUserId.value,
                    "choice": "D",
                    "question_id": questionId,
                    "used_time": 0
                }
                questionStartTime = performance.now();

            } else if (sub_type === "user_completion_add") {
                if (message['user_id'] !== parseInt(currentUserId.value)) {
                    rightScore.innerHTML = String(parseInt(rightScore.innerHTML) + 1);
                    // show 2 seconds right progress
                    rightProgress.classList.remove("hidden");
                    setTimeout(() => {
                        rightProgress.classList.add("hidden");
                    }, 2000);
                } else {
                    leftScore.innerHTML = String(parseInt(leftScore.innerHTML) + 1);
                    // show 2 seconds left progress
                    leftProgress.classList.remove("hidden");
                    setTimeout(() => {
                        leftProgress.classList.add("hidden");
                    }, 2000);
                }
            }
        }
    };

    websocket.onclose = (event) => {
        if (!isVoluntarilyLeaving) { // 检查 isVoluntarilyLeaving 标志
            if (!reconnecting && !isPageUnloading) { // 检查 isPageUnloading
                reconnecting = true;
                console.log(`Attempting to reconnect in ${reconnectionDelay / 1000} seconds...`);
                setTimeout(() => {
                    connectWebSocket();
                    reconnectionDelay = Math.min(reconnectionDelay * 2, maxReconnectionDelay);
                }, reconnectionDelay);

            } else if (isPageUnloading) {
                console.log("Page is unloading, skipping reconnection attempt.");
            }
        } else {
            console.log("Voluntarily left room, skipping reconnection.");
            isVoluntarilyLeaving = false; // 重置标志，以便下次进入房间时重连逻辑正常工作
        }
    };

    websocket.onerror = (event) => {
        if (!isVoluntarilyLeaving) { // 检查 isVoluntarilyLeaving 标志
            console.error("WebSocket Error:", event);
            if (!reconnecting && !isPageUnloading) { // 检查 isPageUnloading
                reconnecting = true;
                console.log(`Attempting to reconnect in ${reconnectionDelay / 1000} seconds...`);
                setTimeout(() => {
                    connectWebSocket();
                    reconnectionDelay = Math.min(reconnectionDelay * 2, maxReconnectionDelay);
                }, reconnectionDelay);
            } else if (isPageUnloading) {
                console.log("Page is unloading, skipping reconnection attempt.");
            }
        } else {
            console.log("Voluntarily left room, skipping reconnection on error as well.");
            isVoluntarilyLeaving = false; // 重置标志
        }
    };
}

function sendMessage(message) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(message);
        console.log("Send Message:", message);
    } else {
        console.log("WebSocket Disconnected, cannot send message:", message);
        // 可以选择在这里尝试立即重连，或者依赖 onclose/onerror 的重连机制
        if (!reconnecting) {
            console.log("Initiating reconnection from sendMessage due to disconnected state.");
            connectWebSocket(); // 尝试立即重连
        }
    }
}


questionOptionA.addEventListener('click', function () {
    let usedTime;
    if (matchState.value === "1") {
        usedTime = getUsedTime();
        answerAMessage.used_time = usedTime;
        sendMessage(JSON.stringify(answerAMessage))
    } else {
        alert("The game is over")
    }
});
questionOptionB.addEventListener('click', function () {
    let usedTime;
    if (matchState.value === "1") {
        usedTime = getUsedTime();
        answerBMessage.used_time = usedTime;
        sendMessage(JSON.stringify(answerBMessage))
    } else {
        alert("The game is over")
    }
});
questionOptionC.addEventListener('click', function () {
    let usedTime;
    if (matchState.value === "1") {
        usedTime = getUsedTime();
        answerCMessage.used_time = usedTime;
        sendMessage(JSON.stringify(answerCMessage))
    } else {
        alert("The game is over")
    }
});
questionOptionD.addEventListener('click', function () {
    let usedTime;
    if (matchState.value === "1") {
        usedTime = getUsedTime();
        answerDMessage.used_time = usedTime;
        sendMessage(JSON.stringify(answerDMessage))
    } else {
        alert("The game is over")
    }
});

function getUsedTime() {
    const currentTime = performance.now(); // get the current time in milliseconds
    const elapsedTimeMilliseconds = currentTime - questionStartTime; // calculate the time used to answer the question
    return Math.floor(elapsedTimeMilliseconds / 1000); // convert milliseconds to seconds
}