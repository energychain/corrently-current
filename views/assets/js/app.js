/*
    - MQTTSource baut eigentlich "nur" eine Verbindung zu einem Broker auf mit gegebenen Einstellungen.
    - Daraus ergeben sich je nach Service unterschiedliche mögliche Subscribtions
    - Aus den Subscribtions können Renditions abgeleitet werden
*/


/**
 * Converts a form into a JSON object.
 *
 * @param {HTMLFormElement} form - The form element to be converted.
 * @return {Object} - The JSON object representing the form data.
 */
function convertFormToJSON(form) {
    return $(form)
      .serializeArray()
      .reduce(function (json, { name, value }) {
        if((''+value).length > 0) {
            json[name] = value;
        }
        return json;
      }, {});
}

const shareSettings = function(e) {
    const jsonValue = $('#exportTxt').val();    
    $(e.currentTarget).attr('disabled','disabled');
    $.ajax({
        type: "POST",
        url: "https://api.corrently.io/v2.0/tydids/bucket/intercom",
        data: "&value=" + encodeURIComponent(jsonValue),
        success: function(data) {
            $('#exportTxt').hide();
            $('#gtpShareId').show();
            $('#shareId').val(data.id);

            $.getJSON("https://api.corrently.io/v2.0/util/qr?data="+data.id,function(d) {
                $('#qrImage').attr('src',d);
            });

            $('#shareId').attr('disabled','disabled');
            $(e.currentTarget).removeAttr('disabled');
        }
    })
}

const sortability = function() {
	$(".sortable").sortable({
		containerSelector: "ul.sortable",
		itemSelector: "li.sort",
		handle: ".handle",
		placeholder:
			'<li><div class="card bg-secondary text-white"><div class="card-body">Drop Here</div></div></li>',
		distance: 0,
		onDrop: function($item) {
			$item.attr("style", null).removeClass("dragged");
			$("body").removeClass("dragging");
		}
	});
};

async function render(connectionId,dataPoint,payload) {

    let elements = $('.'+connectionId+'[corrently-topic="'+dataPoint+'"]');
    let displayValue = '';

    for(let i=0;i<elements.length;i++) {
        try {
            let renderer = 'auto';
            let old_value = $(elements[i]).html();
            if($(elements[i]).attr('corrently-renderer')) {
                renderer = $(elements[i]).attr('corrently-renderer');
            }

            let renderfnct = renderer.split(':');
            if(renderfnct[0] == 'jsonpath') {
                    const result = JSONPath.JSONPath({path: renderfnct[1], json: JSON.parse(payload)});
                    if((''+result).length >0) { //prevent flickering if not always present
                        $(elements[i]).html(result);
                        let json = JSON.parse(payload);
                        displayValue = result;
                        
                    }
            } else if(renderfnct[0] == 'javascript') {
                let value=payload;
                displayValue = eval(renderfnct[1]);
                $(elements[i]).html(displayValue);
            } else {
                let org_payload = ''+payload;
                displayValue = payload;
                if($(elements[i]).attr('corrently-maxlength')){
                    if((''+payload).length > $(elements[i]).attr('corrently-maxlength')) {
                        displayValue = (''+payload).substring(0,$(elements[i]).attr('corrently-maxlength')) + '...';
                    }
                }
                $(elements[i]).html(displayValue);
            }
            if(!isNaN(old_value) && !isNaN(displayValue)) {
                const updated = new Date().getTime();
                let isUpdated = false;
                let idle_color = '#303030';
                let colorize = 1;
                if(typeof $(elements[i]).attr('data-colorize') !== 'undefined') {
                    colorize = $(elements[i]).attr('data-colorize');
                } else {
                    console.log("Is Undefined");
                }
                
                old_value *= colorize;
                displayValue *= colorize;

                if(old_value > displayValue) {
                    $(elements[i]).css('color','#147a50');
                    isUpdated = true;
                    idle_color = '#28aa6e'
                } else 
                if(old_value < displayValue) {
                    $(elements[i]).css('color','#ee7f4b');
                    isUpdated = true;
                    idle_color = '#e6b41e';
                }
                if(isUpdated) {
                    $(elements[i]).attr('data-updated',updated);
                    setTimeout(function() {
                        if($(elements[i]).attr('data-updated') ==  updated) {
                            $(elements[i]).css('color',idle_color);
                        }
                    },3000);
                }
            } 
            $(elements[i]).attr('title',new Date().toLocaleTimeString());

        } catch(e) {
            console.error(e);
        }
    }
}

