class Topic {

    constructor(id) {
        if((typeof id == 'undefined') || (id == null)) {
            // Create new Topic
            this,id = _randomString();
           this.payload = {};
        } else {
            // Existing Topic
            this.id = id;
            let cached_topic = window.localStorage.getItem('topic_'+id);
            if((typeof cached_topic !== 'undefined') && (cached_topic !== null)) {
                this.payload = JSON.parse(cached_topic);
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
                if(typeof this.payload._cached == 'undefined') {
                    this.payload = await this.bucket.retrieveBucket(this.payload.bucketId);
                    this.payload._cached = new Date().getTime();
                    window.localStorage.setItem('topic_'+this.id,JSON.stringify(this.payload));
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
        window.localStorage.setItem('topic_'+this.id,JSON.stringify(this.payload));
    }

    /**
     * Create HTML rendition of this Topic
     *
     * @return {String} HTML Code for topic.
     */
    renderHTML(sortId) {
        let topic_html = "";
        let width = 4;
        if(typeof this.payload.width !== 'undefined') {
            width = this.payload.width;
        }
        let defaultValue = '-';
        if(typeof this.payload.defaultValue !== 'undefined') {
            defaultValue = this.payload.defaultValue;
        }
        topic_html += '<div class="col-md-'+width+' portlet" title="'+this.payload.topic+'" id="sort_'+this.id+'" sort="'+sortId+'">'
        topic_html += '<div class="card moveable" style="margin-bottom:15px"><div class="heijoh">';
        topic_html += '<div class="card-body text-center">';                
        topic_html += '<div class="'+this.payload.connectionId+' text-right text-truncate display-4 idle_'+this.id+'" data-colorize="'+this.payload.colorize+'" corrently-maxlength=20 corrently-renderer="'+this.payload.renderer+'" corrently-topic="'+this.id+'">'+defaultValue+'</div>';
        topic_html += '<div>' + this.payload.alias + '</div>';

        topic_html += '<a style="margin-top:-25px;margin-right:-5px" class="btn btn-secondary btn-sm float-end" data-bs-toggle="collapse" aria-expanded="false" aria-controls="#area_'+this.id+'" href="#area_'+this.id+'" role="button">'
        topic_html += '<svg class="bi bi-chevron-double-down" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
        topic_html += '<path fill-rule="evenodd" d="M1.646 6.646a.5.5 0 0 1 .708 0L8 12.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"></path>';
        topic_html += '<path fill-rule="evenodd" d="M1.646 2.646a.5.5 0 0 1 .708 0L8 8.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"></path>';
        topic_html += '</svg>';
        topic_html += '</a>';    
        topic_html += '</div>';
        topic_html += '</div>';

        topic_html += '<div class="collapse" id="area_'+this.id+'">';
        topic_html += '<div class="card-body" style="padding-bottom:15px;">';
        topic_html += '<div style="margin-top:15px;">';
        topic_html += '<strong>Connection</strong><br/>';
        topic_html += this.payload.connectionId;
        topic_html += '</div>';
        topic_html += '<div style="margin-top:15px;">';
        topic_html += '<strong>MQTT Topic</strong><br/>';
        topic_html += this.payload.topic;
        topic_html += '</div>';
        topic_html += '<div style="margin-top:15px;">';
        topic_html += '<strong>DataPoint Alias</strong><br/>';
        topic_html += '<div class="input-group">';
        topic_html +=  '<input class="form-control w-100" type="text" id="alias_'+this.id+'" value="'+this.payload.alias+'"/>';
        topic_html += '</div>';
        topic_html += '</div>';
        topic_html += '<div style="margin-top:15px;">';
        topic_html += '<strong>Value Renderer</strong><br/>';
        topic_html += '<div class="input-group">';
        topic_html +=  '<input class="form-control w-100" type="text" id="renderer_'+this.id+'" value="'+this.payload.renderer+'"/>';
        topic_html += '</div>';
        topic_html += '</div>';
        topic_html += '<div style="margin-top:15px;">';
        topic_html += '<strong>Colorize Changes</strong><br/>';
        topic_html += '<div class="input-group">';
        topic_html +=     '<select id="colorize_'+this.id+'" class="form-control">';
        topic_html +=         '<option value="1">Organge Up / Green Down</option>';
        topic_html +=         '<option value="-1">Green Up / Orange Down</option>';
        topic_html +=     '</select>';   
        topic_html += '</div>';
        topic_html += '</div>';
        topic_html += '<div style="margin-top:15px;">';
        topic_html += '<strong>Width</strong><br/>';
        topic_html += '<div class="input-group">';
        topic_html +=     '<select id="width_'+this.id+'" class="form-control" value="'+width+'">';
        topic_html +=         '<option value="'+width+'" selected>'+width+' (selected)</option>';  
        topic_html +=         '<option>1</option>';
        topic_html +=         '<option>2</option>';
        topic_html +=         '<option>3</option>';
        topic_html +=         '<option value="4">4 (default)</option>';
        topic_html +=         '<option>5</option>';
        topic_html +=         '<option>6</option>';
        topic_html +=         '<option>7</option>';
        topic_html +=         '<option>8</option>';
        topic_html +=         '<option>9</option>';
        topic_html +=         '<option>10</option>';
        topic_html +=         '<option>11</option>';
        topic_html +=         '<option>12</option>';
        topic_html +=     '</select>';   
        topic_html += '</div>';
        topic_html += '</div>';
        topic_html += '<div style="margin-top:15px;">';
        topic_html += '<button type="button" style="margin-right:10px;" class="btn btn-danger float-start deleteTopic" id="delete_'+this.id+'" data-topic="'+this.id+'" data-connection="'+this.payload.connectionId+'">';
        topic_html += '<svg class="bi bi-trash" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
        topic_html += '<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path>';
        topic_html += '<path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>';
        topic_html += '</svg>';
        topic_html += '</button>';
        topic_html += '<button type="button" style="margin-right:10px;" class="btn btn-secondary shareTopic" id="share_'+this.id+'" data-topic="'+this.id+'" data-connection="'+this.payload.connectionId+'">';
        topic_html += '<svg class="bi bi-box-arrow-right" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
        topic_html += '<path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"></path>';
        topic_html += '<path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"></path>';
        topic_html += '</svg>'
        topic_html += '</button>';
        topic_html += '<button type="button" class="btn btn-success float-end saveTopic" id="save_'+this.id+'" data-topic="'+this.id+'" data-connection="'+this.payload.connectionId+'">';
        topic_html += '<svg class="bi bi-save" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
        topic_html += '<path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"></path>';
        topic_html += '</svg>';
        topic_html += '</button>';
        topic_html += '</div>';
        topic_html += '</div>';
        topic_html += '</div></div>';
        topic_html += '</div>';
        return topic_html;
    }
}