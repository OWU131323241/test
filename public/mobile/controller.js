const socket = io();

// 1. 命令を送るための基本関数
function sendCmd(type, data = {}) {
    console.log("Sending:", type, data); // スマホのログで確認用
    socket.emit('cmd', { type, ...data });
}

// 2. 画面切り替え関数
window.changeScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
    sendCmd('changeScreen', { screen: screenId });
};

// 3. ボタンに直接命令を覚えさせる（HTMLの onclick が動かなくても大丈夫なように）
document.addEventListener('DOMContentLoaded', () => {
    // 左ボタン（HTMLに id="btn-left" をつけるか、既存のボタンを想定）
    const leftBtn = document.querySelector('[onclick*="moveSelection(-1)"]');
    if (leftBtn) {
        leftBtn.onclick = null; // 古い設定を消す
        leftBtn.addEventListener('click', () => sendCmd('move', { dir: -1 }));
    }

    // 右ボタン
    const rightBtn = document.querySelector('[onclick*="moveSelection(1)"]');
    if (rightBtn) {
        rightBtn.onclick = null;
        rightBtn.addEventListener('click', () => sendCmd('move', { dir: 1 }));
    }

    // やり直しボタン
    const resetBtn = document.querySelector('[onclick*="resetMix"]');
    if (resetBtn) {
        resetBtn.onclick = null;
        resetBtn.addEventListener('click', () => sendCmd('reset'));
    }
});

// --- 以下、既存の「まぜる」「注ぐ」などの機能 ---
document.getElementById("startBtn").addEventListener("click", () => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then(state => {
            if (state === "granted") startMixing();
        });
    } else { startMixing(); }
});

function startMixing() {
    window.changeScreen('shake');
    sendCmd('mixMode');
    window.addEventListener("devicemotion", (e) => {
        const acc = e.acceleration;
        if (!acc) return;
        const speed = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
        if (speed > 15) sendCmd('shake', { value: speed });
    });
    window.addEventListener("deviceorientation", (e) => {
        sendCmd('tilt', { value: Math.round(e.gamma || 0) });
    });
}

const pourBtn = document.getElementById('btn-pour');
if (pourBtn) {
    pourBtn.addEventListener('touchstart', (e) => { e.preventDefault(); sendCmd('startPour'); });
    pourBtn.addEventListener('touchend', () => { sendCmd('stopPour'); });
}

window.showTitleInput = function() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-title').classList.add('active');
};

window.finishWork = function() {
    const title = document.getElementById('work-title').value || "おいしいジュース";
    sendCmd('complete', { title: title });
    window.changeScreen('gallery');
};