function populateConnectionList(selected_connection) {
    if(selected_connection == null) {
        selected_connection = activeConnections["cloud"];
    }

    $('#topicList').html('');
    $('#nTopic').val('');

    let html = '';
    let hasSelected = false;
    
    for (const [key, value] of Object.entries(activeConnections)) {
        let selected = '';
        if(key == selected_connection) {
            selected = 'selected';
            hasSelected = true;
        }
        html += '<option value="'+key+'" '+selected+'>'+value.payload.connectionName+'</option>'; 
    }
   
    $('.connectionListForTopics').html(html);
    
    $('#discoverdTopics').html('');
    $('.noTopic').attr('disabled','disabled');
    if($('#connectionListForTopics').val() !== null) {
        const connection = activeConnections[$('#connectionListForTopics').val()];  
        $('#nTopic').val(connection.payload.basePath);
    }

    $('#connectionListForTopics').off();
    $('#connectionListForTopics').on('change',function() {
        populateConnectionList($(this).val());
    })
    $('#btnSaveTopics').attr('disabled','disabled');
}

/**
 * Synchronizes UI topics (datapoints) to cloud
 *
 * @param {Event} e - the event object
 * @return {void} 
 */
const syncCloudTopics = function(e) {
    let topics = {}
    for (const [key, value] of Object.entries(window.localStorage)) {
        const key_split = key.split('_');
        let migration=false;
        if(key_split.length == 2) {
            const key_type = key_split[0];
            const key_id = key_split[1];
            if(key_type == 'topic') {
                topics[key] = JSON.parse(value);
            }
        }
    }
    activeConnections["cloud"].publish(activeConnections["cloud"].payload.basePath.slice(0, -1)+"corrently/topics", JSON.stringify(topics));
}

const attachBindings = function() {
    $("#btnAddMqttDatapoint").on('click',function() {
        populateConnectionList();
        $('#mqttTopics').modal('show');
    });
    $( ".column" ).sortable({
        connectWith: ".column",
        handle: ".moveable",
//            cancel: ".portlet-toggle",
        stop: function( event, ui ) {
            let order = $( ".column" ).sortable( "toArray");
            window.localStorage.setItem("order",JSON.stringify(order));
        },
        placeholder: "portlet-placeholder ui-corner-all"
      });
   
      $( ".portlet" )
        .addClass( "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" )
        .find( ".portlet-header" )
          .addClass( "ui-widget-header ui-corner-all" )
          .prepend( "<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>");
   
      $( ".portlet-toggle" ).on( "click", function() {
        var icon = $( this );
        icon.toggleClass( "ui-icon-minusthick ui-icon-plusthick" );
        icon.closest( ".portlet" ).find( ".portlet-content" ).toggle();
      });
    let availConnections = '<option value="_new" selected>+ new connection</option>';;
    for (const [key, value] of Object.entries(activeConnections)) {
        availConnections += '<option value="'+key+'">'+value.payload.connectionName+'</option>';
    }
    $('#availConnections').html(availConnections);
    $('#availConnections').off();
    $('#availConnections').on('change',function(e) {
        const connectionSettings = JSON.parse(window.localStorage.getItem("connect_"+$(e.currentTarget).val()));
        if(connectionSettings == null) {
             $('.mqttConSet').val('');
        } else {
            for (const [key, value] of Object.entries(connectionSettings)) {
                $('#mqtt_'+key).val(value);
            }
        }
    });
    $('.saveTopic').off();
    $('.saveTopic').on('click',async function(e) {
        let topic = activeTopics[$(e.currentTarget).attr('data-topic')];
        topic.payload.alias = $('#alias_'+$(e.currentTarget).attr('data-topic')).val();
        topic.payload.renderer = $('#renderer_'+$(e.currentTarget).attr('data-topic')).val();
        topic.payload.colorize = $('#colorize_'+$(e.currentTarget).attr('data-topic')).val();
        topic.payload.width = $('#width_'+$(e.currentTarget).attr('data-topic')).val();
        await topic.set();
        initControler();
    })
    $('.deleteTopic').off();
    $('.deleteTopic').on('click',function(e) {
        window.localStorage.removeItem('topic_'+$(e.currentTarget).attr('data-topic'));
        delete activeTopics[$(e.currentTarget).attr('data-topic')];
        initControler();
    })
    $('.shareTopic').off();
    $('.shareTopic').on('click',function(e) {
        const connectionId = $(e.currentTarget).attr('data-connection');
        const topicId = $(e.currentTarget).attr('data-topic');
        let ntopics = [];
        let nconnections = [];

        ntopics.push(activeTopics[topicId].payload.bucketId);
        nconnections.push(activeConnections[connectionId].payload.bucketId);

        let shareable = {
            topics:ntopics,
            connections:nconnections
        };
        

        $('#exportTxt').val(JSON.stringify(shareable));
        $('#exportTxt').show();
        $('#gtpShareId').hide();
        shareSettings(e);
        $('#exportSettings').modal('show')
        console.log(shareable);
    })
    sortability();

    $('#exportSettingsToCloud').off();
    $('#exportSettingsToCloud').on('click',syncCloudTopics);
}


