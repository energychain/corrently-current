class Bucket {
    /**
     * Retrieves a bucket from the API based on the provided bucket ID.
     *
     * @param {string} bucketId - The ID of the bucket to retrieve.
     * @return {Promise} A Promise that resolves to the retrieved bucket.
     */
    retrieveBucket(bucketId) {
            return new Promise(function(resolve,reject) {
                const profile = JSON.parse(window.localStorage.getItem("corrently_cloud_user"));
                $.ajax({
                    beforeSend: function(request) {
                        request.setRequestHeader("x-account", profile.username);
                    },
                    dataType: "json",
                    url:"https://api.corrently.io/v2.0/tydids/bucket/intercom?id="+bucketId,
                    success: function(data) {
                        if((typeof data.val == 'undefined')||(data.val == 'undefined')) {
                            reject("Bucket not found");
                        } else {
                            data.val = JSON.parse(data.val);
                            data.val._cached = new Date().getTime();
                            resolve(data.val);
                        }
                    }
                });
            });
        }
    
    /**
     * Stores the bucket in the API.
     *
     * @return {Promise} A promise that resolves with the ID of the stored bucket.
     */
    storeBucket(node) {
            return new Promise(function(resolve) {
                const profile = JSON.parse(window.localStorage.getItem("corrently_cloud_user"));
                $.ajax({
                    type: "POST",
                    beforeSend: function(request) {
                        request.setRequestHeader("x-account", profile.username);
                    },
                    url: "https://api.corrently.io/v2.0/tydids/bucket/intercom",
                    data: "&value=" + encodeURIComponent(JSON.stringify(node.payload)),
                    success: function(data) {
                        resolve(data.id);
                    }
                });
            });
    }
}