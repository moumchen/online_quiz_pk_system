
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