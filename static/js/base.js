
// -------- Hide login info on certain pages | beginning --------
// if any page don't want to show login info, add the page name to the list
// and add a hidden input with the page name as the id in the page - @Yanqian Chen
HIDDEN_LOGIN_INFO_PAGES = ['info_page']

function isHiddenLoginInfoPage() {
    let flag = false;
    HIDDEN_LOGIN_INFO_PAGES.forEach( page => {
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
function adjustTitleFontSize(className) {
    const titleElement = document.querySelector(className);
    if (!titleElement) return;

    const containerWidth = titleElement.offsetWidth;
    const text = titleElement.textContent;

    const tempElement = document.createElement('span'); // 创建临时 span 元素
    tempElement.style.visibility = 'hidden'; // 隐藏临时元素
    tempElement.style.position = 'absolute'; // 绝对定位，不影响布局
    tempElement.style.whiteSpace = 'nowrap'; // 保持单行 (如果需要单行)
    tempElement.style.fontSize = '100px'; // 初始字体大小 (可以设置一个较大的值)
    tempElement.style.fontWeight = getComputedStyle(titleElement).fontWeight; // 复制字重 (保持样式一致)
    tempElement.textContent = text;
    document.body.appendChild(tempElement); // 将临时元素添加到 body

    let fontSize = 50; // 初始字体大小
    while (tempElement.offsetWidth > containerWidth && fontSize > 0) { // 循环缩小字体直到宽度合适
        fontSize -= 1; // 每次缩小 1px (可以调整步长)
        tempElement.style.fontSize = fontSize + 'px';
    }

    titleElement.style.fontSize = fontSize + 'px'; // 将调整后的字体大小应用到 .title 元素
    document.body.removeChild(tempElement); // 移除临时元素
}

// -------- dynamically adjust the size of font | end --------
