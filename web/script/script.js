let video = document.getElementById("myVideo");
let peer;
let conn;
let lastSentTime = 0;
let lastReceivedTime = 0;

function generateShareCode() {
    if (peer && peer.id) {
        navigator.clipboard.writeText(peer.id).then(function () {
            alert('Votre Peer ID est : ' + peer.id + '. Il a été copié dans le presse-papier.');
            console.log('Peer ID: ' + peer.id);
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    } else {
        console.log('Peer ID is not yet available');
    }
}

function joinWithShareCode() {
    let shareCodeInput = document.getElementById('shareCodeInput');
    let shareCode = shareCodeInput.value;
    if (shareCode != null && shareCode !== '') {
        conn = peer.connect(shareCode);
        console.log('Joined with share code: ' + shareCode);
        setupConnHandlers();
    }
}

function setupConnHandlers() {
    conn.on('open', function () {
        console.log('Connected to: ' + conn.peer);
    });

    conn.on('data', function (data) {
        console.log('Received data: ', data);
        if (data.type === "play") {
            video.play();
        } else if (data.type === "pause") {
            video.pause();
        } else if (data.type === "timeupdate" && Math.abs(video.currentTime - data.currentTime) > 0.2) {
            lastReceivedTime = data.currentTime;
            if (Math.abs(lastSentTime - data.currentTime) > 0.2) {
                video.currentTime = data.currentTime;
            }
        }
    });

    conn.on('close', function () {
        console.log('Connection closed');
    });
}

window.onload = function () {
    peer = new Peer({
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                }
            ]
        }
    });

    peer.on('open', function (id) {
        console.log('My peer ID is: ' + id);
    });

    peer.on('connection', function (incomingConn) {
        console.log('Incoming connection');
        conn = incomingConn;
        setupConnHandlers();
    });

    video.ontimeupdate = function () {
        if (conn && conn.open && Math.abs(video.currentTime - lastReceivedTime) > 1) {
            lastSentTime = video.currentTime;
            conn.send({ type: "timeupdate", currentTime: video.currentTime });
            console.log('Sent timeupdate event');
        }
    };

    video.onplay = function () {
        if (conn && conn.open) {
            conn.send({ type: "play" });
            console.log('Sent play event');
        }
    };

    video.onpause = function () {
        if (conn && conn.open) {
            conn.send({ type: "pause" });
            console.log('Sent pause event');
        }
    };
}