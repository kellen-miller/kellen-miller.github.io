document
    .getElementById("light_dark_icon")
    .addEventListener("click",
        function() {
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
        }, false);

<button type="button"
        className="btn btn-default"
        onClick="invoke"
        name='gotoNode'
        data-arg1='1234'>GotoNode</button>

    invoke = (event) => {
        let nameOfFunction = this[event.target.name];
        let arg1 = event.target.getAttribute('data-arg1');
        // We can add more arguments as needed...
        window[nameOfFunction](arg1)
        // Hope the function is in the window.
        // Else the respective object need to be used
    }


