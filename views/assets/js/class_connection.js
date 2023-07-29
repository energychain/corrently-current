class Connection {

    constructor(connetionId) {
        if((typeof connetionId == 'undefined') || (connetionId == null)) {
            // Create new Topic
            this.connetionId = _randomString();
           this.payload = {};
        } else {
            // Existing Topic
            this.connetionId = connetionId;
            let cached_topic = window.localStorage.getItem('connect_'+connetionId);
            if((typeof cached_topic !== 'undefined') && (cached_topic !== null)) {
                this.payload = JSON.parse(cached_topic);
            }
        }
        this.bucket = new Bucket();
    }

    async restoreBucket(bucketId) {
        this.payload = await this.bucket.retrieveBucket(bucketId);
    }

    /**
     * Retrieves the payload from the bucket.
     *
     * @return {Object} The payload object.
    */
    async get() {
        if(typeof this.payload !== 'undefined') {
            if(typeof this.payload.bucketId !== 'undefined') {
                const bucketId = this.payload.bucketId;
                if(typeof this.payload._cached == 'undefined') {
                    this.payload = await this.bucket.retrieveBucket(this.payload.bucketId);
                    this.payload.bucketId = bucketId;
                    this.payload._cached = new Date().getTime();
                    window.localStorage.setItem('connect_'+this.connetionId,JSON.stringify(this.payload));
                }
            } else {
                console.log("Setting Bucket Id");
                this.payload.bucketId = await this.bucket.storeBucket(this.payload);
                window.localStorage.setItem('connect_'+this.connetionId,JSON.stringify(this.payload));
            }
        } else {
            this.payload = {};
        }
        return this.payload;
    }
    
    /**
     * Set the bucket ID and store the payload in local storage.
     *
     * @return {Promise} A promise that resolves when the bucket is stored.
     */
    async set(payload) {
        delete payload.connetionId;
        delete payload.cached;
        this.payload = payload;
        if(typeof this.payload == "string") {
            this.payload = await this.bucket.retrieveBucket(this.payload);
        }
        this.connetionId = this.payload.connectionId;
        if(typeof this.connetionId == 'undefined') {
            this.connetionId = _randomString();
        }
        this.payload.bucketId = await this.bucket.storeBucket(this);
        window.localStorage.setItem('connect_'+this.connetionId,JSON.stringify(this.payload));
    }

    /**
    * Connects to a MQTT source.
    *
    * @return {Promise} A promise that resolves when the connection is established.
    */
    connect() {
        const node = this;
        return new Promise(function(resolve,reject) {
            node._connection = new MQTTSource(node.payload);
            node._connection.connect().then(function(t) {
                try {
                    if((typeof node.payload.basePath !== 'undefined') && (node.payload.basePath !== null)) {
                        const topic = node.payload.basePath;
                        node._connection.subscribe(topic,function(msg) {     });
                        node._connection.subscribe(topic+'#',function(msg) {   });
                    }
                resolve(node._connection);
                } catch(e) {
                    console.log("connection error",e);
                    reject(e);
                }
            }).catch(function(e) {
                reject(e);
            });
       })
    }

    /**
     * Subscribes to a topic and registers a callback function.
     *
     * @param {string} topic - The topic to subscribe to.
     * @param {function} callback - The callback function to be executed when a message is received on the subscribed topic.
     */
    subscribe(topic,callback) {
        if((typeof topic !== 'undefined') && (topic !== null)){
             this._connection.subscribe(topic,callback);
        }    
    }
    publish(topic,payload) {
        console.log("Connect Publish",topic);
        this._connection.publish(topic,payload);
    }
}