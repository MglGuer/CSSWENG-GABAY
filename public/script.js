function handleResponse() {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    const error = params.get('error');

    if (message) {
        alert(message); 
    }

    if (error) {
        alert(error); 
    }
}

document.addEventListener('DOMContentLoaded', function () {
    handleResponse();
    let btn = document.querySelector('#btn');
    let sidebar = document.querySelector('.sidebar');

    btn.onclick = function () {
        sidebar.classList.toggle('active');
    };
});
