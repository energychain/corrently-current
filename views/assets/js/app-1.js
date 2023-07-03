const CONNECTION_TEST_INTERVAL = 5000; // Test Backend Connection every x MS

$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


const _randomString = function() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';
	let randomString = '';
  
	for (let i = 0; i < 20; i++) {
	  const randomIndex = Math.floor(Math.random() * chars.length);
	  randomString += chars.charAt(randomIndex);
	}
  
	return randomString;
}

const bindElements = function() {
    for(let i=0;i<$("[title-topic]").length;i++) { topicToElementTitle('#'+$("[title-topic]")[i].id); }
    for(let i=0;i<$("[html-topic]").length;i++) { topicToElementHTML('#'+$("[html-topic]")[i].id); }
}

const ipc = {
        _implementation:null,

        // private Methods

        // Valid Connection is if Ping gets answered for this session - if not connection is lost or session is invalid.

        _testConnection: async function() {
            if(this._implementation == null) return false;

            let result = "";
            const pong = new Promise((resolve,reject) => {
                this._implementation.subscribe("/session/"+ipc.sessionid+"/ping",function(msg) {
                    result = msg;
                    resolve(msg);
                });
            });
            const test = Math.random();
            this._implementation.publish("/session/"+ipc.sessionid+"/ping",test);

            let timeout = 0;
            while((test !== result) && (timeout<10)) {
                await new Promise(r => setTimeout(r, 100));
                timeout++;
            }

            // session not available on backend
            if(!test == result) {
                // re Init to fix!
                init();
            }
            return test == result;
        },
        // Sends a request and waits for Answer 
        // Note: Unsafe as answer might not be from request (next message in Topic)
        requestResponds:async function(topic,msgOut,path) {
            if((typeof ipc.sessionid == 'undefined')||(ipc.sessionid == null)) {
                await new Promise(r => setTimeout(r, 1000));
            }
            if(topic.substring(0,1) !== "/") {
                topic = "/session/"+ ipc.sessionid +"/" + topic;
            }
            let result = null;
            const pong = new Promise((resolve,reject) => {
                this._implementation.subscribe(topic,function(msgIn) {
                    if(msgIn !== msgOut) {  // Will not work with "echo" subscriptions
                        result = msgIn;
                        resolve(msgIn);
                    }
                })
            });
            this._implementation.publish(topic,msgOut,path);

            let timeout = 0;
            while((null == result) && (timeout<100)) {
                await new Promise(r => setTimeout(r, 100));
                timeout++;
            }
            return result;
        },
        init:async function(clientId) {
            console.log("ipc.init()");
            $('#consoler').html("ipc.init()");

            this._implementation = ipc_android;
            ipc.subscribe = this._implementation.subscribe;
            ipc.publish = this._implementation.publish;
            ipc.subscribe("console",function(msg) {
                $('#consoler').html(msg);
            });
            ipc.sessionid = null;
            let timeout = 0;
            let path = '';
            if((typeof app !== 'undefined') && (typeof app.getPath !== 'undefined')) {
                try {
                    path = app.getPath('userData');
                }   catch(e) { } // app.getPath is valid even if not.
            }
            while(ipc.sessionid==null) {
                try {
                    let p = await ipc.requestResponds("/corrently/datadir",path);
                    $('#consoler').html("DataDir"+p);
                    
                    let s = await ipc.requestResponds("/corrently/createSession",clientId,path);
                    console.log(s);
                    if((s !== null) && (s.substring(0,clientId.length) == clientId)) {
                        ipc.sessionid = s;
                    } else {
                        await new Promise(r => setTimeout(r, 100));
                        timeout++;
                    }
                } catch(e) {
                    console.log('ipc.init Failed',e);
                }
            }
          
            let res = await this._testConnection();
            if(res) bindElements();
          
            return res;
        }
}

const monitorIPCConnection = async function() {
    const sessionid = ipc.sessionid; 
    while((typeof ipc.sessionid == 'undefined') || (ipc.sessionid == null) || (sessionid == ipc.sessionid))  {
        let connected = false;
        try {
            connected = await ipc._testConnection();
            if(connected) {
                $('#connectionState').removeClass("bg-light");
                $('#connectionState').removeClass("bg-danger");
                $('#connectionState').addClass("bg-success");
            } else  {
                $('#connectionState').removeClass("bg-light");
                $('#connectionState').removeClass("bg-success");
                $('#connectionState').addClass("bg-danger");
            }
            await new Promise(r => setTimeout(r, CONNECTION_TEST_INTERVAL));
        } catch(ex) {
            connected = false;
        }


    }

    setTimeout(function() {
        console.log("Reconnect",ipc.sessionid,sessionid);
        monitorIPCConnection();
    },1000);
}

