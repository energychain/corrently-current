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
        const corrently_cloud_user = JSON.parse(window.localStorage.getItem("corrently_cloud_user"));
        settings['topics'] = [
        ];
        settings['edge_flow'] = {
            "modules": [ "node-red-contrib-influxdb"],
            "label": "TimeDB",
            "flow":[
                {
                    "id": "5365b193bd412441",
                    "type": "tab",
                    "label": "TimeDB",
                    "disabled": false,
                    "info": "",
                    "env": []
                },
                {
                    "id": "0f95b3159532f1d9",
                    "type": "mqtt in",
                    "z": "5365b193bd412441",
                    "name": "Datapoints",
                    "topic": "corrently/users/"+corrently_cloud_user.username+"/#",
                    "qos": "2",
                    "datatype": "auto-detect",
                    "broker": "4b0e35f3adcb49d4",
                    "nl": false,
                    "rap": true,
                    "rh": 0,
                    "inputs": 0,
                    "x": 140,
                    "y": 100,
                    "credentials": {
                        "username": corrently_cloud_user.username,
                        "password": corrently_cloud_user.password
                    },
                    "wires": [
                        [
                            "92a852e34b023eef",
                            "3212a5502962897a"
                        ]
                    ]
                },
                {
                    "id": "a6dd48e296d78d7d",
                    "type": "function",
                    "z": "5365b193bd412441",
                    "name": "Remember target Datapoints",
                    "func": "for (const [key, value] of Object.entries(msg.payload)) {\n    if ((value.connectionId == 'cloud') || (value.connectionId == 'edge')) {\n        value.topicId = key;\n        flow.set(value.topic,value);\n    }\n}\n\nreturn msg;",
                    "outputs": 1,
                    "noerr": 0,
                    "initialize": "",
                    "finalize": "",
                    "libs": [],
                    "x": 720,
                    "y": 100,
                    "wires": [
                        []
                    ]
                },
                {
                    "id": "92a852e34b023eef",
                    "type": "function",
                    "z": "5365b193bd412441",
                    "name": "Persist Rendition",
                    "func": "const orgTopic = msg.topic.substring(\"corrently/users/0x4D53A26cFDa955BBce4517e96488418Ee7553aba/\".length);\nif ((typeof flow.get(orgTopic) !== 'undefined') && (flow.get(orgTopic) !== null)) {\n    const settings = flow.get(orgTopic);\n    const renderfnct = settings.renderer.split(':');\n    if (renderfnct[0] == 'javascript') {\n        let value = msg.payload;\n        msg.payload = eval(renderfnct[1]);\n    }\n    settings.value = msg.payload;\n    flow.set(orgTopic,settings);\n    return msg;\n\n} else {\n    return null;\n}\n",
                    "outputs": 1,
                    "noerr": 0,
                    "initialize": "",
                    "finalize": "",
                    "libs": [],
                    "x": 390,
                    "y": 160,
                    "wires": [
                        []
                    ]
                },
                {
                    "id": "3212a5502962897a",
                    "type": "switch",
                    "z": "5365b193bd412441",
                    "name": "Filter Settings  Message",
                    "property": "topic",
                    "propertyType": "msg",
                    "rules": [
                        {
                            "t": "cont",
                            "v": "corrently/topics",
                            "vt": "str"
                        }
                    ],
                    "checkall": "true",
                    "repair": false,
                    "outputs": 1,
                    "x": 410,
                    "y": 100,
                    "wires": [
                        [
                            "a6dd48e296d78d7d"
                        ]
                    ]
                },
                {
                    "id": "a133589d61455e89",
                    "type": "inject",
                    "z": "5365b193bd412441",
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
                    "repeat": "60",
                    "crontab": "",
                    "once": true,
                    "onceDelay": "5",
                    "topic": "",
                    "payload": "",
                    "payloadType": "date",
                    "x": 170,
                    "y": 300,
                    "wires": [
                        [
                            "68c01bbf084c1193"
                        ]
                    ]
                },
                {
                    "id": "e14b16a85b8fb040",
                    "type": "comment",
                    "z": "5365b193bd412441",
                    "name": "Monitor Changes on Cloud",
                    "info": "",
                    "x": 190,
                    "y": 40,
                    "wires": []
                },
                {
                    "id": "2d1b88e656e5ea8a",
                    "type": "comment",
                    "z": "5365b193bd412441",
                    "name": "Persist on local TimeDB",
                    "info": "",
                    "x": 180,
                    "y": 260,
                    "wires": []
                },
                {
                    "id": "86985dace5c7b2d7",
                    "type": "influxdb out",
                    "z": "5365b193bd412441",
                    "influxdb": "afcbcc7359609990",
                    "name": "TimeDB Out",
                    "measurement": "corrently",
                    "precision": "",
                    "retentionPolicy": "",
                    "database": $('#deviceIDB').val(),
                    "precisionV18FluxV20": "ms",
                    "retentionPolicyV18Flux": "",
                    "org": "organisation",
                    "bucket": "bucket",
                    "x": 670,
                    "y": 300,
                    "wires": []
                },
                {
                    "id": "68c01bbf084c1193",
                    "type": "function",
                    "z": "5365b193bd412441",
                    "name": "Create Measurement",
                    "func": "const keys = flow.keys();\nlet payload = {};\nfor(let i=0;i<keys.length;i++) {\n    const topic = flow.get(keys[i]);\n    if(typeof topic.value !== 'undefined') {\n        const targetTopic = topic.topic.replace(/\\//g, '_').replace(/\\./g, '-');\n        payload[targetTopic] = topic.value;\n        delete topic.value;\n        flow.set(keys[i],topic);\n    }\n}\nmsg.payload = payload;\nreturn msg;",
                    "outputs": 1,
                    "noerr": 0,
                    "initialize": "",
                    "finalize": "",
                    "libs": [],
                    "x": 400,
                    "y": 300,
                    "wires": [
                        [
                            "86985dace5c7b2d7"
                        ]
                    ]
                },
                {
                    "id": "4b0e35f3adcb49d4",
                    "type": "mqtt-broker",
                    "name": "",
                    "broker": "mqtt.corrently.cloud",
                    "port": "8883",
                    "tls": "",
                    "clientid": "timedb",
                    "autoConnect": true,
                    "usetls": true,
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
                },
                {
                    "id": "afcbcc7359609990",
                    "type": "influxdb",
                    "protocol": "http",
                    "database": "current",
                    "name": "TimeDB",
                    "usetls": false,
                    "tls": "",
                    "influxdbVersion": "1.8-flux",
                    "url": $('#deviceIP').val(),
                    "rejectUnauthorized": true
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