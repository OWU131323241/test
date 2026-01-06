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

const colors = ['#ff3e3e', '#3e3eff', '#ffeb3b', '#ffffff']; // CSSの色に合わせる
const colorMap = {
    '#ff3e3e': [255, 62, 62],
    '#3e3eff': [62, 62, 255],
    '#ffeb3b': [255, 235, 59],
    '#ffffff': [255, 255, 255]
};

function updateSelection() {
    dispensers.forEach((d, i) => {
        d.classList.toggle('selected', i === selectedIndex);
    });
}

function pour() {
    if (layers.childElementCount > 180) return;
    const color = colors[selectedIndex];
    const layer = document.createElement('div');
    layer.className = 'layer';
    layer.style.backgroundColor = color;
    layer.style.height = '3px';
    layers.appendChild(layer);
    pouredColors.push(color);
}

function getMixedColor() {
    if (pouredColors.length === 0) return '#fff9c4';
    let r = 0, g = 0, b = 0;
    pouredColors.forEach(c => {
        const rgb = colorMap[c];
        r += rgb[0]; g += rgb[1]; b += rgb[2];
    });
    const count = pouredColors.length;
    return `rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`;
}

// 画面切り替え（コップを消さない工夫）
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');

    // ★重要：mix画面とshake画面の両方でコップを表示し続ける
    const mixScreen = document.getElementById('screen-mix');
    const shakeScreen = document.getElementById('screen-shake');
    
    if (screenId === 'mix' || screenId === 'shake') {
        mixScreen.classList.add('active'); // mix画面を土台として表示し続ける
        document.getElementById('drink-bar').style.display = (screenId === 'mix') ? 'flex' : 'none';
    }
}

socket.on('cmd', (data) => {
    switch(data.type) {
        case 'changeScreen':
            goToScreen(data.screen);
            if (data.screen === 'home') location.reload();
            break;

        case 'move':
            // ★修正：左右移動が確実に動くように
            selectedIndex = (selectedIndex + data.dir + colors.length) % colors.length;
            updateSelection();
            break;

        case 'reset':
            // ★修正：やり直しボタン
            layers.innerHTML = '';
            pouredColors = [];
            cupContainer.style.backgroundColor = '#fff9c4';
            cupLid.style.top = '-40px';
            mixProgress = 0;
            layers.style.opacity = '1';
            layers.style.filter = 'none';
            break;

        case 'startPour':
            isPouring = true;
            if (!pourInterval) pourInterval = setInterval(pour, 40);
            break;

        case 'stopPour':
            isPouring = false;
            clearInterval(pourInterval);
            pourInterval = null;
            break;

        case 'mixMode':
            // 振るモードへの移行
            goToScreen('shake');
            cupLid.style.top = '0';
            cupContainer.style.backgroundColor = getMixedColor(); 
            mixProgress = 0;
            break;

        case 'shake':
            mixProgress += 0.05;
            if (mixProgress > 1) mixProgress = 1;
            
            layers.style.opacity = (1 - mixProgress).toString();
            layers.style.filter = `blur(${mixProgress * 15}px)`;
            
            // 激しい揺れアニメーション
            const shakeX = (Math.random() - 0.5) * 40;
            const shakeY = (Math.random() - 0.5) * 40;
            const shakeRot = (Math.random() - 0.5) * 30;
            
            cupWrapper.style.transition = 'none';
            cupWrapper.style.transform = `translate(${shakeX}px, ${shakeY}px) rotate(${shakeRot}deg)`;
            
            clearTimeout(window.shakeTimeout);
            window.shakeTimeout = setTimeout(() => {
                cupWrapper.style.transition = 'transform 0.3s';
                cupWrapper.style.transform = `translate(0, 0) rotate(0deg)`;
            }, 80);
            break;

        case 'tilt':
            if (mixProgress < 0.2) {
                cupWrapper.style.transition = 'transform 0.1s';
                cupWrapper.style.transform = `rotate(${data.value * 0.6}deg)`;
            }
            break;

        case 'complete':
            saveWork(data.title);
            break;
    }
});

async function saveWork(title) {
    const canvas = await html2canvas(cupContainer, { backgroundColor: "#fff9c4" });
    const imgData = canvas.toDataURL('image/png');
    const grid = document.getElementById('gallery-grid');
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `<img src="${imgData}"><p><strong>${title}</strong></p>`;
    grid.prepend(card);
    goToScreen('gallery');
}

updateSelection();
