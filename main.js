const back = require('androidjs').back;
const mqtt = require('mqtt');

const SESSION_PING = 5000;

const _randomString = function() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';
	let randomString = '';
  
	for (let i = 0; i < 20; i++) {
	  const randomIndex = Math.floor(Math.random() * chars.length);
	  randomString += chars.charAt(randomIndex);
	}
  
	return randomString;
}

let mqttsessions = {};
let edgesession = null;

let uuids = {};

/** Handling Edge Connectivity */
back.on("/corrently/mqtt/bridge",function(msg) {
    try {
        let config = JSON.parse(msg);
        // TODO: Care about activation Flag
        const mqttclient = mqtt.connect("mqtt://"+config.edge.host+":1883");
        mqttclient.on('connect', () => {
            console.log("Connected to Edge for Bridge Setup");
            mqttclient.publish('corrently/mqtt/connect', msg);
        });
    } catch(e) {
        console.error('/corrently/mqtt/bridge',e);
    }
});

back.on("/corrently/edge/add-flow",function(msg) {
    // TODO Listen to Response via ./get 
    edgesession.publish('corrently/edge/nr-add-flow/set',msg);
});

back.on("/corrently/mqtt/connect",function(msg) {
   try {
        const _connectionOptions = JSON.parse(msg);

        const sessionId = _randomString();

        if(typeof uuids[_connectionOptions.uiid] !== 'undefined')  {
            if(typeof mqttsessions[uuids[_connectionOptions.uiid]] !== 'undefined') mqttsessions[uuids[_connectionOptions.uiid]].mqttclient.end(true);
            delete uuids[_connectionOptions.uiid];
            console.log("Discarded UIID",_connectionOptions.uiid);
        }

        uuids[_connectionOptions.uiid] = sessionId;

        const mqttclient = mqtt.connect(
                _connectionOptions
        );

        if(_connectionOptions.uiid == 'edge') {
            edgesession = mqttclient;
        }

        mqttclient.on('connect', () => {
            let msgStore = {};

            if(typeof mqttsessions[sessionId] == 'undefined') {
                mqttsessions[sessionId] = {
                    mqttclient: mqttclient,
                    heartbeat: new Date().getTime(),
                    openHeartbeats:0,
                    connected: new Date().getTime(),
                    sessionId: sessionId,
                    uiid:_connectionOptions.uiid,
                    interval:-1,
                }

                back.send("/corrently/mqtt/connected",JSON.stringify({sessionId:sessionId,status:"connected",uiid:_connectionOptions.uiid}));

                back.on('/corrently/mqtt/'+sessionId+'/subscribe',function(msg) {
                    mqttclient.subscribe(msg,function(err,msg2) {
                        if(err) {
                            back.send("/corrently/error","Session "+sessionId+" subsribe error "+err+" topic "+msg);  
                            back.send("/corrently/console","Session "+sessionId+" subsribe error "+err+" topic "+msg); 
                        } else back.send("/corrently/console","Session "+sessionId+" subsribed to "+msg);
                    });
                    mqttclient.on('message', (topic, payload) => {
                        if(typeof msgStore[topic] == 'undefined') {
                            back.send('/corrently/mqtt/'+sessionId+'/topicsDiscovery',topic);
                        }
                        msgStore[topic] = payload.toString();
                        back.send('/corrently/mqtt/'+sessionId+'/'+topic,payload.toString());                        
                        
                       // back.send("/corrently/console","MQTT Messsge on topic "+topic+": "+payload.toString());
                    })
                });
                back.send("/corrently/console","MQTT Connected SessionID: "+sessionId+" to UIID:"+_connectionOptions.uiid);
                console.log("/corrently/console","MQTT Connected SessionID: "+sessionId+" to UIID:"+_connectionOptions.uiid);

                // Monitoring if UI session is still alive.
                const ping = function() {
                    const heartBeatStamp = _randomString();
                    back.on('/corrently/mqtt/'+sessionId+'/pong',function(msg) {
                        if(msg == heartBeatStamp) {
                            mqttsessions[sessionId].heartbeat = new Date().getTime();
                            mqttsessions[sessionId].openHeartbeats--;
                        }
                    })
                    back.send('/corrently/mqtt/'+sessionId+'/ping',heartBeatStamp)
                };

                mqttsessions[sessionId].interval = setInterval(function() {
                    if(mqttsessions[sessionId].heartbeat < new Date().getTime()-SESSION_PING) {
                        mqttsessions[sessionId].openHeartbeats++;
                        ping();
                        if(mqttsessions[sessionId].openHeartbeats > 2) {
                            clearInterval(mqttsessions[sessionId].interval);
                            mqttsessions[sessionId].mqttclient.end(true);
                            delete mqttsessions[sessionId];
                            back.send("/corrently/console","Session closed due to timeout: "+sessionId);
                        }
                    }
                },SESSION_PING * 3);
            }
        });
        back.on("/corrently/mqtt/disconnect",function(msg) {
            if(msg == _connectionOptions.uiid) {
                mqttclient.end();
            }
        });
        mqttclient.on('error',(e) =>{
            console.log(e.toString());
            back.send("/corrently/mqtt/error",JSON.stringify({sessionId:sessionId,status:"failed",uiid:_connectionOptions.uiid,error:e.toString()}));
        });
    } catch(e) {
        back.send("/corrently/error",e);
        back.send("/corrently/console",e);
        console.error(e);
    }
    
});
