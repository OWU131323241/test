const socket = io();

// PCと自分、両方の画面を切り替える最重要関数
function changeScreen(screenId) {
    // 1. 自分の画面を切り替える
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');

    // 2. PCへ「画面を変えて」と命令を送る
    socket.emit('cmd', { type: 'changeScreen', screen: screenId });
}

// 左右移動ボタン
function moveSelection(direction) {
    socket.emit('cmd', { type: 'move', dir: direction });
}

// やりなおしボタン
function resetMix() {
    socket.emit('cmd', { type: 'reset' });
}

// まぜるボタン
document.getElementById("startBtn").addEventListener("click", () => {
    // iPhoneの許可リクエスト
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then(state => {
            if (state === "granted") startMixing();
        });
    } else {
        startMixing();
    }
});

function startMixing() {
    changeScreen('shake'); // これで自分もPCも「ふってまぜる」画面になる
    
    window.addEventListener("devicemotion", (e) => {
        const acc = e.acceleration;
        if (!acc) return;
        const speed = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
        if (speed > 15) socket.emit('cmd', { type: 'shake', value: speed });
    });
    
    window.addEventListener("deviceorientation", (e) => {
        socket.emit('cmd', { type: 'tilt', value: Math.round(e.gamma || 0) });
    });
}

// 注ぐボタンの長押し設定
const pourBtn = document.getElementById('btn-pour');
if (pourBtn) {
    pourBtn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        socket.emit('cmd', { type: 'startPour' }); 
    });
    pourBtn.addEventListener('touchend', () => { 
        socket.emit('cmd', { type: 'stopPour' }); 
    });
}

function showTitleInput() {
    // タイトル入力はスマホだけで良いのでemitしない
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-title').classList.add('active');
}

function finishWork() {
    const title = document.getElementById('work-title').value || "おいしいジュース";
    socket.emit('cmd', { type: 'complete', title: title });
    changeScreen('gallery'); // 完成後に両方ギャラリーへ
}
