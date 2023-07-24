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

back.on("/corrently/edge/topics/set",function(msg) {
    edgesession.publish('corrently/edge/topics/set',msg);
});
back.on("/corrently/edge/topics/get",function(msg) {
    if(edgesession !== null) {
        edgesession.subscribe("corrently/edge/topics/result",function(err,msg2) {
           
        });
        edgesession.on('message', (topic, payload) => {
            if(topic == 'corrently/edge/topics/result') {
                back.send("/corrently/edge/topics/result",""+payload);
            }
        });

        console.log("Request via MQTT");
        edgesession.publish('corrently/edge/topics/get',msg);
    } else {console.error("EdgeSession not active")}
});


back.on("/corrently/edge/add-flow",function(msg) {
    // TODO Listen to Response via ./get 
    edgesession.publish('corrently/edge/nr-add-flow/set',msg);
});

back.on("/corrently/mqtt/connect",function(msg) {
   try {
        let msgStore = {};
        back.on("/corrently/mqtt/empty",function(msg) {
            msgStore = {};
        });
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
                        payload = payload.toString();
                        if(typeof msgStore[topic] == 'undefined') {
                            back.send('/corrently/mqtt/'+sessionId+'/topicsDiscovery',topic);
                            back.send('/corrently/mqtt/'+sessionId+'/'+topic,payload.toString()); 
                        } else if(msgStore[topic] !== payload) {
                            back.send('/corrently/mqtt/'+sessionId+'/'+topic,payload.toString());  
                        } else {
                          //  back.send('/corrently/mqtt/'+sessionId+'/'+topic,payload.toString()); 
                        }
                        msgStore[topic] = payload; 
                    })
                });
                back.send("/corrently/console","MQTT Connected SessionID: "+sessionId+" to UIID:"+_connectionOptions.uiid);
                console.log("/corrently/console","MQTT Connected SessionID: "+sessionId+" to UIID:"+_connectionOptions.uiid);

                // Monitoring if UI session is still alive.
                const ping = function() {
                    const heartBeatStamp = _randomString();
                    back.on('/corrently/mqtt/'+sessionId+'/pong',function(msg) {
                        if((typeof mqttsessions[sessionId] !== 'undefined') && (msg == heartBeatStamp)) {
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
