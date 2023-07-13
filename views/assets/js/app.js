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
    let elements = $('.'+connectionId+'[corrently-datapoint="'+dataPoint+'"]');
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
                $(elements[i]).attr('title',org_payload);
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

        } catch(e) {
            console.error(e);
        }
    }
}

function populateConnectionList(selected_connection) {
    $('#topicList').html('');
    let html = '';
    let hasSelected = false;
    for (const [key, value] of Object.entries(window.localStorage)) {
        const key_split = key.split('_');
        if(key_split.length == 2) {
            const key_type = key_split[0];
            const key_id = key_split[1];
            if(key_type == 'connection') {
                const settings = JSON.parse(value);
                let selected = '';
                if((selected_connection == key_id)|| ((!hasSelected) && (typeof selected_connection == 'undefined'))) {
                    selected = "selected";
                    hasSelected = true;
                    if(typeof settings.basePath !== 'undefined') {
                        $('#nTopic').val(settings.basePath);
                    } else {
                        $('#nTopic').val('#');
                    }
                }
                html += '<option value="'+key_id+'" '+selected+'>'+settings.connectionName+'</option>'; 
            }
        }
    }

    $('.connectionListForTopics').html(html);
    
    $('#discoverdTopics').html('');
    $('.noTopic').attr('disabled','disabled');

    const connection = new MQTTSource($('#connectionListForTopics').val());
        
    connection.connect().then(function(t) {
        connection.subscribe('topicsDiscovery',function(msg) {
            $('#discoverdTopics').append('<option>'+msg+'</option>');
        });
    });
    $('#connectionListForTopics').off();
    $('#connectionListForTopics').on('change',function() {
        populateConnectionList($(this).val());
    })
    $('#btnSaveTopics').attr('disabled','disabled');
}
async function connectMQTT() {
    let html = '<div class="row">';

    const cloudUser = JSON.parse(window.localStorage.getItem("corrently_cloud_user"));
    
    if(!window.localStorage.getItem("connection_cloud")) {     
        window.localStorage.setItem("connection_cloud",JSON.stringify({
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
        }));
    }

    $.getJSON("https://integration.corrently.io/node-red/resumeClient?username="+cloudUser.username, function(data) {
        console.debug("resume Cloud MQTT",data);
    });
    try {
        $('#availConnections').html("");
        let availConnections = '<option value="_new">new MQTT Connection</option>';
        for (const [key, value] of Object.entries(window.localStorage)) {
            const key_split = key.split('_');
            let migration=false;
            if(key_split.length == 2) {
                const key_type = key_split[0];
                const key_id = key_split[1];
                if(key_type == 'connection') {
                    const connectionSettings = JSON.parse(value);
                    const connection = new MQTTSource(connectionSettings);
                    try {
                        await connection.connect();
                        availConnections += '<option value="'+key_id+'">'+connectionSettings.connectionName+'</option>';

                        let datapoints = window.localStorage.getItem("topics_"+key_id);
                        if((typeof datapoints !== 'undefined') && (datapoints !== null)) {
                            datapoints = JSON.parse(datapoints);
                            for(let i=0;i<datapoints.length;i++) {
                                connection.subscribe(datapoints[i].topic,function(msg) {
                                        render(connection.getConnectionId(),datapoints[i].topic,msg);
                                });
                            }
                        }
                    } catch(e) {
                        console.log(e);
                    }
                }
                if(key_type == 'topics') {
                    let topicSettings = JSON.parse(value);
                    for(let i=0;i<topicSettings.length;i++) {
                        let connectionSettings = JSON.parse(window.localStorage.getItem('connection_'+key_id));
                        html += '<div class="col-md-4" title="'+topicSettings[i].topic+'">'
                        html += '<div class="card" style="margin-bottom:15px"><div class="heijoh">';
                            html += '<div class="card-body text-center">';
                                
                                        html += '<div class="'+key_id+' text-right text-truncate display-4 idle_'+topicSettings[i].id+'" data-colorize="'+topicSettings[i].colorize+'" corrently-maxlength=20 corrently-renderer="'+topicSettings[i].renderer+'" corrently-datapoint="'+topicSettings[i].topic+'">-</div>';
                                        html += '<div>' + topicSettings[i].alias + '</div>';

                                    html += '<a style="margin-top:-25px;margin-right:-5px" class="btn btn-secondary btn-sm float-end" data-bs-toggle="collapse" aria-expanded="false" aria-controls="#area_'+topicSettings[i].id+'" href="#area_'+topicSettings[i].id+'" role="button">'
                                    // html += '<i style="cursor:pointer" data-toggle="collapse" data-target="#area_'+topicSettings[i].id+'" aria-expanded="true" aria-controls="area_'+topicSettings[i].id+'">';
                                    html += '<svg class="bi bi-chevron-double-down" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                                    html += '<path fill-rule="evenodd" d="M1.646 6.646a.5.5 0 0 1 .708 0L8 12.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"></path>';
                                    html += '<path fill-rule="evenodd" d="M1.646 2.646a.5.5 0 0 1 .708 0L8 8.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"></path>';
                                    html += '</svg>';
                                    html += '</a>';
                                
                                    html += '</div>';
                            
                            html += '</div>';
                        
                        html += '<div class="collapse" id="area_'+topicSettings[i].id+'">';
                                html += '<div class="card-body" style="padding-bottom:15px;">';
                                html += '<div style="margin-top:15px;">';
                                    html += '<strong>Connection</strong><br/>';
                                    html += connectionSettings.connectionName;
                                html += '</div>';
                                html += '<div style="margin-top:15px;">';
                                    html += '<strong>MQTT Topic</strong><br/>';
                                    html += topicSettings[i].topic;
                                html += '</div>';
                                html += '<div style="margin-top:15px;">';
                                    html += '<strong>DataPoint Alias</strong><br/>';
                                    html += '<div class="input-group">';
                                    html +=  '<input class="form-control w-100" type="text" id="alias_'+topicSettings[i].id+'" value="'+topicSettings[i].alias+'"/>';
                                    html += '</div>';
                                html += '</div>';
                                html += '<div style="margin-top:15px;">';
                                    html += '<strong>Value Renderer</strong><br/>';
                                        html += '<div class="input-group">';
                                        html +=  '<input class="form-control w-100" type="text" id="renderer_'+topicSettings[i].id+'" value="'+topicSettings[i].renderer+'"/>';
                                        html += '</div>';
                                html += '</div>';
                                html += '<div style="margin-top:15px;">';
                                    html += '<strong>Colorize Changes</strong><br/>';
                                    html += '<div class="input-group">';
                                    html +=     '<select id="colorize_'+topicSettings[i].id+'" class="form-control">';
                                    html +=         '<option value="1">Organge Up / Green Down</option>';
                                    html +=         '<option value="-1">Green Up / Orange Down</option>';
                                    html +=     '</select>';   
                                    html += '</div>';
                                html += '</div>';
                                html += '<div style="margin-top:15px;">';
                                html += '<button type="button" style="margin-right:10px;" class="btn btn-danger float-start deleteTopic" id="delete_'+topicSettings[i].id+'" data-topic="'+topicSettings[i].id+'" data-connection="'+key_id+'">';
                                html += '<svg class="bi bi-trash" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                                html += '<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path>';
                                html += '<path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>';
                                html += '</svg>';
                                html += '</button>';
                                html += '<button type="button" style="margin-right:10px;" class="btn btn-secondary shareTopic" id="share_'+topicSettings[i].id+'" data-topic="'+topicSettings[i].id+'" data-connection="'+key_id+'">';
                                html += '<svg class="bi bi-share" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                                html += '<path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"></path>';
                                html += '</svg>';
                                html += '</button>';
                                html += '<button type="button" class="btn btn-success float-end saveTopic" id="save_'+topicSettings[i].id+'" data-topic="'+topicSettings[i].id+'" data-connection="'+key_id+'">';
                                html += '<svg class="bi bi-save" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                                html += '<path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"></path>';
                                html += '</svg>';
                                html += '</button>';
                                html += '</div>';
                        html += '</div>';

                        html += '</div></div>';
                        html += '</div>';
                    
                        // Migration (Missing Topic ID)
                        if(typeof topicSettings[i].id == 'undefined') {
                            topicSettings[i].id = _randomString();
                            migration=true;
                            value = JSON.stringify(topicSettings);
                        }
                    }
                }
            }
            if(migration) {
                window.localStorage.setItem(key,JSON.stringify(value));
            }
        }
        html += '</div>'
        $('#overviewTable').html(html);
        $('#availConnections').html(availConnections);
        $('#availConnections').off();
        $('#availConnections').on('change',function(e) {
            const connectionSettings = JSON.parse(window.localStorage.getItem("connection_"+$(e.currentTarget).val()));
            for (const [key, value] of Object.entries(connectionSettings)) {
                $('#mqtt_'+key).val(value);
            }
        });
        $('.saveTopic').off();
        $('.saveTopic').on('click',function(e) {
            const connectionId = $(e.currentTarget).attr('data-connection');
            let topics = JSON.parse(window.localStorage.getItem("topics_"+connectionId));
            for(let i=0;i<topics.length;i++) {
                if(topics[i].id == $(e.currentTarget).attr('data-topic')) {
                    topics[i].alias = $('#alias_'+$(e.currentTarget).attr('data-topic')).val();
                    topics[i].renderer = $('#renderer_'+$(e.currentTarget).attr('data-topic')).val();
                    topics[i].colorize = $('#colorize_'+$(e.currentTarget).attr('data-topic')).val();
                }
            }
            window.localStorage.setItem("topics_"+connectionId,JSON.stringify(topics));
            $('#overviewTable')
            connectMQTT();
        })
        $('.deleteTopic').off();
        $('.deleteTopic').on('click',function(e) {
            const connectionId = $(e.currentTarget).attr('data-connection');
            let topics = JSON.parse(window.localStorage.getItem("topics_"+connectionId));
            let ntopics = [];
            for(let i=0;i<topics.length;i++) {
                if(topics[i].id !== $(e.currentTarget).attr('data-topic')) {
                ntopics.push(topics[i]);
                }
            }
            window.localStorage.setItem("topics_"+connectionId,JSON.stringify(ntopics));
            $('#overviewTable')
            connectMQTT();
        })
        $('.shareTopic').off();
        $('.shareTopic').on('click',function(e) {
            const connectionId = $(e.currentTarget).attr('data-connection');
            let topics = JSON.parse(window.localStorage.getItem("topics_"+connectionId));
            let connection = JSON.parse(window.localStorage.getItem("connection_"+connectionId));
            let ntopics = [];
            let tempConnectionId = connectionId;
            if((connectionId == "edge") || (connectionId == "cloud")) {
                tempConnectionId = _randomString();
                connection.connectionName = "Imported "+connectionId + " "+tempConnectionId;
            }
           
            // do not share "_cloud" or "_edge" IDs.
            for(let i=0;i<topics.length;i++) {
                if((topics[i].id == $(e.currentTarget).attr('data-topic'))&&(topics[i] !== null)) {
                    if((connectionId == "edge") || (connectionId == "cloud")) {
                        topics[i].id = _randomString();
                    }   
                    ntopics.push(topics[i]);
                }
            }
            connection.uiid = tempConnectionId;
            connection.connectionId = tempConnectionId;
            
            let shareable = {
                topics:ntopics,
                connection:connection
            };
            

            $('#exportTxt').val(JSON.stringify(shareable));
            $('#exportTxt').show();
            $('#gtpShareId').hide();
            $('#exportSettings').modal('show')
            console.log(shareable);
        })

        sortability();
    } catch(e) {
        if(e.toString() == "Error: Connection refused: Not authorized") {
            console.log("ReAuthenticating");
            $.ajax({
                type: "POST",
                url: "https://integration.corrently.io/node-red/reAuthenticate",
                data: "&username=" + encodeURIComponent(cloudUser.username)+"&password=" + encodeURIComponent(cloudUser.password),
                success: function(data) {
                    console.log("Success",data);
                    setTimeout(connectMQTT,1000);
                }
            });
        }
    }
}

