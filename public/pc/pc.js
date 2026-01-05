const socket = io();
const layers = document.getElementById('layers');
const cupWrapper = document.getElementById('cup-wrapper');
const cupLid = document.getElementById('cup-lid');
const cupContainer = document.getElementById('cup-container');
const dispensers = document.querySelectorAll('.dispenser');

let selectedIndex = 0;
let isPouring = false;
let pourInterval;
let mixProgress = 0;
let pouredColors = [];

const colors = ['red', 'blue', 'yellow', 'white'];
const colorMap = {
    'red': [255, 30, 30],
    'blue': [30, 30, 255],
    'yellow': [255, 235, 0],
    'white': [255, 255, 255]
};

function updateSelection() {
    dispensers.forEach((d, i) => d.classList.toggle('selected', i === selectedIndex));
}

function pour() {
    if (layers.childElementCount > 180) return;
    const color = colors[selectedIndex];
    const layer = document.createElement('div');
    layer.className = 'layer';
    layer.style.backgroundColor = color;
    layer.style.height = '3px'; // 層を少し厚くして計算負荷を軽減
    layers.appendChild(layer);
    pouredColors.push(color);
}

// ★修正：正しい混色アルゴリズム（比率計算）
function getMixedColor() {
    if (pouredColors.length === 0) return 'transparent';
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
            // ★修正：PC側の画面遷移を確実に行う
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const targetScreen = document.getElementById('screen-' + data.screen);
            if(targetScreen) targetScreen.classList.add('active');
            if (data.screen === 'home') location.reload();
            break;

        case 'move':
            selectedIndex = (selectedIndex + data.dir + colors.length) % colors.length;
            updateSelection();
            break;

        case 'startPour':
            isPouring = true;
            pourInterval = setInterval(pour, 40);
            break;

        case 'stopPour':
            isPouring = false;
            clearInterval(pourInterval);
            break;

        case 'mixMode':
            cupLid.style.top = '0';
            // ★修正：背景色ではなく、液体そのものの色として混ぜる
            const finalColor = getMixedColor();
            cupContainer.style.backgroundColor = finalColor; 
            mixProgress = 0;
            layers.style.opacity = '1';
            break;

        case 'shake':
            mixProgress += 0.04;
            if (mixProgress > 1) mixProgress = 1;
            // 層を透明にしていき、下の「計算された混色」を見せる
            layers.style.opacity = (1 - mixProgress).toString();
            layers.style.filter = `blur(${mixProgress * 15}px)`;
            // 揺れ演出
            cupWrapper.style.transform = `rotate(${Math.sin(Date.now()*0.02)*15}deg) translateY(${Math.random()*10}px)`;
            break;

        case 'tilt':
            if (mixProgress < 0.1) { // 混ぜる前だけ傾く
                cupWrapper.style.transform = `rotate(${data.value * 0.5}deg)`;
            }
            break;

        case 'complete':
            saveWork(data.title);
            break;
    }
});

function saveWork(title) {
    // ★修正：保存範囲をcup-containerに絞り、背景色を維持
    html2canvas(cupContainer, {
        backgroundColor: "#fff9c4", // コップの色
        scale: 1
    }).then(canvas => {
        const imgData = canvas.toDataURL();
        const grid = document.getElementById('gallery-grid');
        const card = document.createElement('div');
        card.className = 'work-card';
        card.innerHTML = `<img src="${imgData}"><p><strong>${title}</strong></p>`;
        grid.appendChild(card);
        
        // 画面をギャラリーへ
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-gallery').classList.add('active');
    });
}
updateSelection();
