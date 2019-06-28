window.onload = load_statistics_page

function load_statistics_page() {
    load_page("estatisticas.html", load_statistics_page_contents, null);
    deactivate_tabs();
}

function load_patients_page() {
    load_page("pacientes.html", load_patients_page_contents, null);
    deactivate_tabs();
}

function load_gestures_page() {
    load_page("gestos.html", load_gestures_page_contents, null);
    deactivate_tabs();
}

function load_statistics_page_contents() {
    document.getElementById('menu_estatisticas').classList.add('active');
}

function load_patients_page_contents() {
    document.getElementById('menu_pacientes').classList.add('active');
}

function load_gestures_page_contents() {
    document.getElementById('menu_gestos').classList.add('active');
    load_notifications_data();
}


function deactivate_tabs() {
    var tab_names = ["menu_estatisticas", "menu_pacientes", "menu_gestos"];
    for (var i = 0; i < tab_names.length; i++)
        document.getElementById(tab_names[i]).classList.remove('active');
}

function load_page(url, okCallBack) {
    var xhr
    xhr = new XMLHttpRequest()
    xhr.onreadystatechange = handleStateChange
    xhr.open("GET", url, true)
    xhr.send()

    function handleStateChange() {
        if (xhr.readyState === 4 && xhr.status == 200) {
            document.getElementById("main_content").innerHTML = xhr.responseText
            okCallBack()     
        }
    }
}
