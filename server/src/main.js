import { WebSocketServer } from 'ws';


const state = {
  options: ['tetris', 'valorant', 'nerts'],
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
}, (1000 / 10));

let lastTimestamp = process.hrtime.bigint();
const simulation = setInterval(() => {
  const dt = (process.hrtime.bigint() - lastTimestamp) / 1000000n; // milliseconds
  state.s[0] += state.s[1] * Number(dt);
  state.s[1] += (-state.s[1] * Number(dt) * (1/1000));

  lastTimestamp = process.hrtime.bigint();
}, (1000 / 60));

wss.on('close', function close() {
  clearInterval(interval);
});