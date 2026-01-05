const socket = io();

// センサーの値を処理して送信する関数
function handleOrientation(e) {
  socket.emit("cmd", { type: "tilt", value: Math.round(e.gamma || 0) });
  
  const acc = e.acceleration;
  if (acc) {
    const speed = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    if (speed > 15) socket.emit("cmd", { type: "shake", value: speed });
  }
}

// まぜるボタン（許可を求める）
document.getElementById("startBtn").addEventListener("click", () => {
  // iOSのセンサー許可リクエスト
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then(state => {
        if (state === "granted") {
          // 許可されたらセンサー開始
          window.addEventListener("deviceorientation", handleOrientation, true);
          window.addEventListener("devicemotion", handleOrientation, true);
          
          // 画面切り替え
          document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
          document.getElementById('screen-shake').classList.add('active');
          socket.emit("cmd", { type: "mixMode" });
        } else {
          alert("HTTPS（安全な接続）でないため、ブラウザがセンサーをブロックしました。");
        }
      })
      .catch(err => alert("エラー: " + err));
  } else {
    // Androidなどはそのまま開始
    window.addEventListener("deviceorientation", handleOrientation, true);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-shake').classList.add('active');
    socket.emit("cmd", { type: "mixMode" });
  }
});

// --- その他の基本機能 ---
function sendCmd(type, data = {}) { socket.emit('cmd', { type, ...data }); }
function changeScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screenId).classList.add('active');
  sendCmd('changeScreen', { screen: screenId });
}
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
  location.reload();
}