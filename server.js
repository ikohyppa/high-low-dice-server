var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const cors = require('cors');
var uuidv4 = require('uuid').v4;

let rooms = {};
let playerlist = {};

app.use(cors());

app.get('/room', function (req, res, next) {
  const room = {
    name: req.query.name,
    id: uuidv4()
  };
  const user = req.query.user;
  rooms[room.id] = room;
  playerlist[room.id] = [];
  playerlist[room.id].push(user);
  const response = {
    id: rooms[room.id].id,
    name: rooms[room.id].name,
    user: user,
    playerlist: playerlist[room.id]
  };
  res.json(response);
});

app.get('/room/:roomId', function (req, res, next) {
  const roomId = req.params.roomId;
  const user = req.query.user;
  playerlist[roomId].push(user);
  const response = {
    id: rooms[roomId].id,
    name: rooms[roomId].name,
    user: user,
    playerlist: playerlist[roomId]
  };
  res.json(response);
});

io.on('connection', function (socket) {
  socket.on('event://send-newplayer', function (msg) {
    console.log('got', msg);
    const payload = JSON.parse(msg);
    console.log('payload', payload);
    socket.broadcast.emit('event://get-newPlayer', payload);
  });
});

http.listen(8000, function () {
  console.log('listening on port 8000');
});
