import { WebSocketServer } from 'ws';

// interface StatePayload {
//   type: "state";
//   timestamp: number;
//   s: [number, number];
// }

const state = {
  timestamp: Number(process.hrtime.bigint() / 1000000n),
  s: [0, 0]
}

// interface LobbyPayload {
//   type: "lobby";
//   selfId: number;
//   users: {
//     id: number;
//     name: string;
//   }[];
// }

const lobby = {
  users: {}
}

function heartbeat() {
  this.isAlive = true;
}

function onMessage(ws, data) {
  const payload = JSON.parse(data);
  console.log(payload);
  if (payload.type === 'deltaTheta') {
    state.s[0] += payload.deltaTheta;
  } else if (payload.type === 'dTheta') {
    state.s[1] = payload.dTheta;
  } else if (payload.type === 'options') {
    state.options = payload.options;
  } else if (payload.type === 'mouse') {
    lobby.users[ws.userId].mousePosition = payload.mousePosition;
  } else if (payload.type === 'name') {
    lobby.users[ws.userId].name = payload.name;
  }
}

if (process.env.PORT === undefined) {
  throw "Missing PORT environment variable.";
}

const port = Number(process.env.PORT);
console.log(`Starting state server on port ${port}`);
const wss = new WebSocketServer({ port: port });

let userId = 0;
wss.on('connection', function connection(ws) {
  console.log(`Connection: ${ws}`)
  ws.isAlive = true;
  ws.userId = userId++;
  lobby.users[ws.userId] = {
    name: `Guest ${ws.userId}`,
    mousePosition: [0, 0],
    color: '#ff0000',
  }


  ws.on('message', (data) => onMessage(ws, data));

  ws.on('pong', heartbeat);

  ws.on('close', () => {
    delete lobby.users[ws.userId];
    console.log('Closed');
  });
});

const lobbyDataInterval = setInterval(() => {
  // console.log(`Sending lobby data.`);
  for (const ws of wss.clients) {
    // console.log(`Sending lobby data to ${ws.userId}`);
    ws.send(JSON.stringify({
      type: 'lobby',
      selfId: ws.userId,
      ...lobby,
    }))
  }
}, (1000 / 30));

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      console.log(`Terminating for ${ws}`);
      return ws.terminate();
    }
    console.log(`Pinging: ${ws}`);
    ws.isAlive = false;
    ws.ping();
  });
}, 10000);

const interval2 = setInterval(() => {
  const payload = JSON.stringify({
    ...state,
    type: 'state'
  });
  for (const client of wss.clients) {
    client.send(payload);
  }
}, (1000 / 60));

let lastTimestamp = process.hrtime.bigint();
const simulation = setInterval(() => {
  const dt = (process.hrtime.bigint() - lastTimestamp) / 1000000n; // milliseconds
  state.timestamp = Number(process.hrtime.bigint() / 1000000n)
  state.s[0] += state.s[1] * Number(dt);
  state.s[1] += (-state.s[1] * Number(dt) * (1 / 1000));
  if (Math.abs(state.s[1]) < 1e-5) {
    state.s[1] = 0;
  }

  // const absRadians = Math.abs(state.s[0]);
  // if (absRadians > 2*Math.PI) {
  //   state.s[0] -= (2*Math.PI * (state.s[0]/absRadians))
  // }

  lastTimestamp = process.hrtime.bigint();
}, (1000 / 60));

wss.on('close', function close() {
  clearInterval(interval);
});