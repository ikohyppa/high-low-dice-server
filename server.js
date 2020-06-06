var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const cors = require('cors');
var uuidv4 = require('uuid').v4;

let rooms = {};

app.use(cors());

app.get('/room', function (req, res, next) {
  const room = {
    name: req.query.name,
    id: uuidv4()
  };
  const user = req.query.user;
  rooms[room.id] = room;
  const response = {
    id: rooms[room.id].id,
    name: rooms[room.id].name,
    user: user,
  }
  res.json(response);
});

app.get('/room/:roomId', function (req, res, next) {
  const roomId = req.params.roomId;
  const user = req.query.user;
  const response = {
    id: rooms[roomId].id,
    name: rooms[roomId].name,
    user: user,
  };
  res.json(response);
});

http.listen(8000, function () {
  console.log('listening on port 8000');
});
