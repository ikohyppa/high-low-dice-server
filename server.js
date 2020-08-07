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

// creating a room
app.get('/room', function (req, res, next) {
  const room = {
    name: req.query.name,
    id: uuidv4(),
    gameOn: false
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

// joining a room
app.get('/room/:roomId', function (req, res, next) {
  console.log('rooms:');
  console.log(rooms);
  const roomId = req.params.roomId;
  const user = req.query.user;
  const roomIds = _.map(rooms, room => room.id);
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
  } else if (rooms[roomId].gameOn) {
    const roomName = rooms[roomId].name;
    const response = {
      status: 'error',
      data: { roomName: roomName },
      message: '',
      error: `Cannot join '${roomName}' because game has already started!`
    };
    res.json(response);
  } else {
    playerlist[roomId].push(user);
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

// websocket connections
io.on('connection', function (socket) {
  socket.on('event://send-newplayer', function (msg) {
    console.log('got newPlayer', msg);
    const message = JSON.parse(msg);
    console.log('rooms:');
    console.log(rooms);
    if (!rooms[message.roomId].gameOn) {
      const payload = {
        roomName: rooms[message.roomId].name,
        playerName: message.playerName
      };
      console.log('payload', payload);
      socket.broadcast.emit('event://get-newplayer', payload);
    }
  });
  socket.on('event://send-newgame', function (msg) {
    console.log('got newGame', msg);
    const message = JSON.parse(msg);
    rooms[message.roomId].gameOn = true;
    const payload = { roomName: rooms[message.roomId].name };
    console.log('payload', payload);
    io.emit('event://get-newgame', payload);
  });
  socket.on('event://send-rolldice', function (msg) {
    console.log('got rollDice', msg);
    const message = JSON.parse(msg);
    const diceValues = rolldice();
    console.log(diceValues);
    let payload = {
      ...message,
      dice: diceValues,
      roomName: rooms[message.roomId].name
    };
    payload = _.omit(payload, 'roomId');
    console.log('payload', payload);
    io.emit('event://get-rolldice', payload);
  });
  socket.on('event://send-playerready', function (msg) {
    console.log('got playerready', msg);
    const message = JSON.parse(msg);
    let payload = {
      roomName: rooms[message.roomId].name,
      playerId: message.playerId
    };
    console.log('payload', payload);
    io.emit('event://get-playerready', payload);
  });
});

http.listen(8000, function () {
  console.log('listening on port 8000');
});
