var https = require('https');
var express = require('express');
var app = express();
var fs = require('fs');
var key = fs.readFileSync('encryption/private.key');
var cert = fs.readFileSync( 'encryption/primary.crt' );
var ca = fs.readFileSync( 'encryption/intermediate.crt' );

var exphbs = require('express-handlebars');
var path = require('path');
var port = 5000;
var rc522 = require("rc522");
var jsonfile = require('jsonfile');
var db = './database/db.json';
var helpers = require('./helpers/helpers');

var id = 0;
var msg = '';
var options = {
    key: key,
    cert: cert,
    ca: ca
  };

var server = https.createServer(options, app);
var io = require('socket.io').listen(server);

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use('/js', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/js', express.static(path.join(__dirname, '/node_modules/notifyjs/dist')));
app.use('/js', express.static(path.join(__dirname, '/content')));

console.log(path.join(__dirname, '/node_modules/jquery/dist'));
console.log(path.join(__dirname, '/node_modules/notifyjs/dist'));

function checkUsers(data, rfid){
    var userName = "";
    for(var i = 0; i < data.users.length ; i++){
        if(data.users[i].rfid == rfid){
            userName =  data.users[i].nome;
        }
    }
    return userName != "" ? userName : "Não encontrado";
}

app.get('/', function(req, res){
    res.render('index', {rfid: msg});
});

var conections = 0;
io.sockets.on('connection', function(socket){
    console.log('Usuários conectados: ' + (++conections));
    socket.on('disconnect', function(){
        console.log('Usuários conectados: ' + (--conections));
    });
});

rc522(function(rfidSerialNumber){
    jsonfile.readFile(db, function(err, data){
        if(err) throw err;
        id = rfidSerialNumber;
        msg = checkUsers(data, id);
        io.sockets.emit('read rfid', msg);
        console.log('_______________________________________');
        console.log(id);
        console.log(msg);
        console.log('_______________________________________\n\n');
    });
});

server.listen(port, function(){
    console.log('Servidor iniciado: http://localhost:' + port);
});