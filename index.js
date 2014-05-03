var http = require('http');
var Static = require('node-static');
var app = http.createServer(handler);
var io = require('socket.io').listen(app);
var port = 5000;

var files = new Static.Server('./public');

function handler(request, response) {
    request.on('end', function() {
        files.serve(request, response);
    }).resume();
}

io.set('log level', 1);
var users = [];
var clients = {};

io.sockets.on('connection', function(socket) {

	clients[socket.id] = socket;

    socket.on('send:coords', function(data) {
        socket.broadcast.emit('load:coords', data);
        clients[socket.id] = data.id;
        clients[socket.username] = data.username;
    });

    socket.on('disconnect', function(data) {
    	socket.broadcast.emit('disconnect', clients[socket.id]);
    	socket.broadcast.emit('disconnected', clients[socket.username]);
    	delete clients[socket.id];
    });
});

// start app on specified port
app.listen(port);
console.log('Your server goes on localhost:' + port);
