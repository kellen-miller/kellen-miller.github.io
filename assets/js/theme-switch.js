function setInitialTheme() {
    sessionStorage.setItem('theme', 'light');
}

function toggleTheme() {
    console.log("i got clicked!!!")
    let theme = sessionStorage.getItem('theme');
    let lightTheme = document.getElementById('light_theme');
    let darkTheme = document.getElementById('dark_theme');
    let icon = document.getElementById("light_dark_icon");
    if (theme === 'dark') {
        lightTheme.setAttribute('rel', 'stylesheet alternate');
        darkTheme.setAttribute('rel', 'stylesheet');
        icon.setAttribute("src", "/assets/images/light.png")
        sessionStorage.setItem('theme', 'dark');
    } else {
        darkTheme.setAttribute('rel', 'stylesheet alternate');
        lightTheme.setAttribute('rel', 'stylesheet');
        icon.setAttribute("src", "/assets/images/dark.png")
        sessionStorage.setItem('theme', 'light');
    }
}
