import { WebSocketServer } from 'ws';


const state = {
  timestamp: Number(process.hrtime.bigint() / 1000000n),
  s: [0, 0]
}

function heartbeat() {
  this.isAlive = true;
}

function onMessage(data) {
  const payload = JSON.parse(data);
  console.log(payload);
  if (payload.type === 'deltaTheta') {
    state.s[0] += payload.deltaTheta;
  } else if (payload.type === 'dTheta') {
    state.s[1] = payload.dTheta
  } else if (payload.type === 'options') {
    state.options = payload.options
  }

  console.log(state);
}

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.isAlive = true;
  console.log(`Connection: ${ws}`)
  ws.on('message', onMessage);
  ws.on('pong', heartbeat);
  ws.on('close', () => console.log('Closed'));
});

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
  const payload = JSON.stringify(state);
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