let activeConnections = {}
let activeTopics = {}

/**
 * Initializes the controller. Establish connections and hold them in transient memory. Render topic placeholders. 
 *
 * @return {type} description of return value
 */
const initControler = async function() {
    const cloudUser = JSON.parse(window.localStorage.getItem("corrently_cloud_user"));

    if(!window.localStorage.getItem("connect_cloud")) {     
        const connection = new Connection("cloud");
        await connection.set({
            "connectionName":"Corrrently Cloud",
            "host":"mqtt.corrently.cloud",
            "port":1883,
            "protocol":"mqtt",
            "username":cloudUser.username,
            "password":cloudUser.password,
            "protocolId":"MQIsdp",
            "protocolVersion":3,
            "connectionId":"cloud",
            "uiid":"cloud",
            "basePath":"corrently/users/"+cloudUser.username+"/#"
        });
    }

    $.getJSON("https://integration.corrently.io/node-red/resumeClient?username="+cloudUser.username, function(data) {
        console.debug("resume Cloud MQTT",data);
    });

    // Establish all Connections ... TODO: Implement remote Storage and Caching
    for (const [key, value] of Object.entries(window.localStorage)) {
        const key_split = key.split('_');
        let migration=false;
        if(key_split.length == 2) {
            const key_type = key_split[0];
            const key_id = key_split[1];
            if(key_type == 'connect') {
                try {
                    const connection = new Connection(key_id);
                    await connection.get();
                    await connection.connect();
                    activeConnections[key_id] = connection;
                    if(key_id == "cloud") {      
                        connection.subscribe("corrently/users/"+cloudUser.username+"/corrently/edge/pm2",function(msg) {                    
                            let edgeStats = JSON.parse(msg);
                            let html = '<table class="table table-condensed">';
                            html += '<tr><th>Name</th><th>PID</th><th>CPU</th><th>Memory</th></tr>';
                            for(let i=0;i<edgeStats.ps.length;i++) {
                                html += '<tr><td>'+edgeStats.ps[i].name+'</td><td>'+edgeStats.ps[i].pid+'</td><td>'+edgeStats.ps[i].cpu+'</td><td>'+edgeStats.ps[i].memory+'</td></tr>';
                            }
                            html += '</table>';
                            html += '<div class="text-muted">Updated: '+edgeStats.updated+'</div>';
                            $('#edgestats').html(html);
                         });
                    } else 
                    if(key_id == "edge") {                 
                        connection.subscribe("corrently/edge/pm2",function(msg) {
                            
                            let edgeStats = JSON.parse(msg);
                            let html = '<table class="table table-condensed">';
                            html += '<tr><th>Name</th><th>PID</th><th>CPU</th><th>Memory</th></tr>';
                            for(let i=0;i<edgeStats.ps.length;i++) {
                                html += '<tr><td>'+edgeStats.ps[i].name+'</td><td>'+edgeStats.ps[i].pid+'</td><td>'+edgeStats.ps[i].cpu+'</td><td>'+edgeStats.ps[i].memory+'</td></tr>';
                            }
                            html += '</table>';
                            html += '<div class="text-muted">Updated: '+edgeStats.updated+'</div>';
                            $('#edgestats').html(html);
                         });
                    }
                } catch(e) {
                    console.error("Connection Error",e);
                    if(key_id == "cloud") {
                        console.log("ReAuthenticating Cloud");
                        if(typeof cloudUser.password !== 'undefined') {
                            $.ajax({
                                type: "POST",
                                url: "https://integration.corrently.io/node-red/reAuthenticate",
                                data: "&username=" + encodeURIComponent(cloudUser.username)+"&password=" + encodeURIComponent(cloudUser.password),
                                success: function(data) {
                                    console.log("Success",data);
                                    setTimeout(initControler,1000);
                                }
                            });
                        }
                    } 
                     else {
                        console.error(e);
                    }
                }    
            }
        }
    }

    // Init all Topics
    let renditions = {};
    for (const [key, value] of Object.entries(window.localStorage)) {
        const key_split = key.split('_');
        if(key_split.length == 2) {
            const key_type = key_split[0];
            const key_id = key_split[1];
            if(key_type == 'topic') {
                try {
                    const topic = new Topic(key_id);
                    await topic.get();
                    renditions['sort_'+key_id] = await topic.renderHTML();
                    if(typeof topic.payload.connectionId !== 'undefined') {
                        if(typeof activeConnections[topic.payload.connectionId] !== 'undefined') {
                            activeConnections[topic.payload.connectionId].subscribe(topic.payload.topic,function(msg) {
                                    render(topic.payload.connectionId,key_id,msg);
                            });
                        }
                        if(topic.payload.connectionId == "edge") {
                            activeConnections["cloud"].subscribe("corrently/users/"+cloudUser.username+"/"+topic.payload.topic,function(msg) {
                                render(topic.payload.connectionId,key_id,msg);
                            });
                        }
                    }
                    activeTopics[key_id] = topic;
                } catch(e) {
                    console.error("Topic Error",e);
                }    
            }
        }
    }

    const order = JSON.parse(window.localStorage.getItem("order"));
    let html = '<div class="row column">';
    if((typeof order !== 'undefined')&&(order !== null)) {
        for (let j=0;j<order.length;j++) {
            if(typeof renditions[order[j]] !== 'undefined') {
                html += renditions[order[j]];
            }
            delete renditions[order[j]];
        }
    }

    for (const [key, value] of Object.entries(renditions)) {
        if(typeof value !== 'undefined') {
            html += value;
        }
    }
    // Always add an empty one at the end  for Adding
    html += '<div class="col-md-4">'
    html += '<div class="nocard" style="margin-bottom:15px"><div class="heijoh">';
        html += '<div class="card-body text-center display-2">';
        html += '<button id="btnAddMqttDatapoint" class="btn btn-light w-100 btn-lg" type="button">';
        html += '<svg class="bi bi-plus-circle-dotted fs-1" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
        html += '<path d="M8 0c-.176 0-.35.006-.523.017l.064.998a7.117 7.117 0 0 1 .918 0l.064-.998A8.113 8.113 0 0 0 8 0zM6.44.152c-.346.069-.684.16-1.012.27l.321.948c.287-.098.582-.177.884-.237L6.44.153zm4.132.271a7.946 7.946 0 0 0-1.011-.27l-.194.98c.302.06.597.14.884.237l.321-.947zm1.873.925a8 8 0 0 0-.906-.524l-.443.896c.275.136.54.29.793.459l.556-.831zM4.46.824c-.314.155-.616.33-.905.524l.556.83a7.07 7.07 0 0 1 .793-.458L4.46.824zM2.725 1.985c-.262.23-.51.478-.74.74l.752.66c.202-.23.418-.446.648-.648l-.66-.752zm11.29.74a8.058 8.058 0 0 0-.74-.74l-.66.752c.23.202.447.418.648.648l.752-.66zm1.161 1.735a7.98 7.98 0 0 0-.524-.905l-.83.556c.169.253.322.518.458.793l.896-.443zM1.348 3.555c-.194.289-.37.591-.524.906l.896.443c.136-.275.29-.54.459-.793l-.831-.556zM.423 5.428a7.945 7.945 0 0 0-.27 1.011l.98.194c.06-.302.14-.597.237-.884l-.947-.321zM15.848 6.44a7.943 7.943 0 0 0-.27-1.012l-.948.321c.098.287.177.582.237.884l.98-.194zM.017 7.477a8.113 8.113 0 0 0 0 1.046l.998-.064a7.117 7.117 0 0 1 0-.918l-.998-.064zM16 8a8.1 8.1 0 0 0-.017-.523l-.998.064a7.11 7.11 0 0 1 0 .918l.998.064A8.1 8.1 0 0 0 16 8zM.152 9.56c.069.346.16.684.27 1.012l.948-.321a6.944 6.944 0 0 1-.237-.884l-.98.194zm15.425 1.012c.112-.328.202-.666.27-1.011l-.98-.194c-.06.302-.14.597-.237.884l.947.321zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a6.999 6.999 0 0 1-.458-.793l-.896.443zm13.828.905c.194-.289.37-.591.524-.906l-.896-.443c-.136.275-.29.54-.459.793l.831.556zm-12.667.83c.23.262.478.51.74.74l.66-.752a7.047 7.047 0 0 1-.648-.648l-.752.66zm11.29.74c.262-.23.51-.478.74-.74l-.752-.66c-.201.23-.418.447-.648.648l.66.752zm-1.735 1.161c.314-.155.616-.33.905-.524l-.556-.83a7.07 7.07 0 0 1-.793.458l.443.896zm-7.985-.524c.289.194.591.37.906.524l.443-.896a6.998 6.998 0 0 1-.793-.459l-.556.831zm1.873.925c.328.112.666.202 1.011.27l.194-.98a6.953 6.953 0 0 1-.884-.237l-.321.947zm4.132.271a7.944 7.944 0 0 0 1.012-.27l-.321-.948a6.954 6.954 0 0 1-.884.237l.194.98zm-2.083.135a8.1 8.1 0 0 0 1.046 0l-.064-.998a7.11 7.11 0 0 1-.918 0l-.064.998zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"></path>';
        html += '</svg>';    
        html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>'
    $('#overviewTable').html(html);

    // Attach UI DOM Bindings
    attachBindings();
    front.send("/corrently/mqtt/empty","DoIt");
}

