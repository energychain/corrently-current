$(document).ready(function(e) {
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

    if( window.localStorage.getItem("connection_edge")) {
        const settings = JSON.parse(window.localStorage.getItem("connection_edge"));
        $('#edgeHostname').val(settings.host);
    }

    if(getUrlParameter('detectEdge')) {
        $('#edgeHostname').val(location.hostname);
    }

    $('#btnRetrieve').on('click',function(e) {
        console.log("Retrieve");
        front.on("/corrently/edge/topics/result",function(msg) {
            const nTopics = JSON.parse(msg);
            window.localStorage.setItem("topics_edge",JSON.stringify(nTopics));
            location.href="./index.html";
        });

        const settings = JSON.parse(window.localStorage.getItem("topics_edge"));
        front.send("/corrently/edge/topics/get",JSON.stringify(settings));
    });

    $('#btnStore').on('click',function(e) {
        const settings = JSON.parse(window.localStorage.getItem("topics_edge"));
        front.send("/corrently/edge/topics/set",JSON.stringify(settings));
        location.href="./index.html";
    });

    $('#edgeSettings').on('submit',async function(e) {
        e.preventDefault();
        const connection = new Connection("edge");
        await connection.set(
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
            });
        location.href= "./index.html";
    });
});