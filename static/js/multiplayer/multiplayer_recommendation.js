
adjustTitleFontSize("room-title");

document.getElementsByClassName("refresh-a-tag")[0].addEventListener("click", function (){
    window.location.href = "/multiplayer/recommendation";
});

// 给所有room添加点击事件, 获取id, 跳转到room页面
let rooms = document.getElementsByClassName("room");
for (let room of rooms) {
    room.addEventListener("click", function() {
        let room_id = room.id;
        window.location.href = `/multiplayer/room?room_id=${room_id}`;
    });
}