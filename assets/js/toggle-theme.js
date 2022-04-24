function toggleTheme() {
    const theme = document.getElementsByTagName('link')[0];
    theme.getAttribute('href') === "{{ '/assets/css/main.css' | relative_url }}"
        ? theme.setAttribute('href', "{{ '/assets/css/dark.css' | relative_url }}")
        : theme.setAttribute('href', "{{ '/assets/css/main.css' | relative_url }}")
}