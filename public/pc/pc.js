const socket = io();

// 1. 要素の取得
const layers = document.getElementById('layers');
const cupWrapper = document.getElementById('cup-wrapper');
const cupLid = document.getElementById('cup-lid');
const cupContainer = document.getElementById('cup-container');
const dispensers = document.querySelectorAll('.dispenser');
const drinkBar = document.getElementById('drink-bar');

// 2. 状態管理変数
let selectedIndex = 0;
let isPouring = false;
let pourInterval;
let mixProgress = 0;
let pouredColors = []; // 注いだ色をすべて記録する配列

// 3. 色の定義（RGB値）
// 青に少しだけ緑を混ぜることで、黄色と混ざった時に綺麗な緑になります
const colors = ['#ff0000', '#0050ff', '#ffff00', '#ffffff']; 
const colorMap = {
    '#ff0000': [255, 0, 0],     // 赤
    '#0050ff': [0, 80, 255],    // 青
    '#ffff00': [255, 255, 0],   // 黄
    '#ffffff': [255, 255, 255]  // 白
};

// 4. UI更新：選択中のディスペンサーに枠をつける
function updateSelection() {
    dispensers.forEach((d, i) => {
        d.classList.toggle('selected', i === selectedIndex);
    });
}

// 5. 液体を注ぐ処理
function pour() {
    if (layers.childElementCount > 200) return; // 溢れ防止
    const color = colors[selectedIndex];
    const layer = document.createElement('div');
    layer.className = 'layer';
    layer.style.backgroundColor = color;
    layer.style.height = '2px'; // 層を細かくして密度を上げる
    layers.appendChild(layer);
    
    // 注いだ色を記録（後で平均を計算するため）
    pouredColors.push(color);
}

// 6. 【最重要】色の混ざり方を計算（RGB加重平均）
function getMixedColor() {
    if (pouredColors.length === 0) return '#fff9c4'; // 空のときはコップの色

    let totalR = 0, totalG = 0, totalB = 0;

    // 記録された全データの色成分を合計
    pouredColors.forEach(c => {
        const rgb = colorMap[c];
        totalR += rgb[0];
        totalG += rgb[1];
        totalB += rgb[2];
    });

    // 平均値を算出（比率計算）
    const count = pouredColors.length;
    let r = Math.round(totalR / count);
    let g = Math.round(totalG / count);
    let b = Math.round(totalB / count);

    // 混ぜると暗くなりやすいため、少しだけ明るさを補正
    const brighten = 1.1; 
    r = Math.min(255, Math.round(r * brighten));
    g = Math.min(255, Math.round(g * brighten));
    b = Math.min(255, Math.round(b * brighten));

    return `rgb(${r}, ${g}, ${b})`;
}

// 7. 画面切り替え管理
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if (screenId === 'mix' || screenId === 'shake') {
        // 「つくる」「まぜる」の時はコップ画面を土台にする
        document.getElementById('screen-mix').classList.add('active');
        drinkBar.style.display = (screenId === 'mix') ? 'flex' : 'none';
        cupWrapper.style.transform = 'rotate(0deg)';
    } else {
        const target = document.getElementById('screen-' + screenId);
        if (target) target.classList.add('active');
    }
}

// 8. スマホからの命令(Socket.io)の処理
socket.on('cmd', (data) => {
    console.log("Received:", data.type, data);

    switch(data.type) {
        case 'changeScreen':
            goToScreen(data.screen);
            if (data.screen === 'home') location.reload();
            break;

        case 'move':
            selectedIndex = (selectedIndex + data.dir + colors.length) % colors.length;
            updateSelection();
            break;

        case 'reset':
            layers.innerHTML = '';
            pouredColors = [];
            cupContainer.style.backgroundColor = '#fff9c4';
            cupLid.style.top = '-40px';
            cupWrapper.style.transform = 'rotate(0deg)';
            mixProgress = 0;
            layers.style.opacity = '1';
            layers.style.filter = 'none';
            break;

        case 'startPour':
            isPouring = true;
            if (!pourInterval) pourInterval = setInterval(pour, 30);
            break;

        case 'stopPour':
            isPouring = false;
            clearInterval(pourInterval);
            pourInterval = null;
            break;

        case 'mixMode':
            goToScreen('shake');
            cupLid.style.top = '0';
            // ここで計算された混色をセット！
            cupContainer.style.backgroundColor = getMixedColor(); 
            break;

        case 'shake':
            mixProgress += 0.04;
            if (mixProgress > 1) mixProgress = 1;
            
            // 層をぼかして消していく演出
            layers.style.opacity = (1 - mixProgress).toString();
            layers.style.filter = `blur(${mixProgress * 12}px)`;
            
            // ガタガタ揺れるアニメーション
            const shakeX = (Math.random() - 0.5) * 35;
            const shakeRot = (Math.random() - 0.5) * 25;
            cupWrapper.style.transition = 'none';
            cupWrapper.style.transform = `translate(${shakeX}px, 0) rotate(${shakeRot}deg)`;
            
            clearTimeout(window.shakeTimeout);
            window.shakeTimeout = setTimeout(() => {
                cupWrapper.style.transition = 'transform 0.2s';
                cupWrapper.style.transform = `translate(0, 0) rotate(0deg)`;
            }, 60);
            break;

        case 'tilt':
            if (mixProgress > 0 && mixProgress < 1) {
                cupWrapper.style.transform = `rotate(${data.value * 0.5}deg)`;
            }
            break;

        case 'complete':
            saveWork(data.title);
            break;
    }
});

// 9. 作品を画像として保存してギャラリーへ
async function saveWork(title) {
    try {
        // html2canvasでコップの見た目を画像化
        const canvas = await html2canvas(cupContainer, { 
            backgroundColor: "#fff9c4",
            scale: 1 
        });
        const imgData = canvas.toDataURL('image/png');
        
        const grid = document.getElementById('gallery-grid');
        const card = document.createElement('div');
        card.className = 'work-card';
        card.innerHTML = `<img src="${imgData}"><p><strong>${title}</strong></p>`;
        grid.prepend(card); // 最新作を先頭に
        
        goToScreen('gallery');
    } catch (e) {
        console.error("Save failed", e);
        goToScreen('gallery');
    }
}

// 初期化
updateSelection();
