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
                "topic":"sma_em20/P_Bezug_momentan",
                "alias":"W Bezug",
                "id":_randomString(),
                "colorize":"1"
            },
            {
                "topic":"sma_em20/P_Einspeisung_momentan",
                "alias":"W Einspeisung",
                "id":_randomString(),
                "colorize":"1"
            }
        ];

        settings['edge_flow'] = {
            "modules": ['node-red-contrib-buffer-parser'],
            "label": "SMA EM20",
            "flow":[{"id":"3998424cef1f27ef","type":"tab","label":"SMA EM20","disabled":false,"info":"","env":[]},{"id":"8e9eaf46a7618514","type":"mqtt out","z":"3998424cef1f27ef","name":"","topic":"","qos":"","retain":"","respTopic":"","contentType":"","userProps":"","correl":"","expiry":"","broker":"13378f3c0f13b4ce","x":1330,"y":380,"wires":[]},{"id":"9215946ae17ae135","type":"link in","z":"3998424cef1f27ef","name":"","links":["7a9f5d09.5e9f6c","37f43126b23b1d5d"],"x":145,"y":200,"wires":[["f809ce0b3efec3d0"]]},{"id":"1bd0d0c5a1197f28","type":"udp in","z":"3998424cef1f27ef","name":"SMA Energy Meter","iface":"","port":"9522","ipv":"udp4","multicast":"true","group":"239.12.255.254","datatype":"buffer","x":120,"y":120,"wires":[["defaaf81b87e54e4"]]},{"id":"3e60636fa708ca4d","type":"switch","z":"3998424cef1f27ef","name":"8-counter, 4-actual, 0-version, other","property":"payload.datatype","propertyType":"msg","rules":[{"t":"eq","v":"8","vt":"num"},{"t":"eq","v":"4","vt":"num"},{"t":"eq","v":"0","vt":"num"},{"t":"else"}],"checkall":"true","repair":false,"outputs":4,"x":620,"y":200,"wires":[["0c3ac9eef0028172"],["8afacf72e54a2d11"],["cbc41a9160ed42d7"],["cbc41a9160ed42d7"]]},{"id":"5ba35949f10eb9f9","type":"function","z":"3998424cef1f27ef","name":"Data","func":"var sma_units = {\n    \"W\": 10,\n    \"VA\": 10,\n    \"var\": 10,\n    \"kWh\": 3600000,\n    \"kVAh\": 3600000,\n    \"kvarh\": 3600000,\n    \"A\": 1000,\n    \"V\": 1000,\n    \"-\": 1000,\n    \"Hz\": 1000,\n};\nvar sma_channels = {\n    //# gesamt\n    1: ['P Bezug', 'W', 'kWh'],\n    2: ['P Einspeisung', 'W', 'kWh'],\n    3: ['Q induktiv', 'var', 'kvarh'],\n    4: ['Q kapazitiv', 'var', 'kvarh'],\n    9: ['S Bezug', 'VA', 'kVAh'],\n    10: ['S Einspeisung', 'VA', 'kVAh'],\n    13: ['cosphi', '-'],\n    14: ['Frequenz', 'Hz'],\n    //# L1\n    21: ['P1 Bezug', 'W', 'kWh'],\n    22: ['P1 Einspeisung', 'W', 'kWh'],\n    23: ['Q1 ind.', 'var', 'kvarh'],\n    24: ['Q1 kap.', 'var', 'kvarh'],\n    29: ['S1 Bezug', 'VA', 'kVAh'],\n    30: ['S1 Einspeisung', 'VA', 'kVAh'],\n    31: ['I L1', 'A'],\n    32: ['U L1', 'V'],\n    33: ['cosphi L1', '-'],\n    //# L2\n    41: ['P2 Bezug', 'W', 'kWh'],\n    42: ['P2 Einspeisung', 'W', 'kWh'],\n    43: ['Q2 ind.', 'var', 'kvarh'],\n    44: ['Q2 kap.', 'var', 'kvarh'],\n    49: ['S2 Bezug', 'VA', 'kVAh'],\n    50: ['S2 Einspeisung', 'VA', 'kVAh'],\n    51: ['I L2', 'A'],\n    52: ['U L2', 'V'],\n    53: ['cosphi L2', '-'],\n    //# L3\n    61: ['P3 Bezug', 'W', 'kWh'],\n    62: ['P3 Einspeisung', 'W', 'kWh'],\n    63: ['Q3 ind.', 'var', 'kvarh'],\n    64: ['Q3 kap.', 'var', 'kvarh'],\n    69: ['S3 Bezug', 'VA', 'kVAh'],\n    70: ['S3 Einspeisung', 'VA', 'kVAh'],\n    71: ['I L3', 'A'],\n    72: ['U L3', 'V'],\n    73: ['cosphi L3', '-'],\n};\n\nmsg.result = msg.result || {};\n\nfunction decode_item_header(datatype, measurement) {\n    if (datatype == 4)\n        return 'momentan'\n    else if (datatype == 8)\n        return 'Zähler';\n}\n\n\nvar pl2 = msg.payload2;\nvar pl = msg.payload;\n\nvar measurement = pl.measurement;\nvar datatype = pl.datatype;\nvar ch = sma_channels[measurement] || [];\nvar valuename = ch[0], unit = ch[1]; var unitForCounter = ch[2];\n\nvar hasValue = pl2.hasOwnProperty('value');\nif (valuename && hasValue) {\n    var value = pl2.value;\n    var typeName = decode_item_header(datatype, measurement);\n    var t = typeof value;\n    var divisor = 1;\n    if (typeName == \"Zähler\" && unitForCounter ) {\n        divisor = sma_units[unitForCounter] || 1;\n        msg.result[valuename + \" \" + typeName + \" Einheit\"] = unitForCounter;\n    } else {\n        divisor = sma_units[unit] || 1;\n        msg.result[valuename + \" \" + typeName + \" Einheit\"] = unit;\n    }\n    \n    if (t === \"number\") {\n        msg.result[valuename + \" \" + typeName] = value / divisor;\n    } else if (t === \"bigint\") {\n        msg.result[valuename + \" \" + typeName] = Number(value / BigInt(divisor));\n    } else {\n        msg.result[valuename + \" \" + typeName] = value;\n    }\n}\n\n\n/** @type {Buffer} */ var buf = pl2.data;\nif (buf && buf.length >= 8) {\n    msg.payload = {\n        data: pl2.data\n    };\n    return [msg,null];\n}\nmsg.payload = msg.result;\nreturn [null, msg];","outputs":2,"noerr":0,"initialize":"","finalize":"","libs":[],"x":1080,"y":200,"wires":[["37f43126b23b1d5d"],["876b274c5cbafc3b"]]},{"id":"37f43126b23b1d5d","type":"link out","z":"3998424cef1f27ef","name":"","mode":"link","links":["9215946ae17ae135","99c7e782f8df3ff0"],"x":1195,"y":140,"wires":[]},{"id":"876b274c5cbafc3b","type":"function","z":"3998424cef1f27ef","name":"Clean Data","func":"\nlet npayload = {};\n\nfor (const [key, value] of Object.entries(msg.payload)) {\n    if(!isNaN(value)) {\n        const nkey = key.replace(/ /g, '_');\n        npayload[nkey] = value;\n        node.send({ payload: value, topic:'sma_em20/'+nkey});\n    }\n}\nreturn null;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":1130,"y":260,"wires":[["3d2a62532f61573e"]]},{"id":"defaaf81b87e54e4","type":"buffer-parser","z":"3998424cef1f27ef","name":"","data":"payload","dataType":"msg","specification":"spec","specificationType":"ui","items":[{"type":"string","name":"sma","offset":0,"length":3,"offsetbit":0,"scale":"1","mask":""},{"type":"uint32be","name":"Tag=>Tag0","offset":4,"length":1,"offsetbit":0,"scale":">> 4","mask":"0xff0"},{"type":"uint32be","name":"Tag=>Version","offset":4,"length":1,"offsetbit":0,"scale":"0","mask":"0xf"},{"type":"uint32be","name":"Group","offset":8,"length":1,"offsetbit":0,"scale":"0","mask":""},{"type":"uint32be","name":"item10","offset":25,"length":1,"offsetbit":0,"scale":">> 4","mask":"0xFFF0"},{"type":"uint16be","name":"ProtocolID","offset":16,"length":1,"offsetbit":0,"scale":"0","mask":""},{"type":"uint32be","name":"meter_identifier=>SusyID","offset":18,"length":1,"offsetbit":0,"scale":">> 4","mask":"0xFFF0"},{"type":"uint32be","name":"meter_identifier=>SerNo","offset":21,"length":1,"offsetbit":0,"scale":">> 4","mask":"0xFFF0"},{"type":"buffer","name":"data","offset":28,"length":-1,"offsetbit":0,"scale":"1","mask":""}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgProperty":"payload","msgPropertyType":"str","resultType":"keyvalue","resultTypeType":"output","multipleResult":false,"fanOutMultipleResult":false,"setTopic":true,"outputs":1,"x":380,"y":120,"wires":[["f809ce0b3efec3d0"]]},{"id":"f809ce0b3efec3d0","type":"buffer-parser","z":"3998424cef1f27ef","name":"","data":"payload.data","dataType":"msg","specification":"spec","specificationType":"ui","items":[{"type":"int16be","name":"measurement","offset":0,"length":1,"offsetbit":0,"scale":"1","mask":""},{"type":"uint8","name":"datatype","offset":2,"length":1,"offsetbit":0,"scale":"1","mask":""},{"type":"buffer","name":"data","offset":0,"length":-1,"offsetbit":0,"scale":"1","mask":""}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgProperty":"payload","msgPropertyType":"str","resultType":"keyvalue","resultTypeType":"output","multipleResult":false,"fanOutMultipleResult":false,"setTopic":true,"outputs":1,"x":380,"y":200,"wires":[["3e60636fa708ca4d"]]},{"id":"0c3ac9eef0028172","type":"buffer-parser","z":"3998424cef1f27ef","name":"","data":"payload.data","dataType":"msg","specification":"spec","specificationType":"ui","items":[{"type":"biguint64be","name":"value","offset":4,"length":1,"offsetbit":0,"scale":"1","mask":""},{"type":"buffer","name":"data","offset":12,"length":-1,"offsetbit":0,"scale":"1","mask":""}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgProperty":"payload2","msgPropertyType":"str","resultType":"keyvalue","resultTypeType":"output","multipleResult":false,"fanOutMultipleResult":false,"setTopic":true,"outputs":1,"x":900,"y":180,"wires":[["5ba35949f10eb9f9"]]},{"id":"8afacf72e54a2d11","type":"buffer-parser","z":"3998424cef1f27ef","name":"","data":"payload.data","dataType":"msg","specification":"spec","specificationType":"ui","items":[{"type":"uint32be","name":"value","offset":4,"length":1,"offsetbit":0,"scale":"1","mask":""},{"type":"buffer","name":"data","offset":8,"length":-1,"offsetbit":0,"scale":"1","mask":""}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgProperty":"payload2","msgPropertyType":"str","resultType":"keyvalue","resultTypeType":"output","multipleResult":false,"fanOutMultipleResult":false,"setTopic":true,"outputs":1,"x":900,"y":220,"wires":[["5ba35949f10eb9f9"]]},{"id":"cbc41a9160ed42d7","type":"buffer-parser","z":"3998424cef1f27ef","name":"","data":"payload.data","dataType":"msg","specification":"spec","specificationType":"ui","items":[{"type":"buffer","name":"data","offset":8,"length":-1,"offsetbit":0,"scale":"1","mask":""}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgProperty":"payload2","msgPropertyType":"str","resultType":"keyvalue","resultTypeType":"output","multipleResult":false,"fanOutMultipleResult":false,"setTopic":true,"outputs":1,"x":900,"y":260,"wires":[["5ba35949f10eb9f9"]]},{"id":"3d2a62532f61573e","type":"function","z":"3998424cef1f27ef","name":"Concentrator","func":"const old_value = flow.get(msg.topic.replace(/\\//g, \"_\"));\nif(old_value !== msg.payload) {\n    flow.set(msg.topic.replace(/\\//g, \"_\"),msg.payload);\n} else {\n    msg = null;\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":1210,"y":320,"wires":[["1cc36873271237b4"]]},{"id":"1cc36873271237b4","type":"delay","z":"3998424cef1f27ef","name":"","pauseType":"timed","timeout":"5","timeoutUnits":"seconds","rate":"10","nbRateUnits":"60","rateUnits":"second","randomFirst":"1","randomLast":"5","randomUnits":"seconds","drop":true,"allowrate":false,"outputs":1,"x":1110,"y":380,"wires":[["8e9eaf46a7618514"]]},{"id":"13378f3c0f13b4ce","type":"mqtt-broker","name":"","broker":"localhost","port":"1883","clientid":"","autoConnect":true,"usetls":false,"protocolVersion":"4","keepalive":"60","cleansession":true,"birthTopic":"","birthQos":"0","birthPayload":"","birthMsg":{},"closeTopic":"","closeQos":"0","closePayload":"","closeMsg":{},"willTopic":"","willQos":"0","willPayload":"","willMsg":{},"userProps":"","sessionExpiry":""}]            
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