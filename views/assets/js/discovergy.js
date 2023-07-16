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

        settings['topics_edge'] = [
            {
                "topic":"avmfritz/"+$('#deviceIAIN').val()+"/power",
                "alias":"W",
                "id":_randomString(),
                "colorize":"1"
            },
            {
                "topic":"avmfritz/"+$('#deviceIAIN').val()+"/energy",
                "alias":"Wh",
                "id":_randomString(),
                "colorize":"1"
            }
        ];
        settings['edge_flow'] = {
            "modules": [ ],
            "label": "Discovergy Meters",
            "flow": [
                {
                    "id": "e14719f1beb6a01b",
                    "type": "tab",
                    "label": "Flow 2",
                    "disabled": false,
                    "info": "",
                    "env": []
                },
                {
                    "id": "7bf6ea5eb388a29c",
                    "type": "inject",
                    "z": "e14719f1beb6a01b",
                    "name": "",
                    "props": [
                        {
                            "p": "payload"
                        },
                        {
                            "p": "topic",
                            "vt": "str"
                        }
                    ],
                    "repeat": "3600",
                    "crontab": "",
                    "once": true,
                    "onceDelay": 0.1,
                    "topic": "",
                    "payload": "",
                    "payloadType": "date",
                    "x": 150,
                    "y": 120,
                    "wires": [
                        [
                            "8a6c909cfa738a7e"
                        ]
                    ]
                },
                {
                    "id": "8a6c909cfa738a7e",
                    "type": "http request",
                    "z": "e14719f1beb6a01b",
                    "credentials": {
                        "user":$('#deviceUser').val(),
                        "password":$('#devicePassword').val()
                    },
                    "name": "",
                    "method": "GET",
                    "ret": "obj",
                    "paytoqs": "ignore",
                    "url": "https://api.discovergy.com/public/v1/meters",
                    "tls": "",
                    "persist": false,
                    "proxy": "",
                    "insecureHTTPParser": false,
                    "authType": "basic",
                    "senderr": false,
                    "headers": [],
                    "x": 350,
                    "y": 120,
                    "wires": [
                        [
                            "a7720ffb98f21166"
                        ]
                    ]
                },
                {
                    "id": "a7720ffb98f21166",
                    "type": "function",
                    "z": "e14719f1beb6a01b",
                    "name": "Available Meters",
                    "func": "flow.set(\"meters\",msg.payload);\nreturn msg;",
                    "outputs": 1,
                    "noerr": 0,
                    "initialize": "",
                    "finalize": "",
                    "libs": [],
                    "x": 540,
                    "y": 120,
                    "wires": [
                        []
                    ]
                },
                {
                    "id": "e0c6a4fec3b87b73",
                    "type": "inject",
                    "z": "e14719f1beb6a01b",
                    "name": "",
                    "props": [
                        {
                            "p": "payload"
                        },
                        {
                            "p": "topic",
                            "vt": "str"
                        }
                    ],
                    "repeat": "10",
                    "crontab": "",
                    "once": true,
                    "onceDelay": "2",
                    "topic": "",
                    "payload": "",
                    "payloadType": "date",
                    "x": 150,
                    "y": 200,
                    "wires": [
                        [
                            "434decdf83b4d66b"
                        ]
                    ]
                },
                {
                    "id": "434decdf83b4d66b",
                    "type": "function",
                    "z": "e14719f1beb6a01b",
                    "name": "Loop Meters",
                    "func": "const meters = flow.get(\"meters\");\nfor(let i=0;i<meters.length;i++) {\n    node.send({payload:{meterId:meters[i].meterId},meter:meters[i]});\n}\nreturn null;",
                    "outputs": 1,
                    "noerr": 0,
                    "initialize": "",
                    "finalize": "",
                    "libs": [],
                    "x": 350,
                    "y": 200,
                    "wires": [
                        [
                            "4e09bc61c072de07"
                        ]
                    ]
                },
                {
                    "id": "4e09bc61c072de07",
                    "type": "delay",
                    "z": "e14719f1beb6a01b",
                    "name": "",
                    "pauseType": "rate",
                    "timeout": "5",
                    "timeoutUnits": "seconds",
                    "rate": "1",
                    "nbRateUnits": "1",
                    "rateUnits": "second",
                    "randomFirst": "1",
                    "randomLast": "5",
                    "randomUnits": "seconds",
                    "drop": false,
                    "allowrate": false,
                    "outputs": 1,
                    "x": 560,
                    "y": 200,
                    "wires": [
                        [
                            "d0736b6d016e2e07"
                        ]
                    ]
                },
                {
                    "id": "d0736b6d016e2e07",
                    "type": "http request",
                    "z": "e14719f1beb6a01b",
                    "credentials": {
                        "user":$('#deviceUser').val(),
                        "password":$('#devicePassword').val()
                    },
                    "name": "",
                    "method": "GET",
                    "ret": "obj",
                    "paytoqs": "query",
                    "url": "https://api.discovergy.com/public/v1/last_reading",
                    "tls": "",
                    "persist": false,
                    "proxy": "",
                    "insecureHTTPParser": false,
                    "authType": "basic",
                    "senderr": false,
                    "headers": [],
                    "x": 770,
                    "y": 200,
                    "wires": [
                        [
                            "e64f857e093af820"
                        ]
                    ]
                },
                {
                    "id": "e64f857e093af820",
                    "type": "function",
                    "z": "e14719f1beb6a01b",
                    "name": "Transform MQTT Publish",
                    "func": "if(msg.payload.time < new Date().getTime()-900000) {\n    msg = null;\n} else {\n    msg.payload.values.time = msg.payload.time;\n    msg.payload = msg.payload.values;\n    msg.topic = \"discovergy/\"+msg.meter.fullSerialNumber;\n    for (const [key, value] of Object.entries(msg.payload)) {\n        node.send({\n            payload:value,\n            topic:msg.topic + \"/\" + key\n        });\n    }\n}\nreturn null;",
                    "outputs": 1,
                    "noerr": 0,
                    "initialize": "",
                    "finalize": "",
                    "libs": [],
                    "x": 990,
                    "y": 200,
                    "wires": [
                        [
                            "e809df63fc9f2064"
                        ]
                    ]
                },
                {
                    "id": "e809df63fc9f2064",
                    "type": "mqtt out",
                    "z": "e14719f1beb6a01b",
                    "name": "",
                    "topic": "",
                    "qos": "",
                    "retain": "",
                    "respTopic": "",
                    "contentType": "",
                    "userProps": "",
                    "correl": "",
                    "expiry": "",
                    "broker": "cdd278517671eb75",
                    "x": 1190,
                    "y": 200,
                    "wires": []
                },
                {
                    "id": "cdd278517671eb75",
                    "type": "mqtt-broker",
                    "name": "",
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