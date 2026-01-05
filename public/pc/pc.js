const socket = io();

const layers = document.getElementById('layers');
const cupWrapper = document.getElementById('cup-wrapper');
const cupLid = document.getElementById('cup-lid');
const cupContainer = document.getElementById('cup-container');
const dispensers = document.querySelectorAll('.dispenser');

let selectedIndex = 0;
let isPouring = false;
let pourInterval;
let mixProgress = 0; // 0: 混ざっていない, 1: 完全に混ざった
let pouredColors = []; // 注いだ色の履歴

// ディスペンサーの色設定
const colors = ['red', 'blue', 'yellow', 'white'];

function updateSelection() {
    dispensers.forEach((d, i) => {
        d.classList.toggle('selected', i === selectedIndex);
    });
}

// 液体を注ぐ
function pour() {
    if (layers.childElementCount > 120) return; // 満杯なら注がない
    
    const color = colors[selectedIndex];
    const layer = document.createElement('div');
    layer.className = 'layer';
    layer.style.backgroundColor = color;
    layer.dataset.color = color; // 計算用に色を保持
    layers.appendChild(layer);
    
    pouredColors.push(color);
}

// 平均色を計算する（RGB平均）
function calculateAverageColor() {
    if (pouredColors.length === 0) return 'transparent';
    
    const colorMap = {
        'red': [255, 0, 0],
        'blue': [0, 0, 255],
        'yellow': [255, 255, 0],
        'white': [255, 255, 255]
    };

    let r = 0, g = 0, b = 0;
    pouredColors.forEach(c => {
        r += colorMap[c][0];
        g += colorMap[c][1];
        b += colorMap[c][2];
    });

    const count = pouredColors.length;
    return `rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`;
}

socket.on('cmd', (data) => {
    switch(data.type) {
        case 'changeScreen':
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('screen-' + data.screen).classList.add('active');
            if (data.screen === 'home') location.reload();
            break;

        case 'move':
            selectedIndex = (selectedIndex + data.dir + colors.length) % colors.length;
            updateSelection();
            break;

        case 'startPour':
            isPouring = true;
            pourInterval = setInterval(pour, 50);
            break;

        case 'stopPour':
            isPouring = false;
            clearInterval(pourInterval);
            break;

        case 'mixMode':
            // 蓋を閉める
            cupLid.style.top = '0';
            // 混ざる前の「平均色」をコップの背景にセットしておく
            cupContainer.style.backgroundColor = calculateAverageColor();
            mixProgress = 0;
            break;

        case 'tilt':
            // スマホの傾き(gamma)をコップの回転に反映
            cupWrapper.style.transform = `rotate(${data.value * 0.6}deg)`;
            break;

        case 'shake':
            // 振るたびに混ざる進捗を上げる
            mixProgress += 0.05; 
            if (mixProgress > 1) mixProgress = 1;
            
            // 進捗に合わせて、層の透明度を下げる（＝背景の平均色が透けて見える）
            layers.style.opacity = 1 - mixProgress;
            // 少しブラー（ぼかし）をかけるとより混ざっている感が出る
            layers.style.filter = `blur(${mixProgress * 10}px)`;
            
            // 振っている間の液体の揺れ演出
            cupWrapper.style.transition = 'none';
            cupWrapper.style.marginTop = (Math.random() * 20 - 10) + 'px';
            setTimeout(() => { cupWrapper.style.marginTop = '0'; }, 50);
            break;

        case 'complete':
            saveWork(data.title);
            break;
    }
});

function saveWork(title) {
    html2canvas(document.getElementById('cup-wrapper'), { backgroundColor: null }).then(canvas => {
        const imgData = canvas.toDataURL();
        const grid = document.getElementById('gallery-grid');
        const card = document.createElement('div');
        card.className = 'work-card';
        card.innerHTML = `
            <img src="${imgData}">
            <p><strong>${title}</strong></p>
        `;
        grid.appendChild(card);
        
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-gallery').classList.add('active');
    });
}

updateSelection();
