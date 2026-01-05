const socket = io();

// 共通の送信・画面切り替え関数
function changeScreen(screenId) {
    // 1. スマホの画面を切り替える
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenId).classList.add('active');
    
    // 2. PCの画面も切り替えるよう命令を送る
    socket.emit('cmd', { type: 'changeScreen', screen: screenId });
}

// --- 自分の作品ボタン用 ---
// HTMLの onclick="changeScreen('gallery')" でこの関数が呼ばれます

// --- センサー・まぜる関連 ---
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
    changeScreen('shake'); // ここでPCも一緒に切り替わる
    
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

// 注ぐボタン
const pourBtn = document.getElementById('btn-pour');
pourBtn.addEventListener('touchstart', (e) => { e.preventDefault(); socket.emit('cmd', { type: 'startPour' }); });
pourBtn.addEventListener('touchend', () => { socket.emit('cmd', { type: 'stopPour' }); });

function showTitleInput() {
    // タイトル入力画面へ（ここはスマホだけ切り替わればOK）
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-title').classList.add('active');
}

function finishWork() {
    const title = document.getElementById('work-title').value || "おいしいジュース";
    socket.emit('cmd', { type: 'complete', title: title });
    // 保存後はギャラリー画面へ（PCも連動）
    changeScreen('gallery');
}
