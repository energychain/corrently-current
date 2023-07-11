$(document).ready(function() {
    let settings = JSON.parse(window.localStorage.getItem("corrently_cloud_user"));
    $('.cloudUser').html(settings.username);
    $('.cloudPassword').html(settings.password);
    $('.cloudBasePath').html('corrently/users/'+settings.username+'/');
});