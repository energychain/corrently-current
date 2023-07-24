$(document).ready(function(e) {
    const _randomString = function() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';
        for (let i = 0; i < 20; i++) {
          const randomIndex = Math.floor(Math.random() * chars.length);
          randomString += chars.charAt(randomIndex);
        }
        return randomString;
    }


    $('#deviceSettings').on('submit',function(e) {
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

        const widgetId = _randomString();

        let settings = {};

        settings['topics'] = [
            {
                "topic":"meross/current",
                "alias":"W",
                "id":_randomString(),
                "colorize":"1",
                "renderer":"javascript:value=value/10"
            },
            {
                "topic":"meross/voltage",
                "alias":"V",
                "id":_randomString(),
                "colorize":"1",
                "renderer":"javascript:value=value/10"
            }
        ];
        settings['edge_flow'] = {
            "modules": [ "nr-meross-cloud"],
            "label": "Meross Plug",
            "flow":[
                {
                    "id": "7575c53bccbfa593",
                    "type": "MerossEnergy",
                    "z": "df27ead50a5bb1e9",
                    "name": "",
                    "username": $('#deviceUser').val(),
                    "password": $('#devicePassword').val(),
                    "x": 130,
                    "y": 40,
                    "wires": [
                        [
                            "a690f76bfa850811"
                        ]
                    ]
                },
                {
                    "id": "a690f76bfa850811",
                    "type": "function",
                    "z": "df27ead50a5bb1e9",
                    "name": "Transform MQTT Topic",
                    "func": "for (const [key, value] of Object.entries(msg.payload)) {\n    node.send({\n        topic: 'meross/' + key,\n        payload: value\n    });\n}\nreturn null;\n",
                    "outputs": 1,
                    "noerr": 0,
                    "initialize": "",
                    "finalize": "",
                    "libs": [],
                    "x": 360,
                    "y": 40,
                    "wires": [
                        [
                            "c42730aa7265eb52"
                        ]
                    ]
                },
                {
                    "id": "c42730aa7265eb52",
                    "type": "mqtt out",
                    "z": "df27ead50a5bb1e9",
                    "name": "",
                    "topic": "",
                    "qos": "",
                    "retain": "",
                    "respTopic": "",
                    "contentType": "",
                    "userProps": "",
                    "correl": "",
                    "expiry": "",
                    "broker": "21097f5bbe68fc71",
                    "x": 550,
                    "y": 40,
                    "wires": []
                },
                {
                    "id": "21097f5bbe68fc71",
                    "type": "mqtt-broker",
                    "name": "Meross Edge ",
                    "broker": "localhost",
                    "port": "1883",
                    "clientid": "",
                    "autoConnect": true,
                    "usetls": false,
                    "protocolVersion": "4",
                    "keepalive": "60",
                    "cleansession": true,
                    "birthTopic": "",
                    "birthQos": "0",
                    "birthPayload": "",
                    "birthMsg": {},
                    "closeTopic": "",
                    "closeQos": "0",
                    "closePayload": "",
                    "closeMsg": {},
                    "willTopic": "",
                    "willQos": "0",
                    "willPayload": "",
                    "willMsg": {},
                    "userProps": "",
                    "sessionExpiry": ""
                }
            ]        
        }
       
        $.ajax({
            type: "POST",
            url: "https://api.corrently.io/v2.0/tydids/bucket/intercom",
            data: "&value=" + encodeURIComponent(JSON.stringify(settings)),
            success: function(data) {
                $('#gtpShareId').show();
                $('#shareId').val(data.id);

                $.getJSON("https://api.corrently.io/v2.0/util/qr?data="+data.id,function(d) {
                    $('#qrImage').attr('src',d);
                });

                $('#shareId').attr('disabled','disabled');
                $(e.currentTarget).removeAttr('disabled');
                console.log("Import ID:",data.id)
                if(getUrlParameter("returnUrl")) {                    
                    location.href=getUrlParameter("returnUrl") + "?import="+data.id;
                }
            }
        })
    });
});