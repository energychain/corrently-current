const CONNECTION_TEST_INTERVAL = 5000; // Test Backend Connection every x MS

let sessions = {};


/**
 * Generates a random string consisting of uppercase letters, lowercase letters, numbers, and underscores.
 *
 * @return {string} The randomly generated string.
 */
const _randomString = function() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
	let randomString = '';
	for (let i = 0; i < 20; i++) {
	  const randomIndex = Math.floor(Math.random() * chars.length);
	  randomString += chars.charAt(randomIndex);
	}
	return randomString;
}

/**
 * Monitors the connection of a session.
 *
 * @param {string} sessionId - The ID of the session being monitored.
 * @param {any} parent - The parent object.
 * @return {undefined} This function does not return a value.
 */
const monitorSessionConnection = function(sessionId,parent) {
    sessions[sessionId] = { heartbeat: new Date().getTime(),parent:parent};

    front.on('/corrently/mqtt/'+sessionId+'/ping',function(pongRequest) {
        front.send('/corrently/mqtt/'+sessionId+'/pong',pongRequest);
        sessions[sessionId].hearbeat = new Date().getTime();
    });
};

class MQTTSource {
    
    constructor(connectSettings) {
        if(typeof connectSettings !== 'object') {
            connectSettings = JSON.parse(window.localStorage.getItem('connection_'+connectSettings));
        }
        if(typeof connectSettings.connectionId == 'undefined') {
            connectSettings.connectionId = _randomString();
        }
        this.connectSettings = connectSettings;
      
        this.connected = false;
        
    }

    /**
     * Connects to the MQTT broker and returns a promise that resolves with the connection ID.
     *
     * @return {Promise} A promise that resolves with the connection ID.
     */
    connect() {
        const parent = this;
        return new Promise((resolve,reject) => {
            parent.connectSettings.uiid = parent.connectSettings.connectionId;

            front.on("/corrently/mqtt/connected",function(msg) {
                let sessionInfo = JSON.parse(msg);
                if((sessionInfo.status !== 'connected')||(sessionInfo.uiid !== parent.connectSettings.connectionId)) {
                  //  console.error('Failed to Connect',msg,parent.connectSettings.connectionId);
                    reject('Failed to Connect');
                } else {
                    // Activate Heartbeat Monitoring and resolve connect call
                    monitorSessionConnection(sessionInfo.sessionId,parent);
                    parent.sessionId = sessionInfo.sessionId;
                    parent.connected = true;
                    window.localStorage.setItem('connection_'+parent.connectSettings.connectionId,JSON.stringify(parent.connectSettings));
                    resolve(parent.connectSettings.connectionId);
                }
            });
            front.send("/corrently/mqtt/connect",JSON.stringify(parent.connectSettings));
        });
    }

    /**
     * Retrieves the connection ID.
     *
     * @return {string} The connection ID.
     */
    getConnectionId() {
        return this.connectSettings.connectionId;
    }

    /**
     * Subscribes to a specific topic and registers a callback function.
     *
     * @param {string} topic - The topic to subscribe to.
     * @param {function} callback - The callback function to be executed when a message is received on the subscribed topic.
     */
    subscribe(topic,callback) {
        if(!this.connected) throw "MQTTSource is not in connected state.";
        front.on('/corrently/mqtt/'+this.sessionId+'/'+topic,callback);
        front.send('/corrently/mqtt/'+this.sessionId+'/subscribe',topic);
    }
}