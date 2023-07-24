class Profile {

    constructor(id) {
        if((typeof id == 'undefined') || (id == null)) {
            // Create new Profile
           this,id = _randomString();
           this.payload = {};
        } else {
            // Existing Profile
            this.id = id;
            let cached_profile = window.localStorage.getItem('profile');
            if((typeof cached_profile !== 'undefined') && (cached_profile !== null)) {
                this.payload = JSON.parse(cached_profile);
            } else {
                this.payload = {};
            }
        }
        this.bucket = new Bucket();
     
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
                    try {
                        this.payload = await this.bucket.retrieveBucket(this.payload.bucketId);
                        this.payload.bucketId = bucketId;
                        this.payload._cached = new Date().getTime();
                        window.localStorage.setItem('profile',JSON.stringify(this.payload));
                    } catch(e) {
                        console.log(e);
                        // Bucket not Found Exception
                        this.payload = {};
                        this.payload.bucketId = bucketId;
                    }
                }
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
        if((typeof payload == 'undefined') || (payload == null)) {
            payload = this.payload;
        }
        
        delete payload.id;
        delete payload.cached;
        this.payload = payload;
        this.payload.bucketId = await this.bucket.storeBucket(this);
        window.localStorage.setItem('profile',JSON.stringify(this.payload));
    }
}