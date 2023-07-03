// Handles PubSub communication to Edge or Cloud Backend

const ipc_android = {
    publish:  function(topic,msg) {
        front.send(topic, msg);
    },
    subscribe: function(topic,cb) {
        front.on(topic, cb);
    }
}
