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
    for (const [key, value] of Object.entries(window.localStorage)) {
        const key_split = key.split('_');
        if(key_split.length == 2) {
            const key_type = key_split[0];
            const key_id = key_split[1];
            if(key_type == 'connection') {
                const settings = JSON.parse(value);
                let selected = '';
                if(selected_connection == key_id) {
                    selected = "selected";
                }
                html += '<option value="'+key_id+'" '+selected+'>'+settings.connectionName+'</option>'; 
            }
        }
    }

    $('#connectionListForTopics').html(html);
    
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

    for (const [key, value] of Object.entries(window.localStorage)) {
        const key_split = key.split('_');
        let migration=false;
        if(key_split.length == 2) {
            const key_type = key_split[0];
            const key_id = key_split[1];
            if(key_type == 'connection') {
                const connection = new MQTTSource(JSON.parse(value));
                await connection.connect();
                let datapoints = window.localStorage.getItem("topics_"+key_id);
                if((typeof datapoints !== 'undefined') && (datapoints !== null)) {
                    datapoints = JSON.parse(datapoints);
                    for(let i=0;i<datapoints.length;i++) {
                        connection.subscribe(datapoints[i].topic,function(msg) {
                                render(connection.getConnectionId(),datapoints[i].topic,msg);
                        });
                    }
                }
            }
            if(key_type == 'topics') {
                let topicSettings = JSON.parse(value);
                for(let i=0;i<topicSettings.length;i++) {
                    let connectionSettings = JSON.parse(window.localStorage.getItem('connection_'+key_id));
                    html += '<div class="col-md-4" title="'+topicSettings[i].topic+'">'
                    html += '<div class="card" style="margin-bottom:15px"><div class="heijoh">';
                        html += '<div class="card-header">';
                                html += '<div>';
                                    html += '<div class="'+key_id+' text-right text-truncate display-4 idle_'+topicSettings[i].id+'" data-colorize="'+topicSettings[i].colorize+'" corrently-maxlength=20 corrently-renderer="'+topicSettings[i].renderer+'" corrently-datapoint="'+topicSettings[i].topic+'">-</div>';
                                    html += '<div>' + topicSettings[i].alias + '</div>';
                                html +='</div>';

                                html += '<div class="col-md-1 text-right">';
                                html += '<a class="btn btn-secondary" data-bs-toggle="collapse" aria-expanded="false" aria-controls="#area_'+topicSettings[i].id+'" href="#area_'+topicSettings[i].id+'" role="button">'
                               // html += '<i style="cursor:pointer" data-toggle="collapse" data-target="#area_'+topicSettings[i].id+'" aria-expanded="true" aria-controls="area_'+topicSettings[i].id+'">';
                                html += '<svg class="bi bi-chevron-double-down" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                                html += '<path fill-rule="evenodd" d="M1.646 6.646a.5.5 0 0 1 .708 0L8 12.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"></path>';
                                html += '<path fill-rule="evenodd" d="M1.646 2.646a.5.5 0 0 1 .708 0L8 8.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"></path>';
                                html += '</svg>';
                                html += '</a>';
                                html += '</div>';
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
                            html += '<button type="button" style="margin-right:10px;" class="btn btn-danger deleteTopic" id="delete_'+topicSettings[i].id+'" data-topic="'+topicSettings[i].id+'" data-connection="'+key_id+'">';
                            html += '<svg class="bi bi-trash" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                            html += '<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path>';
                            html += '<path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>';
                            html += '</svg>';
                            html += '</button>';
                            html += '<button type="button" style="margin-right:10px;" class="btn btn-primary shareTopic" id="share_'+topicSettings[i].id+'" data-topic="'+topicSettings[i].id+'" data-connection="'+key_id+'">';
                            html += '<svg class="bi bi-share" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                            html += '<path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"></path>';
                            html += '</svg>';
                            html += '</button>';
                            html += '<button type="button" class="btn btn-secondary saveTopic" id="save_'+topicSettings[i].id+'" data-topic="'+topicSettings[i].id+'" data-connection="'+key_id+'">';
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
        for(let i=0;i<topics.length;i++) {
            if((topics[i].id == $(e.currentTarget).attr('data-topic'))&&(topics[i] !== null)) {
               ntopics.push(topics[i]);
            }
        }
        let shareable = {
            topics:ntopics,
            connection:connection
        };
        console.log(shareable);
    })

    sortability();
}

$(document).ready(async function() {

    $('#btnAddTopic').on('click',function(e) {
        $('#btnAddTopic').attr('disabled','disabled');

        const connectionId = $('#connectionListForTopics').val();
        const topic = $('#nTopic').val();
        const connection = new MQTTSource(connectionId);
        
        connection.connect().then(function(t) {
            connection.subscribe(topic,function(msg) {
              //  $('#discoverdTopics').append('<option>'+msg+'</option>');
              console.log("Received something from Underlay",topic);
            });
            connection.subscribe('topicsDiscovery',function(msg) {
                $('#discoverdTopics').append('<option>'+msg+'</option>');
            });
            $('#nTopic').val('');
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

    $("#mqttConnectionSettings").on("submit", function (e) {
        e.preventDefault();
        $('#connectionAlert').hide();
        $('#btnTestSettings').attr('disabled','disabled');
        $('#btnTestSettings').removeAttr('data-connection');

        const form = $(e.target);
        const settings = convertFormToJSON(form);
        settings.port = settings.port * 1;
        if(typeof settings.protocolVersion !== 'undefined') settings.protocolVersion = settings.protocolVersion  * 1;

        const connection = new MQTTSource(settings);
        connection.connect().then(function(t) {
            console.log("connected",connection.getConnectionId());
            $('#btnTestSettings').attr('data-connection',connection.getConnectionId());
            $('#btnTestSettings').removeAttr('disabled');
          
            $('#mqttConnection').modal('hide');
            
            populateConnectionList(connection.getConnectionId());

            $('#mqttTopics').modal('show');
            
        }).catch(function(ex) {
            console.error(ex);
            console.log("Error");
            $('#connectionAlert').show();
            $('#connectionAlert').html(ex);
        });
    });

    $("#btnAddMqttDatapoint").on('click',function() {
        populateConnectionList();
        $('#mqttTopics').modal('show');
    });
    connectMQTT();
    
});