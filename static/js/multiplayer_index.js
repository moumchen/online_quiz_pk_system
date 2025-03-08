document.getElementsByClassName("create-room-button-div")[0].addEventListener('click', function () {
    window.location.href = "/common/requirement?type=multi";
});
document.getElementsByClassName("available-rooms-button-div")[0].addEventListener('click', function () {
    window.location.href = "/multiplayer/recommendation";
});
document.getElementsByClassName("history-button-div")[0].addEventListener('click', function () {
    window.location.href = "/multiplayer/report-list";
});

document.getElementsByClassName("")

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

room_id = 0;

function getUnfinishedRoom() {
    fetch('/multiplayer/unfinished-room', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => response.json()).then(data => {
        if (data.code === 200) {
            if (data.room_id !== null && data.room_id !== 0) {
                document.getElementsByClassName("room-recovery-tip")[0].classList.remove("hidden");
                document.getElementsByClassName("overlay")[0].classList.remove("hidden");
                room_id = data.room_id;

                function jumpToRoom() {
                    window.location.href = `/multiplayer/room?room_id=${room_id}`;
                }

                document.getElementsByClassName("recover-room")[0].addEventListener('click', jumpToRoom);

                document.getElementsByClassName("cancel-recover-room")[0].addEventListener('click', function () {
                    document.getElementsByClassName("room-recovery-tip")[0].classList.add("hidden");
                    document.getElementsByClassName("overlay")[0].classList.add("hidden");
                    // delete event listener
                    document.getElementsByClassName("recover-room")[0].removeEventListener('click', jumpToRoom);
                    // notify server to delete room
                    fetch('/multiplayer/finish-room', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken,
                        },
                        body: JSON.stringify({room_id: room_id}),
                    }).then(response => response.json()).then(data => {
                        if (data.code === 200) {
                            console.log("Room deleted");
                        }
                    });
                });
            }
        }
    });
}

getUnfinishedRoom();