// Random background image for the room
const backgroundImgs = ['/static/images/room1.png', '/static/images/room2.png', '/static/images/room3.png', '/static/images/room4.png']
document.querySelector('.wrapper').style.backgroundImage =
    `url(${backgroundImgs[Math.floor(Math.random() * backgroundImgs.length)]})`;

// ------

// Function to adjust the font size of the title
adjustTitleFontSize(".title")

// ------
const roomId = document.getElementsByClassName("room_id")[0].value;
const currentUserId = document.getElementsByClassName("current_user_id")[0].value;
const roomState = document.getElementsByClassName("room_state")[0];
const roomOpponent = document.getElementsByClassName("room_opponent")[0];
const isOwner = document.getElementsByClassName("is_owner")[0];
const tips = document.getElementsByClassName("tips")[0];
const startImgTag = document.getElementsByClassName("start-img-tag")[0];
const startATag = document.getElementsByClassName("start-a-tag")[0];
const inviteATag = document.getElementsByClassName("invite-a-tag")[0];
const inviteImgTag = document.getElementsByClassName("invite-img-tag")[0];
const switchToPublic = document.getElementsByClassName("switch-to-public")[0];
const switchToPrivate = document.getElementsByClassName("switch-to-private")[0];
const countdown = document.getElementsByClassName("countdown_input")[0];
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

function setRoomInfoByState() {
    if (isOwner.value === 'True') {
        if (switchToPublic) {
            switchToPublic.classList.remove("hidden");
        }
        if (switchToPrivate) {
            switchToPrivate.classList.add("hidden");
        }
        countdown.removeAttribute('disabled')
    }


    if (roomState.value === '0') {
        // Room is waiting for the opponent
        tips.innerHTML = "Waiting for the opponent ...";
        tips.style.color = "black";
        if (isOwner.value === 'True') {
            // The current user is the owner of the room
            inviteATag.classList.remove("hidden");
            inviteImgTag.classList.remove("hidden");
            startImgTag.classList.add("hidden");
            startATag.classList.add("hidden");
        } else {
            inviteATag.classList.add("hidden");
            inviteImgTag.classList.add("hidden");
        }
    } else if (roomState.value === '1') {
        // Room is ready to start
        tips.innerHTML = roomOpponent.value + " has entered the room as your opponent! Let's start!";
        tips.style.color = "green";
        inviteATag.classList.add('hidden');
        inviteImgTag.classList.add('hidden');
        if (isOwner.value === 'True') {
            // The current user is the owner of the room
            startATag.classList.remove("hidden");
            startImgTag.classList.remove("hidden");
        } else {
            startATag.classList.add("hidden");
            startImgTag.classList.add("hidden");
        }
    }

}

setRoomInfoByState();

document.getElementsByClassName("countdown_input")[0].addEventListener('blur', function () {
    const countdown = document.getElementsByClassName("countdown_input")[0];
    fetch('/multiplayer/adjust_countdown', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({"room_id": roomId, "countdown": countdown.value})
    }).then(response => response.json()).then(data => {
        if (data.code === 200) {
            console.log("Countdown updated.");
        }
    });
});

document.getElementsByClassName("invite-a-tag")[0].addEventListener('click', () => {
    invite_code = document.getElementsByClassName("invite_code")[0].value;
    // -- get current host
    const host = window.location.host;
    const url = `http://${host}/multiplayer/room?invite_code=${invite_code}`;
    // copy the invite code to the clipboard
    navigator.clipboard.writeText(url).then(() => {
        alert("Invite url copied to clipboard! Send it to your friend!");
    });
});

const permissionLinks = document.querySelectorAll(".permission-switch-link");
const permissionHiddenInput = document.getElementsByClassName("permission_hidden")[0]; // Get permission hidden input
permissionLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // 阻止默认链接跳转行为

        const roomId = document.querySelector(".room_id").value;
        const targetPermission = link.dataset.targetPermission;

        fetch('/multiplayer/adjust_permission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({"room_id": roomId, "target_state": targetPermission === 'public' ? '1' : '0'})
        }).then(response => response.json()).then(data => {
            if (data.code === 200) { // 如果服务器返回成功 (状态码 200)
                if (targetPermission === 'public') { // 如果点击的是 "切换到公开" 链接
                    switchToPublic.classList.add("hidden"); // 隐藏 "切换到公开" 链接
                    switchToPrivate.classList.remove("hidden"); // 显示 "切换到私密" 链接
                    permissionHiddenInput.value = 'public'; // 更新隐藏输入框的值为 'public'
                } else { // 否则 (点击的是 "切换到私密" 链接，因为只有两个链接)
                    switchToPublic.classList.remove("hidden"); // 显示 "切换到公开" 链接
                    switchToPrivate.classList.add("hidden"); // 隐藏 "切换到私密" 链接
                    permissionHiddenInput.value = 'private'; // 更新隐藏输入框的值为 'private'
                }
            }
        });
    });
});