const addThingRequiredSettings = async function() {
    let adapterInfo = JSON.parse(await ipc.requestResponds("addThing",JSON.stringify({adapter:$('#adapterSelection').val()})));
    $('#adapterTitle').html($( "#adapterSelection option:selected" ).text());
    let html = '';
    html += '<input type="hidden" name="adapter" value="'+$('#adapterSelection').val()+'"/>';
    html += '<div class="input-group" style="margin-bottom:15px;"><span class="input-group-text w-25">Name</span><input name="name" class="form-control" type="text" required placeholder="Name"/></div>';
    for (const [key, value] of Object.entries(adapterInfo.settings)) {
        html += '<div class="input-group" style="margin-bottom:15px;"><span class="input-group-text w-25">'+key+'</span><input name="'+key+'" class="form-control" type="text" required placeholder="'+value+'"/></div>';
    }
    html += '<button type="submit" class="btn btn-dark float-end">add</button>';
   $('#thingsSettings').off();
   $('#thingsSettings').html(html);
   $('#thingsSettings').on('submit',function(e) {
        $('#modalSettings').modal('hide');
        e.preventDefault();
        var settings = $('#thingsSettings').serializeObject();
        let config = {
            adapter:settings.adapter,
            name:_randomString(),
            title:settings.name,
            settings:settings
        };
        delete config.settings.name;
        delete config.settings.adapter;
        ipc.requestResponds("addThing",JSON.stringify(config)).then(function() {
            retrieveThings();
            init();
        })  
        return false;
   });
}

const topicToElementHTML = function(element) {
    const node = $(element);
    if(typeof node.attr('html-topic') !== 'undefined') {
        let topic = node.attr('html-topic');
        if(topic.substring(0,1) !== "/") {
            topic = "/session/"+ ipc.sessionid +"/" + topic;
        }
        ipc.subscribe(topic,function(msg) {
            node.html(msg);
        });
    }
}

const topicToElementTitle = function(element) {
    const node = $(element);
    if(typeof node.attr('title-topic') !== 'undefined') {
        let topic = node.attr('title-topic');
        if(topic.substring(0,1) !== "/") {
            topic = "/session/"+ ipc.sessionid +"/" + topic;
        }
        ipc.subscribe(topic,function(msg) {
            node.attr('title',msg);
        });
    }
}

const retrieveThings = async function() {
    let things = JSON.parse(await ipc.requestResponds("things","."));
    let html = '';
    console.log(things);
    for(let i=0;i<things.length;i++) {
        if(typeof things[i].topics.current !== 'undefined') {
            html += '<div class="card col-sm-3" style="margin:5px;">';
            html += '<div class="card-header" title="'+things[i].name+'">';
            html +=  '<h4 class="float-start">'+things[i].title+'</h4>';
            html += '<button class="btn btn-secondary float-end btn-sm thing-remove" type="button" data-thing="'+things[i].name+'">';
            html += '<svg class="bi bi-trash" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
            html += '<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>';
            html += '</svg></button></div>';
            html += '<div class="card-body">';
            html += '<h1><span class="display-2" id="current_'+things[i].name+'" html-topic="'+things[i].name+'/current"></span><br/><span class="text-muted float-end">W</span></h1>';
            html += '</div>';
            html += '</div>';
        }
        if(typeof things[i].topics.soc !== 'undefined') {
            html += '<div class="card col-sm-3" style="margin:5px;">';
            html += '<div class="card-header" title="'+things[i].name+'">';
            html +=  '<h4 class="float-start">'+things[i].title+'</h4>';
            html += '<button class="btn btn-secondary float-end btn-sm thing-remove" type="button" data-thing="'+things[i].name+'">';
            html += '<svg class="bi bi-trash" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
            html += '<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>';
            html += '</svg></button></div>';
            html += '<div class="card-body">';
            html += '<h1><span class="display-2" id="soc_'+things[i].name+'" html-topic="'+things[i].name+'/soc"></span><br/><span class="text-muted float-end">%</span></h1>';
            html += '</div>';
            html += '</div>';
        }
    }
    $('#thingsSet').html(html);
    $('.thing-remove').off();
    $('.thing-remove').on('click',async function(n) {
            $(n.currentTarget).attr('disabled','disabled');
            await ipc.requestResponds("removeThing",$(n.currentTarget).attr('data-thing'));
            retrieveThings();
            init();
    });
    bindElements();
}

const init = async function(clientId) {
    console.log("UI Init()");

    if((typeof clientId == 'undefined') || (clientId == null)) {
        clientId = window.localStorage.getItem("clientId");
    }

    await ipc.init(clientId);

    $('#btnAddThing').off();
    $('#btnAddThing').click(addThingRequiredSettings);
    retrieveThings();
    monitorIPCConnection();

    const adapters = JSON.parse(await ipc.requestResponds("adapters",'.'));
    let html = '';
    if(adapters !== null) {
        for(let i=0;i<adapters.length;i++) {
        html += '<option value="'+adapters[i].adapter+'">'+adapters[i].description+'</option>';
        }
        $('#adapterSelection').html(html);
    }
}

$(document).ready(async function() {

   let clientId = window.localStorage.getItem("clientId");
   if((typeof clientId == 'undefined') || (clientId == null)) {
    clientId = _randomString();
    window.localStorage.setItem("clientId",clientId);
   } 

   await init(clientId);


});