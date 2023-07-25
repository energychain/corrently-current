class Profile {

    constructor(id) {
            // Existing Profile
            this.payload =  JSON.parse(window.localStorage.getItem('profile'));
            this.bucket = new Bucket();
            this.payload = {};

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
        if(typeof this.payload == "string") {
            this.payload = await this.bucket.retrieveBucket(this.payload);
        }
        this.payload.bucketId = await this.bucket.storeBucket(this);
        console.log("Set Profile",this.payload);
        window.localStorage.setItem('profile',JSON.stringify(this.payload));
    }
}