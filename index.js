var WebSocketServer = require('ws').Server
    , http = require('http');

// This program is a very basic sketch how a RESTful approach could look like
// if i send a GET, the server sends the state
// if I send a websocket request, the server upgrades the connection and pushes updates on change
//
// so far, its just the payload, but it should actually be a full http response

//This is my ressource, it changes every second and can be polled and observed
//TODO use an actual object, not this (whatever I meant to do here)
var ressource = {
    value : 0,
    observers : [],
    change : function() {
        ressource.value++;
	for(var i =0; i<ressource.observers.length; i++) {
	    ressource.observers[i](ressource.value);
	}
    },
    _intervalId : null,
    startChanges : function() {
       _intervalId = setInterval(ressource.change,1000);
    },
    stopChanges : function() {
        if(_intervalId)
	   clearInterval(_intervalId);
    }
};


var poller  = function(req, res) {
    res.writeHead(200);
    res.end('polling result is ' + ressource.value);
};

var server = http.createServer(poller);
server.listen(8088);

var wss = new WebSocketServer({server: server});
wss.on( 'connection', function ( ws) {
    console.log('got connection, registering observer');

    var observer = function(val) {
	//TODO it should send another http response
        ws.send(JSON.stringify(val));
    };
    ressource.observers.push(observer);

    //TODO this should actually be in the http response
    ws.send(JSON.stringify(val));

    ws.on('close',function() {
        //TODO there should be an id for each each observer matching its ws
        console.log('closed connection, de-registering observer');
        ressource.observers.pop();
    });

    ws.on( 'message', function ( message ) {
        console.log( message );
    });
});

ressource.startChanges();
