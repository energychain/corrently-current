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
            "modules": [ "node-red-contrib-fritzapi"],
            "label": "AVM Fritz DECT 2xx",
            "flow":[{"id":"6ca8cbfb5171fabf","type":"tab","label":"AVM Fritz Dect 2XX","disabled":false,"info":"","env":[]},{"id":"7b5bc67ca01117f4","type":"inject","z":"6ca8cbfb5171fabf","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"5","crontab":"","once":true,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":130,"y":40,"wires":[["f462de1df482313f"]]},{"id":"f462de1df482313f","type":"function","z":"6ca8cbfb5171fabf","name":"AIN","func":"msg.ain = '"+$('#deviceIAIN').val()+"'\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":290,"y":40,"wires":[["7ad7a706e04e871a","9b0c70ea5e5f867c"]]},{"id":"7ad7a706e04e871a","type":"fritz-outlet","z":"6ca8cbfb5171fabf","connection":"a648257c1096f142","name":"DECT Plug","action":"getSwitchPower","x":450,"y":40,"wires":[["9f19f35a3dbcd1fa"]]},{"id":"9b0c70ea5e5f867c","type":"fritz-outlet","z":"6ca8cbfb5171fabf","connection":"a648257c1096f142","name":"DECT Plug","action":"getSwitchEnergy","x":450,"y":100,"wires":[["280a3f6d533b25dd"]]},{"id":"280a3f6d533b25dd","type":"function","z":"6ca8cbfb5171fabf","name":"Energy","func":"let mqttmsg = {\n    payload: msg.payload,\n    topic: \"avmfritz/\" + msg.ain +\"/energy\" \n}\nnode.send(mqttmsg);\nreturn null;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":620,"y":100,"wires":[["96cb11ea97dbbdbe"]]},{"id":"9f19f35a3dbcd1fa","type":"function","z":"6ca8cbfb5171fabf","name":"Power","func":"let mqttmsg = {\n    payload: msg.payload,\n    topic: \"avmfritz/\"+msg.ain+\"/power\" \n}\nnode.send(mqttmsg);\nreturn null;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":610,"y":40,"wires":[["96cb11ea97dbbdbe"]]},{"id":"96cb11ea97dbbdbe","type":"function","z":"6ca8cbfb5171fabf","name":"Concentrator","func":"const old_value = flow.get(msg.topic.replace(/\\//g, \"_\"));\nif(old_value !== msg.payload) {\n    flow.set(msg.topic.replace(/\\//g, \"_\"),msg.payload);\n} else {\n    msg = null;\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":830,"y":60,"wires":[["b2755a17bd4576b2"]]},{"id":"b2755a17bd4576b2","type":"mqtt out","z":"6ca8cbfb5171fabf","name":"","topic":"","qos":"","retain":"","respTopic":"","contentType":"","userProps":"","correl":"","expiry":"","broker":"63868f3c0f13b4ce","x":1050,"y":60,"wires":[]},{"id":"a648257c1096f142","type":"fritz-api",
            "credentials": {
                "username": $('#deviceUser').val(),
                "password": $('#devicePassword').val()
            },"name":"MyFritz","host":"http://"+$('#deviceIP').val(),"path":"/api'","strictSSL":false},{"id":"63868f3c0f13b4ce","type":"mqtt-broker","name":"","broker":"localhost","port":"1883","clientid":"","autoConnect":true,"usetls":false,"protocolVersion":"4","keepalive":"60","cleansession":true,"birthTopic":"","birthQos":"0","birthPayload":"","birthMsg":{},"closeTopic":"","closeQos":"0","closePayload":"","closeMsg":{},"willTopic":"","willQos":"0","willPayload":"","willMsg":{},"userProps":"","sessionExpiry":""}]          
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