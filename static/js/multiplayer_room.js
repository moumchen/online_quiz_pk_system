
// Random background image for the room
const backgroundImgs = ['/static/images/room1.png', '/static/images/room2.png', '/static/images/room3.png', '/static/images/room4.png']
document.querySelector('.wrapper').style.backgroundImage =
    `url(${backgroundImgs[Math.floor(Math.random() * backgroundImgs.length)]})`;

//