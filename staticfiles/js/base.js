document.getElementsByClassName("logo-image")[0].addEventListener('click', function () {
    // back to the home page
    window.location.href = "/";
});

// -------- Hide login info on certain pages | beginning --------
// if any page don't want to show login info, add the page name to the list
// and add a hidden input with the page name as the id in the page - @Yanqian Chen
HIDDEN_LOGIN_INFO_PAGES = ['info_page']

function isHiddenLoginInfoPage() {
    let flag = false;
    HIDDEN_LOGIN_INFO_PAGES.forEach(page => {
        if (document.getElementById(page) !== null) {
            flag = true;
        }
    })
    if (flag) {
        document.getElementsByClassName("login-info")[0].classList.add("hidden");
    }
}

isHiddenLoginInfoPage();
// -------- Hide login info on certain pages | end --------

// -------- dynamically adjust the size of font | beginning --------
function adjustTitleFontSize(element) {
     if (!element) return;

    const containerWidth = element.offsetWidth;
    const text = element.textContent;

    const tempElement = document.createElement('span'); // 创建临时 span 元素
    tempElement.style.visibility = 'hidden'; // 隐藏临时元素
    tempElement.style.position = 'absolute'; // 绝对定位，不影响布局
    tempElement.style.whiteSpace = 'nowrap'; // 保持单行 (如果需要单行)
    tempElement.style.fontSize = '100px'; // 初始字体大小 (可以设置一个较大的值)
    tempElement.style.fontWeight = getComputedStyle(element).fontWeight; // 复制字重 (保持样式一致)
    tempElement.textContent = text;
    document.body.appendChild(tempElement); // 将临时元素添加到 body

    let fontSize = 50; // 初始字体大小
    while (tempElement.offsetWidth > containerWidth && fontSize > 0) { // 循环缩小字体直到宽度合适
        fontSize -= 1; // 每次缩小 1px (可以调整步长)
        tempElement.style.fontSize = fontSize + 'px';
        console.log("SCALE -1");
    }

    element.style.fontSize = fontSize + 'px'; // 将调整后的字体大小应用到 .title 元素
    document.body.removeChild(tempElement); // 移除临时元素
}

// -------- dynamically adjust the size of font | end --------

// -------- calculate dpi ------
document.addEventListener("DOMContentLoaded", function () {
    const minWidth = 1900;

    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    console.log("currentWidth: " + currentWidth);
    console.log("currentHeight: " + currentHeight);
    if (currentWidth >= minWidth) {
        return;
    }

    let tip = document.getElementsByClassName("base-tip")[0];
    tip.classList.remove("hidden");

    tip.innerHTML = "Your screen resolution is too low, please use your browser Settings to zoom to 90% or lower for better presentation :) ";
    // every 5 seconds show a tip
    setTimeout(function () {
        tip.classList.add("hidden");
    }, 5000);

});

