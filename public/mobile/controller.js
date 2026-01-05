const socket = io();

function sendCmd(type, data = {}) {
    socket.emit('cmd', { type, ...data });
}

// ★修正：スマホとPC両方の画面を切り替える
function changeScreen(screenId) {
    // スマホ側の表示切り替え
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenId).classList.add('active');
    // PC側へ命令を送信
    sendCmd('changeScreen', { screen: screenId });
}

// まぜるボタン
document.getElementById("startBtn").addEventListener("click", () => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then(state => {
            if (state === "granted") {
                startMixing();
            }
        });
    } else {
        startMixing();
    }
});

function startMixing() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-shake').classList.add('active');
    sendCmd('mixMode');
    
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
pourBtn.addEventListener('touchstart', (e) => { e.preventDefault(); sendCmd('startPour'); });
pourBtn.addEventListener('touchend', () => { sendCmd('stopPour'); });

function showTitleInput() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-title').classList.add('active');
}

function finishWork() {
    const title = document.getElementById('work-title').value || "おいしいジュース";
    sendCmd('complete', { title: title });
    // 保存後はスマホもギャラリー画面へ
    changeScreen('gallery');
}
