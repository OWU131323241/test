const socket = io();

// 共通送信関数（ここがPC側の switch と一致する必要があります）
function sendCmd(type, data = {}) {
    socket.emit('cmd', { type, ...data });
}

// 画面切り替え
function changeScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenId).classList.add('active');
    sendCmd('changeScreen', { screen: screenId });
}

// やりなおしボタン用
function resetMix() {
    sendCmd('reset');
}

// まぜるボタン
document.getElementById("startBtn").addEventListener("click", () => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then(state => {
            if (state === "granted") startMixing();
        });
    } else {
        startMixing();
    }
});

function startMixing() {
    changeScreen('shake');
    window.addEventListener("devicemotion", (e) => {
        const acc = e.acceleration;
        if (!acc) return;
        const speed = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
        if (speed > 15) sendCmd("shake", { value: speed });
    });
    window.addEventListener("deviceorientation", (e) => {
        sendCmd("tilt", { value: Math.round(e.gamma || 0) });
    });
}

// 注ぐボタン
const pourBtn = document.getElementById('btn-pour');
if (pourBtn) {
    pourBtn.addEventListener('touchstart', (e) => { e.preventDefault(); sendCmd('startPour'); });
    pourBtn.addEventListener('touchend', () => { sendCmd('stopPour'); });
}

function showTitleInput() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-title').classList.add('active');
}

function finishWork() {
    const title = document.getElementById('work-title').value || "おいしいジュース";
    sendCmd('complete', { title: title });
    changeScreen('gallery');
}
