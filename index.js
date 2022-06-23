let room = window.location.pathname;

let local_uid = new Date().getTime();

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
  }
  else if (kind === 'msg') {
    let {delay, uid, content} = data;
    setTimeout(() => {
      document.getElementById(`uid-${uid}`).value = content;
    }, delay);
  } else if (kind === 'joinack') {
    let { uid } = data;
    createBox(uid);
  }
});

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
