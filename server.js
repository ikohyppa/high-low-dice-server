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

const rolldice = () => {
  const zeroValues = [0, 0, 0, 0, 0, 0];
  const randomValues = zeroValues.map(() => {
    return Math.floor(Math.random() * 6) + 1;
  });
  return randomValues;
};

io.on('connection', function (socket) {
  socket.on('event://send-newplayer', function (msg) {
    console.log('got newPlayer', msg);
    const payload = JSON.parse(msg);
    console.log('payload', payload);
    socket.broadcast.emit('event://get-newplayer', payload);
  });
  socket.on('event://send-newgame', function (msg) {
    console.log('got newGame', msg);
    const payload = JSON.parse(msg);
    console.log('payload', payload);
    socket.broadcast.emit('event://get-newgame', payload);
  });
  socket.on('event://send-rolldice', function (msg) {
    console.log('got rollDice', msg);
	let payload = JSON.parse(msg);
	console.log(payload);
    const diceValues = rolldice();
	console.log(diceValues)
    payload = {...payload, dice: diceValues};
    console.log("payload", payload);
    io.emit('event://get-rolldice', payload);
  });
});

http.listen(8000, function () {
  console.log('listening on port 8000');
});
