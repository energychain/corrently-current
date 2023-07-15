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
                "topic":"varta_engion/SOC_GS",
                "alias":"% Charged",
                "id":_randomString(),
                "colorize":"1"
            },
            {
                "topic":"varta_engion/PSoll",
                "alias":"W Soll",
                "id":_randomString(),
                "colorize":"1"
            }
        ];
        settings['edge_flow'] = {
            "modules": [],
            "label": "Varta Engion",
            "flow":[{"id":"8d3b05700252158e","type":"inject","z":"1d313a6ec4140758","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"5","crontab":"","once":true,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":150,"y":180,"wires":[["90b28ebb525cf56b"]]},{"id":"90b28ebb525cf56b","type":"http request","z":"1d313a6ec4140758","name":"","method":"GET","ret":"txt","paytoqs":"ignore","url":"http://"+$('#deviceIP').val()+"/cgi/ems_data.js","tls":"","persist":false,"proxy":"","insecureHTTPParser":false,"authType":"","senderr":false,"headers":[],"x":350,"y":160,"wires":[["cc56a024a6507665","19c77bee0d88449c"]]},{"id":"cc56a024a6507665","type":"function","z":"1d313a6ec4140758","name":"WR_Data","func":"let WR_Conf = [\"EMS PExtra\", \"EMS UG\", \"EMS OG\", \"EMS Timer\", \"PSoll\", \"U Verbund L1\", \"U Verbund L2\", \"U Verbund L3\", \"I Verbund L1\", \"I Verbund L2\", \"I Verbund L3\", \"U Insel L1\", \"U Insel L2\", \"U Insel L3\", \"I Insel L1\", \"I Insel L2\", \"I Insel L3\", \"Temp L1\", \"Temp L2\", \"Temp L3\", \"TBoard\", \"FNetz\", \"U N->PE\", \"OnlineStatus\", \"System State\", \"SK\", \"RB_IP\", \"RCMU\", \"UVcc\", \"UZwk\", \"UMp\", \"Luefter\", \"WR Ctrl\", \"ENS Ctrl\", \"EMS Ctrl\", \"EMS Mode\", \"POpt\", \"BetrFlags1\", \"BetrFlags2\", \"PMB\", \"EMB\"];\nlet Charger_Conf = [\"Index\", \"Enabled\", \"SOC_GS\", \"State\", \"U\", \"I\", \"UOut\", \"UCool\", \"UVcc\", \"THT\", \"TTr\", \"TBoard\", \"PSoll\", \"SOHCmax\", \"SOHCuxtime\", \"SOHDmax\", \"SOHDuxtime\", \"ErrorFlags\", \"BattData\"];\n\nlet wr_data = msg.payload;\nwr_data = wr_data.substring(wr_data.indexOf(\"WR_Data\") + \"WR_Data\".length + 3);\nwr_data = JSON.parse(wr_data.substring(0, wr_data.indexOf(\"]\") + 1));\nmsg.payload = wr_data;\n\nlet payload = {};\nfor (let i = 0; i < WR_Conf.length; i++) {\n    const topic = WR_Conf[i].replace(/ /g, '_');\n    let mqttmsg = {\n        payload:wr_data[i],\n        topic: \"varta_engion/\" + topic\n    }\n    node.send(mqttmsg);\n   //  payload[WR_Conf[i]] = wr_data[i];\n}\n\nreturn null;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":600,"y":160,"wires":[["93515c4224ab463f"]]},{"id":"19c77bee0d88449c","type":"function","z":"1d313a6ec4140758","name":"Charg_Data","func":"let WR_Conf = [\"EMS PExtra\", \"EMS UG\", \"EMS OG\", \"EMS Timer\", \"PSoll\", \"U Verbund L1\", \"U Verbund L2\", \"U Verbund L3\", \"I Verbund L1\", \"I Verbund L2\", \"I Verbund L3\", \"U Insel L1\", \"U Insel L2\", \"U Insel L3\", \"I Insel L1\", \"I Insel L2\", \"I Insel L3\", \"Temp L1\", \"Temp L2\", \"Temp L3\", \"TBoard\", \"FNetz\", \"U N->PE\", \"OnlineStatus\", \"System State\", \"SK\", \"RB_IP\", \"RCMU\", \"UVcc\", \"UZwk\", \"UMp\", \"Luefter\", \"WR Ctrl\", \"ENS Ctrl\", \"EMS Ctrl\", \"EMS Mode\", \"POpt\", \"BetrFlags1\", \"BetrFlags2\", \"PMB\", \"EMB\"];\nlet Charger_Conf = [\"Index\", \"Enabled\", \"SOC_GS\", \"State\", \"U\", \"I\", \"UOut\", \"UCool\", \"UVcc\", \"THT\", \"TTr\", \"TBoard\", \"PSoll\", \"SOHCmax\", \"SOHCuxtime\", \"SOHDmax\", \"SOHDuxtime\", \"ErrorFlags\", \"BattData\"];\n\nlet wr_data = msg.payload;\nwr_data = wr_data.substring(wr_data.indexOf(\"Charger_Data\") + \"Charger_Data\".length + 3);\nwr_data = JSON.parse(wr_data.substring(0, wr_data.indexOf(\";\")));\nwr_data = wr_data[0];\n\nlet payload = {};\nfor (let i = 0; i < Charger_Conf.length; i++) {\n    const topic = Charger_Conf[i].replace(/ /g, '_');\n    let mqttmsg = {\n        payload: wr_data[i],\n        topic: \"varta_engion/\" + topic\n    }\n    node.send(mqttmsg);\n}\nmsg.payload = payload;\n\nreturn null;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":630,"y":240,"wires":[["93515c4224ab463f"]]},{"id":"93515c4224ab463f","type":"function","z":"1d313a6ec4140758","name":"Concentrator","func":"const old_value = flow.get(msg.topic.replace(/\\//g, \"_\"));\nif(old_value !== msg.payload) {\n    flow.set(msg.topic.replace(/\\//g, \"_\"),msg.payload);\n} else {\n    msg = null;\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":910,"y":160,"wires":[["90eb1a8e8cdf7afb"]]},{"id":"90eb1a8e8cdf7afb","type":"mqtt out","z":"1d313a6ec4140758","name":"","topic":"","qos":"","retain":"","respTopic":"","contentType":"","userProps":"","correl":"","expiry":"","broker":"63868f3c0f13b5be","x":1030,"y":280,"wires":[]},{"id":"63868f3c0f13b5be","type":"mqtt-broker","name":"","broker":"localhost","port":"1883","clientid":"","autoConnect":true,"usetls":false,"protocolVersion":"4","keepalive":"60","cleansession":true,"birthTopic":"","birthQos":"0","birthPayload":"","birthMsg":{},"closeTopic":"","closeQos":"0","closePayload":"","closeMsg":{},"willTopic":"","willQos":"0","willPayload":"","willMsg":{},"userProps":"","sessionExpiry":""}]            
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