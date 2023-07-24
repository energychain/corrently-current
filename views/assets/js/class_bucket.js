class Bucket {
    /**
     * Retrieves a bucket from the API based on the provided bucket ID.
     *
     * @param {string} bucketId - The ID of the bucket to retrieve.
     * @return {Promise} A Promise that resolves to the retrieved bucket.
     */
    retrieveBucket(bucketId) {
            console.log("retrieveBucket",bucketId);
            return new Promise(function(resolve,reject) {
                $.getJSON("https://api.corrently.io/v2.0/tydids/bucket/intercom?id="+bucketId,function(data) {
                    if((typeof data.val == 'undefined')||(data.val == 'undefined')) {
                        reject("Bucket not found");
                    } else {
                        data.val = JSON.parse(data.val);
                        data.val._cached = new Date().getTime();
                        resolve(data.val);
                    }
                })
            });
        }
    
    /**
     * Stores the bucket in the API.
     *
     * @return {Promise} A promise that resolves with the ID of the stored bucket.
     */
    storeBucket(node) {
        console.log("storeBucket",node);
            return new Promise(function(resolve) {
                $.ajax({
                    type: "POST",
                    url: "https://api.corrently.io/v2.0/tydids/bucket/intercom",
                    data: "&value=" + encodeURIComponent(JSON.stringify(node.payload)),
                    success: function(data) {
                        resolve(data.id);
                    }
                });
            });
    }
}