$(document).ready(async function() {
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

    if(!window.localStorage.getItem("corrently_cloud_user")) {
        $.getJSON("https://integration.corrently.io/node-red/createUser",function(d) {
            window.localStorage.setItem("corrently_cloud_user",JSON.stringify(d));
            location.reload();
        });
    }

    let middleware = 'app';
    $('#edgeContainer').hide();

    if(getUrlParameter('middleware')) {
        middleware = getUrlParameter('middleware');
    }

    if(middleware !== 'cloud') {
        setInterval(function() {
            if(!front.socket.connected) {
            location.href='?middleware=cloud';
            }
        },2000);    
    }

    let html = '';
    if(window.localStorage.getItem("connection_edge")) {
        const settings = JSON.parse(window.localStorage.getItem("connection_edge"));
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
   $('#btnShareSettings').on('click',function(e) {
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

   });

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
        const connection = new MQTTSource(connectionId);
        
        connection.connect().then(function(t) {
            connection.subscribe(topic,function(msg) {     });
            connection.subscribe(topic+'#',function(msg) {   });
            connection.subscribe('topicsDiscovery',function(msg) {
                let nice_topic = msg; 
                const connectionSettings = JSON.parse(window.localStorage.getItem("connection_"+connectionId));
                let basePath = connectionSettings.basePath;
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
        $('#btnSaveTopics').on('click',function(e) {
            const connectionId = $('#connectionListForTopics').val();
            let topics =   window.localStorage.getItem("topics_"+connectionId);
            if((typeof topics == 'undefined') || (topics == null)) {
                topics = [];
            } else {
                topics = JSON.parse(topics);
            }
            let elements = $('.dpTopic');
            for(let i=0;i<elements.length;i++) {
                let alias = $(elements[i]).attr('data-topic');
                if(alias.includes('/')) {
                    let nalias = alias.substring(alias.lastIndexOf("/")+1);
                    if(nalias.length > 0 ) alias = nalias;
                }
                topics.push({
                    topic:$(elements[i]).attr('data-topic'),
                    renderer:'auto',
                    alias:alias,
                    id:_randomString()
                });
            }
            window.localStorage.setItem("topics_"+connectionId,JSON.stringify(topics));
            $('#mqttTopics').modal('hide');
            connectMQTT();
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
                $('#txtImport').val(JSON.stringify(d.val));
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
        });
    });
    $('#removeConnection').off();
    $('#removeConnection').on('click',function(e) {
        const selectedConnection =  $('#availConnections').val();
        window.localStorage.removeItem("connection_"+selectedConnection);
        location.reload();
    });
    $("#mqttConnectionSettings").on("submit", function (e) {
        e.preventDefault();
        $('#connectionAlert').hide();
        $('#btnTestSettings').attr('disabled','disabled');
        $('#btnTestSettings').removeAttr('data-connection');

        const form = $(e.target);
        let settings = convertFormToJSON(form);
        settings.port = settings.port * 1;

        if(typeof settings.protocolVersion !== 'undefined') settings.protocolVersion = settings.protocolVersion  * 1;
        console.log(settings.availConnections);

        const selectedConnection =  settings.availConnections;
        delete settings.availConnections;

        if(selectedConnection !== '_new') {
            settings.uiid = selectedConnection;
            settings.connectionId = selectedConnection;
            window.localStorage.setItem("connection_"+selectedConnection,JSON.stringify(settings));
            $('#mqttConnection').modal('hide');
            populateConnectionList(selectedConnection);
            if(typeof settings.basePath !== 'undefined') {
                $('#nTopic').val(settings.basePath);
            }
            $('#mqttTopics').modal('show');
        } else {
           
            const connection = new MQTTSource(settings);
            connection.connect().then(function(t) {
                $('#connectionAlert').hide();
                console.log("connected",connection.getConnectionId());
                $('#btnTestSettings').attr('data-connection',connection.getConnectionId());
                $('#btnTestSettings').removeAttr('disabled');
              
                $('#mqttConnection').modal('hide');
               
                if(typeof settings !== 'object') {
                    populateConnectionList(connection.getConnectionId());
                } else {
                    populateConnectionList(settings);
                }
              
                //populateConnectionList();
    
                $('#mqttTopics').modal('show');
    
                
            }).catch(function(ex) {
                console.error(ex);
                $('#connectionAlert').show();
                $('#connectionAlert').html(ex);
                $('#btnTestSettings').removeAttr('disabled');
            });
        }
        

    });

    $("#btnAddMqttDatapoint").on('click',function() {
        populateConnectionList();
        $('#mqttTopics').modal('show');
    });

    
    $("#btnBridgeSettings").on('click',function() {
        populateConnectionList();
        let cloud = JSON.parse(window.localStorage.getItem("connection_cloud"));
        $('#bridgeConnection').append('<option value="'+cloud.connectionId+'" selected>'+cloud.connectionName+'</option>');  
        $('#basepath').val(cloud.basePath);

        $('#bridgeSettings').modal('show');
    });


    $('#btnApplyImport').on('click',function() {
        let importJSON = JSON.parse($('#txtImport').val());
        let singleImport = false;
        if(typeof importJSON.connection !== 'undefined') {
            let connection = importJSON.connection;
            window.localStorage.setItem("connection_"+connection.connectionId,JSON.stringify(connection));
            singleImport = true;
                let topics = importJSON.topics;
                 window.localStorage.setItem("topics_"+connection.connectionId,JSON.stringify(topics));
                 singleImport = true;
        } else
        if(typeof importJSON.edge_flow !== 'undefined') {
        
            singleImport = true;
            front.send("/corrently/edge/add-flow",JSON.stringify(importJSON.edge_flow));
            let topics = window.localStorage.getItem("topics_edge");
            if((typeof topics == 'undefined') || (topics == null)) {
                    topics = "[]";
            }   
            topics = JSON.parse(topics);

            for(let i=0;i<importJSON.topics_edge.length;i++) {
                topics.push(importJSON.topics_edge[i]);
            }
            window.localStorage.setItem("topics_edge",JSON.stringify(topics));

        }
        if(!singleImport) {
            for (const [key, value] of Object.entries(importJSON)) {
                window.localStorage.setItem(key,JSON.stringify(value));
            }
        }
        if(getUrlParameter('import')) {
            location.href='?';
        } else {
            location.reload();
        }
    });

    $('#edgeToBridge').on('submit',function(e) {
        e.preventDefault();
        const form = $(e.target);
        const settings = convertFormToJSON(form);
        let bridgeConf = JSON.parse(window.localStorage.getItem("connection_"+settings.connection));
        bridgeConf.basepath = settings.basePath;
        front.send("/corrently/mqtt/bridge",JSON.stringify(bridgeConf));
        $('#bridgeSettings').modal('hide');
    });

  
    $('#btnShareCurrent').on('click',function(e) {
        const obj = window.localStorage;
        let nobj = {};

        for (const [key, value] of Object.entries(obj)) {
            nobj[key] = JSON.parse(value);
        }
    
        $('#exportTxt').val(JSON.stringify(nobj));
        $('#exportTxt').show();
        $('#gtpShareId').hide();
        $('#exportSettings').modal('show')
    })
    $('#revealPWD').on('click',function(e) {
        if($('#mqtt_password').attr('type') == 'password') {
            $('#mqtt_password').attr('type','text');
        } else {
            $('#mqtt_password').attr('type','password');
        }
    });
    connectMQTT();

    if(getUrlParameter('import')) {
        $('#importSettings').modal('show');
        $('#bucketId').val(getUrlParameter('import'));
    }
    $('#jumpWizard').on('change',function(e) {
        if( (''+$(e.currentTarget).val()).length > 0 ) {
            location.href=$(e.currentTarget).val()+"?returnUrl="+encodeURIComponent(window.location.href);
        } 
    })
});
if (typeof navigator.serviceWorker !== 'undefined') {
    navigator.serviceWorker.register('assets/js/sw.js')
}