function initializePermissionDisplay() {
    if (permissionHiddenInput) { // 确保 permissionHiddenInput 元素存在
        const currentPermission = permissionHiddenInput.value; // 获取隐藏输入框的值 (初始权限)
        if (currentPermission === 'public') { // 如果初始权限是 'public' (公开)
            switchToPublic.classList.add("hidden"); // 隐藏 "切换到公开" 链接
            switchToPrivate.classList.remove("hidden"); // 显示 "切换到私密" 链接
        } else { // 否则 (默认是 'private' 或其他值，都视为私密)
            switchToPublic.classList.remove("hidden"); // 显示 "切换到公开" 链接
            switchToPrivate.classList.add("hidden"); // 隐藏 "切换到私密" 链接
        }
    }
}

initializePermissionDisplay();

// ------ websocket connection ------

let websocket;

// connect to the websocket when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
});


let reconnecting = false; // a marker to indicate whether it is reconnecting
let reconnectionDelay = 1000; // initial reconnection delay (milliseconds)
const maxReconnectionDelay = 30000; // maximum reconnection delay (30 seconds)
let isPageUnloading = false;
let isVoluntarilyLeaving = false;

window.onbeforeunload = function () {
    isPageUnloading = true;
};

function connectWebSocket() {
    if (reconnecting) { // if already reconnecting, skip
        console.log("Already reconnecting, skipping...");
        return;
    }

    const host = window.location.host;
    const wsUrl = `wss://${host}/ws/room/`;

    websocket = new WebSocket(wsUrl);

    websocket.onopen = (event) => {
        console.log("WebSocket Connected");
        reconnecting = false; // reset reconnecting flag
        reconnectionDelay = 1000; // reset reconnection delay
        // ------ try to join the room
        joinMessage = {"message_type": "join_room", "room_id": roomId}
        sendMessage(JSON.stringify(joinMessage));
    };

    websocket.onmessage = (event) => {
        console.log("Received Message:", event.data);
        const message = JSON.parse(event.data);
        messageType = message['type']
        if (messageType === 'error') {
            alert(message['message'])
            window.location.href = "/multiplayer/index";
        } else {
            sub_type = message['sub_type'];
            if (sub_type === 'user_left_room') {
                roomOpponent.value = '';
                roomState.value = '0';
                setRoomInfoByState();
            }
            if (sub_type === 'user_joined_room' && String(message['joined_user_id']) !== currentUserId) {
                roomOpponent.value = message['joined_user_name'];
                roomState.value = '1';
                setRoomInfoByState();
            } else if (sub_type === 'owner_disconnected') {
                tips.innerHTML = "Room owner disconnected, room paused, waiting for owner to reconnect.";
                tips.style.color = "orange";
                const startATag = document.getElementsByClassName("start-a-tag")[0];
                if (startATag) {
                    startATag.classList.add("disabled");
                }
            } else if (sub_type === "owner_left_room" && isOwner.value === 'False') {
                alert(message['message'])
                window.location.href = "/multiplayer/index";
            } else if (sub_type === "start_game") {
                websocket.close();
                isPageUnloading = true;
                window.location.href = `/multiplayer/battle?room_id=${roomId}`;
            }
        }
    };

    websocket.onclose = (event) => {
        if (!isVoluntarilyLeaving) { // check isVoluntarilyLeaving flag
            if (!reconnecting && !isPageUnloading) { // check isPageUnloading
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
            isVoluntarilyLeaving = false; // reset the flag
        }
    };

    websocket.onerror = (event) => {
        if (!isVoluntarilyLeaving) {
            console.error("WebSocket Error:", event);
            if (!reconnecting && !isPageUnloading) {
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
            isVoluntarilyLeaving = false;
        }
    };
}

function sendMessage(message) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(message);
        console.log("Send Message:", message);
    } else {
        console.log("WebSocket Disconnected, cannot send message:", message);
        if (!reconnecting) {
            console.log("Initiating reconnection from sendMessage due to disconnected state.");
            connectWebSocket(); // try to reconnect
        }
    }
}


// when the user clicks the "Quit" button, send a message to the server to leave the room
document.getElementsByClassName('quit-a-tag')[0].addEventListener('click', () => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        isVoluntarilyLeaving = true; // if voluntarily leaving, set the flag
        const leaveMessage = {
            "message_type": "leave_room_request",
            "room_id": roomId
        };
        sendMessage(JSON.stringify(leaveMessage));
        window.location.href = "/multiplayer/index";
    } else {
        console.log("WebSocket is not open, cannot send leave room message.");
        window.location.href = "/multiplayer/index";
    }
});

// when the user clicks the "Start" button, send a message to the server to start the game, and then redirect to the battle page
document.getElementsByClassName("start-a-tag")[0].addEventListener('click', function () {
    // judge the current user is owner
    if (isOwner.value === 'True') {
        // judge whether the room state is 1
        if (roomState.value === '1') {
            // send a message to start this game
            const startGameMessage = {
                "message_type": "start",
                "room_id": roomId
            };
            sendMessage(JSON.stringify(startGameMessage));
        } else {
            alert("Please wait for the opponent to join the room.");
        }
    } else {
        alert("Only the room owner can start the game.");
    }
});