let profile = {};

$(document).ready(async function() {

    /**
     * Applies the import by parsing the JSON and storing the data in the local storage.
     * If the import includes a connection, it stores the connection details and topics in the local storage.
     * If the import includes an edge flow, it adds the flow to the edge and updates the topics in the local storage.
     * If the import includes neither a connection nor an edge flow, it stores all the key-value pairs from the import in the local storage.
     * If the 'import' URL parameter is present, it redirects to the index page, otherwise it reloads the current page.
     */
    const applyImport = async function() {
        $('#btnApplyImport').attr('disabled','disabled');
        $('#btnApplyImport').html('working...');
        let importJSON = JSON.parse($('#txtImport').val());
        for (const [key, value] of Object.entries(importJSON)) {
            const key_split = key.split('_');
            if(key_split.length == 2) {
                const key_type = key_split[0];
                const key_id = key_split[1];
                if(key_type == 'connect') {
                    const connection = new Connection(key_id);
                    await connection.set(value);
                    console.log("Import Connection",connection);
                }
                if(key_type == 'topic') {
                    const topic = new Topic(key_id);
                    await topic.set(value);
                    console.log("Import Topic",topic);
                }
                if(key_type == 'edge') {
                    console.log("Add Flow to Edge",value);
                    front.send("/corrently/edge/add-flow",JSON.stringify(value));
                }
            } else {
                if((key == 'profile')||(key == 'app')){
                    for (const [envkey, envvalue] of Object.entries(value)) {
                        window.localStorage.setItem(envkey,envvalue);
                    }
                }
                if(key == 'topics') {
                    for(let i=0;i<value.length;i++) {
                        const topic = new Topic(_randomString());
                        await topic.set(value[i]);
                    }
                }
                if(key == 'connections') {
                    console.log("Import Connections");
                    for(let i=0;i<value.length;i++) {
                        const connection = new Connection();
                        await connection.set(value[i]);
                    }
                }
                if(key == 'edge_flow') {
                    console.log("Add Flow to Edge");
                    front.send("/corrently/edge/add-flow",JSON.stringify(value));
                }
            }
        }

        if(getUrlParameter('import')) {
           // location.href='./index.html';
        } else {
            location.reload();
        }
    }

    
    const getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;
    
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
    
            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
            }
        }
        return false;
    };

    if((typeof window.localStorage.getItem("corrently_cloud_user") == 'undefined')||(window.localStorage.getItem("corrently_cloud_user") == null)) {
        $.getJSON("https://integration.corrently.io/node-red/createUser",function(d) {
            window.localStorage.setItem("corrently_cloud_user",JSON.stringify(d));
            location.reload();
        });
    }
    let p_data = JSON.parse(window.localStorage.getItem("corrently_cloud_user"));
    profile = new Profile();
   
    profile.payload.corrently_cloud_user = p_data;
    profile.payload.order = JSON.parse(window.localStorage.getItem("order"));
    
    if((typeof window.localStorage.getItem("profile") == 'undefined')||(window.localStorage.getItem("profile") == null)) {
        await profile.set();
    } else {
        let p = JSON.parse(window.localStorage.getItem("profile"));
        if(p.corrently_cloud_user !== null) {
            window.localStorage.setItem("corrently_cloud_user",JSON.stringify({
                username:p.corrently_cloud_user.username,
                password:p.corrently_cloud_user.password
            })); 
        }
    }
   

    let middleware = 'app';
    $('#edgeContainer').hide();

    if(getUrlParameter('middleware')) {
        middleware = getUrlParameter('middleware');
    }

    let html = '';
    if(window.localStorage.getItem("connect_edge")) {
        const settings = JSON.parse(window.localStorage.getItem("connect_edge"));
        $('#nodeRedLink').attr('href','http://'+settings.host+':1880/red');
        $('#edgeContainer').show();
    }
    if(middleware == 'app') {
        html = '<span id="connectionState" class="badge bg-secondary"><svg class="bi bi-phone" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
        html += '<path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H5z"></path>';
        html += '<path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>';
        html += '</svg></span>'
    } else 
    if(middleware == 'edge') {
        html = '<span id="connectionState" class="badge bg-secondary"><svg class="bi bi-hdd-network" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">'
        html += '<path d="M4.5 5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM3 4.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"></path>';
        html += '<path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H8.5v3a1.5 1.5 0 0 1 1.5 1.5h5.5a.5.5 0 0 1 0 1H10A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5H.5a.5.5 0 0 1 0-1H6A1.5 1.5 0 0 1 7.5 10V7H2a2 2 0 0 1-2-2V4zm1 0v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1zm6 7.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5z"></path>';
        html += '</svg></span>';
    } else 
    if(middleware == 'cloud') {
        html = '<span id="connectionState" class="badge bg-secondary"><svg class="bi bi-cloud-lightning" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
        html += '<path d="M13.405 4.027a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973zM8.5 1a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1zM7.053 11.276A.5.5 0 0 1 7.5 11h1a.5.5 0 0 1 .474.658l-.28.842H9.5a.5.5 0 0 1 .39.812l-2 2.5a.5.5 0 0 1-.875-.433L7.36 14H6.5a.5.5 0 0 1-.447-.724l1-2z"></path>';
        html += '</svg></span>';
    }
    $('#connectionState').html(html);


   $('#btnDownloadSettings').on('click',function(e) {
        const jsonValue = $('#exportTxt').val();
        let addition = 'settings';
        
        const data = "data:text/json;charset=utf-8," + encodeURIComponent(jsonValue);
        const link = document.createElement("a");
        link.setAttribute("href", data);
        link.setAttribute("download", addition+".corrently-current.json");
        link.click();
   });
     $('#btnShareSettings').on('click',shareSettings);

    $('#btnUploadExport').on('click',function(e) {
        var fileInput = document.getElementById("settingsUploadFile");
        var file = fileInput.files[0];
        var reader = new FileReader();
      
        reader.onload = function(event) {
            const fileContent = event.target.result;
            $('#txtImport').val(fileContent);
        };
        try {
            reader.readAsText(file);
        } catch(e) {
            $('#settingsUploadFile')
        }
    });

    $('#btnAddTopic').on('click',function(e) {
        $('#btnAddTopic').attr('disabled','disabled');
        
        const connectionId = $('#connectionListForTopics').val();
        const topic = $('#nTopic').val();
        const connection = activeConnections[connectionId];
        
        connection.connect().then(function(t) {
            connection.subscribe(topic,function(msg) {     });
            connection.subscribe(topic+'#',function(msg) {   });
            connection.subscribe('topicsDiscovery',async function(msg) {
                let nice_topic = msg;
                let basePath = connection.payload.basePath.replace(/#/g, '');
                nice_topic = nice_topic.replace(basePath,'./');
                $('#discoverdTopics').append('<option value="'+msg+'">'+nice_topic+'</option>');
            });
           // $('#nTopic').val('');
            $('.noTopic').removeAttr('disabled');
            $('#btnAddTopic').removeAttr('disabled'); 
        });
        $('#btnAddDatapoint').off();
        $('#btnAddDatapoint').on('click',function(e) {
            const topic = $('#discoverdTopics').val();
            if($('#topicList').attr('data-hint')=='emptyList') {
                $('#topicList').removeAttr('data-hint');
                $('#topicList').html('');
            } 
            $('#topicList').append('<li class="dpTopic" data-topic="'+topic+'">'+topic+'</li>');
            $('#btnSaveTopics').removeAttr('disabled');
        });
        $('#btnSaveTopics').off();
        $('#btnSaveTopics').on('click',async function(e) {
            const connectionId = $('#connectionListForTopics').val();
            let elements = $('.dpTopic');
            for(let i=0;i<elements.length;i++) {
                let alias = $(elements[i]).attr('data-topic');
                if(alias.includes('/')) {
                    let nalias = alias.substring(alias.lastIndexOf("/")+1);
                    if(nalias.length > 0 ) alias = nalias;
                }
                const topic = new Topic(_randomString());
                await topic.set(
                {
                    topic:$(elements[i]).attr('data-topic'),
                    renderer:'auto',
                    alias:alias,
                    connectionId:connectionId,
                    width:4
                });
            }
            $('#mqttTopics').modal('hide');
            initControler();
        });
    });

    $('#btnScanQr').on('click',function(e) {
        $('#qrScanner').modal('show');
        $('#importSettings').modal('hide');
        function onScanSuccess(decodedText, decodedResult) {
            // handle the scanned code as you like, for example:
            console.log(`Code matched = ${decodedText}`, decodedResult);
            $('#bucketId').val(decodedText);
            $('#qrScanner').modal('hide');
            $.getJSON("https://api.corrently.io/v2.0/tydids/bucket/intercom?id="+$('#bucketId').val(),function(d) {
                $('#txtImport').val(d.val);
            });
            $('#importSettings').modal('show');
          }
          
          function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
            // for example:
            console.warn(`Code scan error = ${error}`);
          }
          
          let html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: {width: 250, height: 250} },
            /* verbose= */ false);
          html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    })
    $('#frmShareCode').on('submit',function(e) {
        e.preventDefault();
        $.getJSON("https://api.corrently.io/v2.0/tydids/bucket/intercom?id="+$('#bucketId').val(),function(d) {
            $('#txtImport').val(d.val);
            applyImport();
        });
    });
    $('#removeConnection').off();
    $('#removeConnection').on('click',function(e) {
        const selectedConnection =  $('#availConnections').val();
        window.localStorage.removeItem("connect_"+selectedConnection);
        location.reload();
    });
    $("#mqttConnectionSettings").on("submit", async function (e) {
        e.preventDefault();
        $('#connectionAlert').hide();
        $('#btnTestSettings').attr('disabled','disabled');
        $('#btnTestSettings').removeAttr('data-connection');

        const form = $(e.target);
        let settings = convertFormToJSON(form);
        settings.port = settings.port * 1;

        if(typeof settings.protocolVersion !== 'undefined') settings.protocolVersion = settings.protocolVersion  * 1;

        const selectedConnection =  settings.availConnections;
        delete settings.availConnections;

        if(selectedConnection !== '_new') {
            const connection = activeConnections[selectedConnection];
            console.log("Out For Set Call",selectedConnection);
            await connection.set(settings);
            $('#mqttConnection').modal('hide');
            window.localStorage.removeItem("connect_"+selectedConnection);
            delete activeConnections[selectedConnection];
            activeConnections[connection.connetionId]=connection 
            populateConnectionList(connection.connetionId);
            if(typeof settings.basePath !== 'undefined') {
                $('#nTopic').val(settings.basePath);
            }
            $('#mqttTopics').modal('show');
        } else {       
            const connection = new Connection();
            await connection.set(settings);
            connection.connect().then(function(t) {
                $('#connectionAlert').hide();
                $('#btnTestSettings').attr('data-connection',connection.connetionId);
                $('#btnTestSettings').removeAttr('disabled');
                $('#mqttConnection').modal('hide');
                activeConnections[connection.connetionId] = connection;
                populateConnectionList(connection.connetionId);
                $('#mqttTopics').modal('show');
            }).catch(function(ex) {
                console.error(ex);
                $('#connectionAlert').show();
                $('#connectionAlert').html(ex);
                $('#btnTestSettings').removeAttr('disabled');
            });
        }
        

    });
    
    $("#btnBridgeSettings").on('click',function() {
        populateConnectionList();
        let cloud = activeConnections["cloud"].payload;
        console.log("Cloud",cloud);
        $('#bridgeConnection').append('<option value="'+cloud.connectionId+'" selected>'+cloud.connectionName+'</option>');  
        $('#basepath').val(cloud.basePath);

        $('#bridgeSettings').modal('show');
    });


    $('#btnApplyImport').on('click',applyImport);

    $('#edgeToBridge').on('submit',function(e) {
        e.preventDefault();
        let bridgeConf = activeConnections["cloud"];
        bridgeConf.enabled = $('#statusBridge').attr('data-checked');
        bridgeConf.edge = JSON.parse(window.localStorage.getItem("connect_edge"));
        front.send("/corrently/mqtt/bridge",JSON.stringify(bridgeConf));
        $('#bridgeSettings').modal('hide');
    });

  
    $('#btnShareCurrent').on('click',async function(e) {
        const keys = Object.keys(window.localStorage);
        let env = {};
        for(let i=0;i<keys.length;i++) {
            env[keys[i]] = window.localStorage.getItem(keys[i]);
        }

        let shareable = {
            app: env
        };
        

        $('#exportTxt').val(JSON.stringify(shareable));
        $('#exportTxt').show();
        $('#gtpShareId').hide();
        shareSettings(e);
        $('#exportSettings').modal('show')
        console.log(shareable);
    })
    $('#revealPWD').on('click',function(e) {
        if($('#mqtt_password').attr('type') == 'password') {
            $('#mqtt_password').attr('type','text');
        } else {
            $('#mqtt_password').attr('type','password');
        }
    });


    if(getUrlParameter('import')) {
        $('#importSettings').modal('show');
        $('#bucketId').val(getUrlParameter('import'));
        $.getJSON("https://api.corrently.io/v2.0/tydids/bucket/intercom?id="+$('#bucketId').val(),function(d) {
            $('#txtImport').val(d.val);
            applyImport();
        });

    }
    $('#jumpWizard').on('change',function(e) {
        if( (''+$(e.currentTarget).val()).length > 0 ) {
            location.href=$(e.currentTarget).val()+"?returnUrl="+encodeURIComponent(window.location.href);
        } 
    })
    $('#wizardButton').on('click', function(e) {
        location.href=$('#wizardURL').val()+"?returnUrl="+encodeURIComponent(window.location.href);
    });

    initControler();
    front.socket.on('connect',function() { 
        console.log("reconnected to middleware");
        setTimeout(initControler,500);
    });
});
if (typeof navigator.serviceWorker !== 'undefined') {
    navigator.serviceWorker.register('assets/js/sw.js')
}