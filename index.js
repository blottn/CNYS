let room = window.location.pathname;

let local_uid = new Date().getTime(); // TODO use mac address or something + chrome tab
//config
let delay = 0;
let bell = false;

let peers = {};
console.log('connecting to wrmhole at:');
console.log(`wss://wrm.blottn.ie${room}`);

// create WS
let ws = new WebSocket("wss://wrm.blottn.ie" + room);
ws.addEventListener('open', function (event) {
  send({
    kind: 'join',
    data: {
      uid: local_uid,
    }
  });
});

const send = (obj) => {
  if (ws.readyState != 1) {
    ws = new WebSocket("wss://wrm.blottn.ie" + room);
  }
  while (ws.readyState != 1) {}
  ws.send(JSON.stringify(obj));
}

ws.addEventListener('message', async function (event) {
  let text = await event.data.text();
  let {kind, data} = JSON.parse(text);
  let {uid} = data;

  if (kind === 'join' && !(uid in peers)) {
    send({
      kind: 'join',
      data: {
        uid: local_uid,
      }
    });
    createBox(uid);
  }
  if (kind === 'msg') {
    let {delay, content} = data;
    if (!(uid in peers)) {
      createBox(uid);
    }
    setTimeout(() => {
      document.getElementById(`uid-${uid}`).value = content;
    }, delay);
  }
  peers[uid] = {
    last: new Date().getTime(),
    missed: 0,
  }
});

// Heartbeats
const heartbeatWindow = 3000;
const heartbeatAllowedMisses = 2;
const heartbeatInterval = 1000;
let heartbeat = () => {
  send({
    kind: 'heartbeat',
    data: {
      uid: local_uid,
    }
  });
  let now = new Date().getTime();
  Object.keys(peers).map(peer => {
    if (now - peers[peer].last > heartbeatWindow) {
      console.log(`${peer} missed heartbeat`);
      peers[peer].missed += 1;
    }
    if (peers[peer].missed > heartbeatAllowedMisses) {
      delete peers[peer];
      // yuck lol
      // TODO change to id-ing the root box object;
      let box = document.getElementById(`uid-${peer}`).parentElement.parentElement;
      box.parentElement.removeChild(box);
    }
  });
  setTimeout(heartbeat, heartbeatInterval);
}
setTimeout(heartbeat, heartbeatInterval);

// Setup event listeners
window.addEventListener('load', () => {
  document.getElementById('true-title').textContent = genName(local_uid);
  let input = document.getElementById('inputspace');
  input.addEventListener('input', (e) => {
    send({
      kind: 'msg',
      data: {
        delay,
        uid: local_uid,
        content: e.target.value,
      }
    });
  });

  document.getElementById('delay')
    .addEventListener('input', (e) => {
    delay = parseInt(e.target.value);
  });
  document.getElementById('bell')
    .addEventListener('change', (e) => {
    bell = !bell;
  });
});

function createBox(uid) {
  let template = document.getElementById('template');
  let box = template.cloneNode(true);
  box.className = "box client";
  box.querySelector('#title').textContent = genName(uid);
  let input = box.querySelector('#inputspace')
  input.id = `uid-${uid}`;
  input.value = '';
  box.querySelector(`#uid-${uid}`).setAttribute('readonly','');
  box.querySelector(`#uid-${uid}`).className = "uneditable";
  let container = document.getElementById('boxes');
  container.appendChild(box);
}

function genName(id) {
  return wordnet_english_adjective_words[id % wordnet_english_adjective_words.length];
}

function burger() {
  let menu = document.querySelector(".menu");
  if (menu.className.includes('menu-gone')) {
    menu.className = 'menu';
  } else {
    menu.className = 'menu menu-gone';
  }
}

function ringBell() {
  const audio = new Audio();
  audio.play();
}
