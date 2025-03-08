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
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

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

document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
});


let reconnecting = false; // 标记是否正在重连
let reconnectionDelay = 1000; // 初始重连延迟 (毫秒)
const maxReconnectionDelay = 30000; // 最大重连延迟 (毫秒)
let isPageUnloading = false;
let isVoluntarilyLeaving = false;

window.onbeforeunload = function () {
    isPageUnloading = true;
};

function connectWebSocket() {
    if (reconnecting) { // 如果正在重连，则直接返回，避免重复连接
        console.log("Already reconnecting, skipping...");
        return;
    }

    const host = window.location.host;
    const wsUrl = `ws://${host}/ws/room/`;

    websocket = new WebSocket(wsUrl);

    websocket.onopen = (event) => {
        console.log("WebSocket Connected");
        reconnecting = false; // 重连成功，重置重连状态
        reconnectionDelay = 1000; // 重置重连延迟
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
            } else if (sub_type === 'owner_disconnected') { // 新增 'owner_disconnected' 的处理逻辑
                tips.innerHTML = "Room owner disconnected, room paused, waiting for owner to reconnect."; // 更新 tips 提示信息
                tips.style.color = "orange"; // 可以修改 tips 的颜色，例如橙色，表示警告或等待状态
                // 可以禁用一些操作按钮，例如 "开始游戏" 按钮，直到房主重连
                const startATag = document.getElementsByClassName("start-a-tag")[0];
                if (startATag) {
                    startATag.classList.add("disabled"); // 添加 disabled class，或者使用其他方式禁用按钮
                }
            } else if (sub_type === "owner_left_room" && isOwner.value === 'False') {
                alert(message['message'])
                window.location.href = "/multiplayer/index";
            } else if (sub_type === "start_game"){
                websocket.close();
                isPageUnloading = true;
                window.location.href = `/multiplayer/battle?room_id=${roomId}`;
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


document.getElementsByClassName('quit-a-tag')[0].addEventListener('click', () => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        isVoluntarilyLeaving = true; // 设置为 true，表示主动离开
        const leaveMessage = {
            "message_type": "leave_room_request", // 新的消息类型
            "room_id": roomId // 假设 roomId 变量已定义
        };
        sendMessage(JSON.stringify(leaveMessage));
        window.location.href = "/multiplayer/index";
    } else {
        console.log("WebSocket is not open, cannot send leave room message.");
        window.location.href = "/multiplayer/index";
    }
});

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