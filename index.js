let room = window.location.pathname;

let local_uid = new Date().getTime(); // TODO use mac address or something + chrome tab
let peers = {};

// 1.5s
const heartbeatWindow = 3000;
const heartbeatAllowedMisses = 3;

console.log('connecting to wrmhole at:');
console.log(`ws://wrm.blottn.ie${room}`);

// create WS
let ws = new WebSocket("ws://wrm.blottn.ie" + room);
ws.addEventListener('open', function (event) {
  ws.send(JSON.stringify({
    kind: 'join',
    data: {
      uid: local_uid,
    }
  }));
});

ws.addEventListener('message', async function (event) {
  let text = await event.data.text();
  let {kind, data} = JSON.parse(text);
  if (kind === 'join') {
    ws.send(JSON.stringify({
      kind: 'joinack',
      data: {
        uid: local_uid,
      }
    }));

    let { uid } = data;
    createBox(uid);
    peers[uid] = {
      last: new Date().getTime(),
      missed: 0,
    };
  }
  else if (kind === 'msg') {
    let {delay, uid, content} = data;
    if (!(uid in peers)) {
      createBox(uid);
      peers[uid] = {
        last: new Date().getTime(),
        missed: 0,
      };
    }
    setTimeout(() => {
      document.getElementById(`uid-${uid}`).value = content;
    }, delay);
  } else if (kind === 'joinack') {
    let { uid } = data;
    createBox(uid);
    peers[uid] = {
      last: new Date().getTime(),
      missed: 0,
    };
  } else if (kind === 'heartbeat') {
    let { uid } = data;
    console.log(`Received heartbet from ${uid}`);
    peers[uid] = {
     last: new Date().getTime(),
     missed: 0,
    }
  }
});

const heartbeatInterval = 1000;
let heartbeat = () => {
  ws.send(JSON.stringify({
    kind: 'heartbeat',
    data: {
      uid: local_uid,
    }
  }));
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

window.addEventListener('load', () => {
  let input = document.getElementById('inputspace');
  input.addEventListener('input', (e) => {
    ws.send(JSON.stringify({
      kind: 'msg',
      data: {
        delay: 0,
        uid: local_uid,
        content: e.target.value,
      }
    }));
  });
});


function createBox(uid) {
  let template = document.getElementById('template');
  let box = template.cloneNode(true);
  box.querySelector('#inputspace').id = `uid-${uid}`;
  box.querySelector(`#uid-${uid}`).setAttribute('readonly','');
  let container = document.getElementById('boxes');
  container.appendChild(box);
}
