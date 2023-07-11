$(document).ready(function(e) {
    if( window.localStorage.getItem("connection_edge")) {
        const settings = JSON.parse(window.localStorage.getItem("connection_edge"));
        $('#edgeHostname').val(settings.host);
    }


    $('#edgeSettings').on('submit',function(e) {
        e.preventDefault();

        const getUrlParameter = function getUrlParameter(sParam) {
            var sPageURL = window.location.search.substring(1),
                sURLVariables = sPageURL.split('&'),
                sParameterName,
                i;
        
            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('=');
        
                if (sParameterName[0] === sParam) {
                    return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
                }
            }
            return false;
        };


        window.localStorage.setItem("connection_edge",JSON.stringify(
            {
                "connectionName":"Corrently EDGE",
                "host":$('#edgeHostname').val(),"port":1883,
                "protocol":"mqtt",
                "clientId":"corrently-current",
                "protocolId":"MQIsdp",
                "protocolVersion":3,
                "connectionId":"edge",
                "uiid":"current_edge",
                "basePath":"#"
            }));
        location.href= "./index.html?middleware=edge";
    });
});