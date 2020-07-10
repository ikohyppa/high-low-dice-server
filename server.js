var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var _ = require('lodash');

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
  const roomNames = _.map(rooms, room => room.name);
  if (_.includes(roomNames, room.name)) {
    const response = {
      status: 'error',
      data: { roomName: room.name },
      message: '',
      error: `Room name '${room.name}' already in use!`
    };
    res.json(response);
  } else {
    rooms[room.id] = room;
    playerlist[room.id] = [];
    playerlist[room.id].push(user);
    const response = {
      status: 'ok',
      data: {
        id: rooms[room.id].id,
        name: rooms[room.id].name,
        user: user,
        playerlist: playerlist[room.id]
      },
      message: 'Room created successfully!',
      error: null
    };
    res.json(response);
  }
});

app.get('/room/:roomId', function (req, res, next) {
  const roomId = req.params.roomId;
  const user = req.query.user;
  console.log(roomId);
  console.log(user);
  const roomIds = _.map(rooms, room => room.id);
  console.log(roomIds)
  if (!_.includes(roomIds, roomId)) {
    const response = {
      status: 'error',
      data: { roomId: roomId },
      message: '',
      error: `There is no room with  ID '${roomId}'`
    };
    res.json(response);
  } else if (_.includes(playerlist[roomId], user)) {
    const response = {
      status: 'error',
      data: { userName: user },
      message: '',
      error: `Player named '${user}' is already in the room!`
    };
    res.json(response);
  } else {
    playerlist[roomId].push(user);
    console.log(rooms);
    console.log(playerlist);
    const response = {
      status: 'ok',
      data: {
        id: rooms[roomId].id,
        name: rooms[roomId].name,
        user: user,
        playerlist: playerlist[roomId]
      },
      message: 'Room joined successfully!',
      error: null
    };
    res.json(response);
  }
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
    io.emit('event://get-newgame', payload);
  });
  socket.on('event://send-rolldice', function (msg) {
    console.log('got rollDice', msg);
    let payload = JSON.parse(msg);
    console.log(payload);
    const diceValues = rolldice();
    console.log(diceValues);
    payload = { ...payload, dice: diceValues };
    console.log('payload', payload);
    io.emit('event://get-rolldice', payload);
  });
  socket.on('event://send-playerready', function (msg) {
    console.log('got playerready', msg);
    let payload = JSON.parse(msg);
    io.emit('event://get-playerready', payload);
  });
});

http.listen(8000, function () {
  console.log('listening on port 8000');
});
