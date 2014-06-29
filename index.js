var WebSocketServer = require('ws').Server
    , http = require('http');

// This program is a very basic sketch how a RESTful approach could look like
// if i send a GET, the server sends the state
// if I send a websocket request, the server upgrades the connection and pushes updates on change
//
// so far, its just the payload, but it should actually be a full http response

//This is my ressource, it changes every second and can be observed
var resource = {
    value : 0,
    observers : new Array(),
    
    change : function() {
        this.value++;
        this.observers.forEach(function(callback) {
            callback(this.value);
        },this);
    },
    
    _intervalId : null,
    startChanges : function() {
       this._intervalId = setInterval(
           function(resource) {
               resource.change(); 
           },1000,this);
    },
    stopChanges : function() {
        if(this._intervalId)
	   clearInterval(this._intervalId);
    }
};

//this function handles GET requests
var poller  = function(req, res) {
    res.writeHead(200);
    res.end('polling result is ' + resource.value);
};

//our server
var server = http.createServer(poller);
server.listen(8088);

//this is a websocketserver, which handles requests that includes the headers connection:upgrade and upgrade:websocket
var wss = new WebSocketServer({server: server});
wss.on( 'connection', function ( ws) {
    console.log('got connection, registering observer');

    var observer = function(val) {
	//TODO it should send another http response
        ws.send(JSON.stringify(val));
    };
    resource.observers.push(observer);

    //TODO this should actually be in the http response
    ws.send(JSON.stringify(resource.value));

    ws.on('close',function() {
        //TODO there should be an id for each each observer matching its ws
        console.log('closed connection, de-registering observer');
        resource.observers.pop();
    });

    //we could also have streaming push, sort of a reversed observe using post
    //which is not defined in coap 
    ws.on( 'message', function ( message ) {
        console.log( message );
    });
});

resource.startChanges();
console.log('up & running on port 8088');