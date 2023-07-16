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
                "topic":"deye/output/power",
                "alias":"W Output",
                "id":_randomString(),
                "colorize":"1"
            },
            {
                "topic":"deye/output/frequency",
                "alias":"Hz Grid Frequency",
                "id":_randomString(),
                "colorize":"1"
            },
            {
                "topic":"deye/temperature",
                "alias":"° Temperature",
                "id":_randomString(),
                "colorize":"1"
            }
        ];
        settings['edge_flow'] = {
            "modules": ["@binsoul/node-red-contrib-deye-sun-g3"],
            "label": "DEYE Inverter",
            "flow":[
                {
                    "id": "f54346856cc7d549",
                    "type": "binsoul-deye-sun-g3",
                    "z": "0760a039f0249b81",
                    "outputProperty": "payload",
                    "outputTarget": "msg",
                    "deviceIp": $('#deviceIP').val(),
                    "deviceSerialNumber": $('#deviceSerial').val(),
                    "deviceTimeout": "20",
                    "updateMode": "messages",
                    "updateFrequency": "1",
                    "name": "",
                    "x": 360,
                    "y": 40,
                    "wires": [
                        [
                            "61b3324b5f52e6c7"
                        ]
                    ]
                },
                {
                    "id": "78a2dcc11f227a0d",
                    "type": "inject",
                    "z": "0760a039f0249b81",
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
                    "repeat": "1800",
                    "crontab": "",
                    "once": true,
                    "onceDelay": 0.1,
                    "topic": "",
                    "payload": "",
                    "payloadType": "date",
                    "x": 130,
                    "y": 40,
                    "wires": [
                        [
                            "f54346856cc7d549"
                        ]
                    ]
                },
                {
                    "id": "61b3324b5f52e6c7",
                    "type": "function",
                    "z": "0760a039f0249b81",
                    "name": "Convert to MQTT Publish",
                    "func": "    msg.topic = \"deye/\";\n    for (const [key, value] of Object.entries(msg.payload)) {\n        let addTopic = key;\n        if(typeof value == 'object') {\n            for (const [key2, value2] of Object.entries(value)) {\n                node.send({\n                    payload: value2,\n                    topic: msg.topic + \"\" + key + \"/\" + key2\n                });\n            }\n        } else {\n            node.send({\n                payload: value,\n                topic: msg.topic + \"\" + key\n            });\n        }\n    }\n\nreturn null;\n",
                    "outputs": 1,
                    "noerr": 0,
                    "initialize": "",
                    "finalize": "",
                    "libs": [],
                    "x": 630,
                    "y": 40,
                    "wires": [
                        [
                            "caf0d392f89d1280"
                        ]
                    ]
                },
                {
                    "id": "caf0d392f89d1280",
                    "type": "mqtt out",
                    "z": "0760a039f0249b81",
                    "name": "",
                    "topic": "",
                    "qos": "",
                    "retain": "",
                    "respTopic": "",
                    "contentType": "",
                    "userProps": "",
                    "correl": "",
                    "expiry": "",
                    "broker": "e463b8a540d2975c",
                    "x": 850,
                    "y": 40,
                    "wires": []
                },
                {
                    "id": "e463b8a540d2975c",
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