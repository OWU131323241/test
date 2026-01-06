const socket = io();

// 要素の取得
const layers = document.getElementById('layers');
const cupWrapper = document.getElementById('cup-wrapper');
const cupLid = document.getElementById('cup-lid');
const cupContainer = document.getElementById('cup-container');
const dispensers = document.querySelectorAll('.dispenser');
const drinkBar = document.getElementById('drink-bar');

let selectedIndex = 0;
let isPouring = false;
let pourInterval;
let mixProgress = 0;
let pouredColors = [];

const colors = ['#ff3e3e', '#3e3eff', '#ffeb3b', '#ffffff'];
const colorMap = {
    '#ff3e3e': [255, 62, 62],
    '#3e3eff': [62, 62, 255],
    '#ffeb3b': [255, 235, 59],
    '#ffffff': [255, 255, 255]
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

// 命令の受け取り
// (変数の定義などはそのまま)

socket.on('cmd', (data) => {
    switch(data.type) {
        case 'changeScreen':
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            if (data.screen === 'mix' || data.screen === 'shake') {
                document.getElementById('screen-mix').classList.add('active');
                drinkBar.style.display = (data.screen === 'mix') ? 'flex' : 'none';
                cupWrapper.style.transform = 'rotate(0deg)';
            } else {
                const target = document.getElementById('screen-' + data.screen);
                if (target) target.classList.add('active');
            }
            break;

        case 'move':
            // 確実にインデックスを更新して枠を動かす
            selectedIndex = (selectedIndex + data.dir + colors.length) % colors.length;
            updateSelection();
            console.log("Selected index:", selectedIndex);
            break;

        case 'reset':
            // 全てを初期化
            layers.innerHTML = '';
            pouredColors = [];
            cupContainer.style.backgroundColor = '#fff9c4';
            cupLid.style.top = '-40px';
            cupWrapper.style.transform = 'rotate(0deg)';
            mixProgress = 0;
            layers.style.opacity = '1';
            layers.style.filter = 'none';
            console.log("Mix reset done.");
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
            cupLid.style.top = '0';
            cupContainer.style.backgroundColor = getMixedColor(); 
            drinkBar.style.display = 'none';
            break;

        case 'shake':
            mixProgress += 0.05;
            if (mixProgress > 1) mixProgress = 1;
            layers.style.opacity = (1 - mixProgress).toString();
            layers.style.filter = `blur(${mixProgress * 10}px)`;
            const shakeX = (Math.random() - 0.5) * 30;
            const shakeRot = (Math.random() - 0.5) * 20;
            cupWrapper.style.transition = 'none';
            cupWrapper.style.transform = `translate(${shakeX}px, 0) rotate(${shakeRot}deg)`;
            clearTimeout(window.shakeTimeout);
            window.shakeTimeout = setTimeout(() => {
                cupWrapper.style.transition = 'transform 0.2s';
                cupWrapper.style.transform = `translate(0, 0) rotate(0deg)`;
            }, 50);
            break;

        case 'tilt':
            if (mixProgress > 0) {
                cupWrapper.style.transform = `rotate(${data.value * 0.5}deg)`;
            }
            break;

        case 'complete':
            saveWork(data.title);
            break;
    }
});
// 保存処理（前と同じ）
async function saveWork(title) {
    const canvas = await html2canvas(cupContainer, { backgroundColor: "#fff9c4" });
    const imgData = canvas.toDataURL('image/png');
    const grid = document.getElementById('gallery-grid');
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `<img src="${imgData}"><p><strong>${title}</strong></p>`;
    grid.prepend(card);
    // 全体を隠してギャラリーを表示
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-gallery').classList.add('active');
}
updateSelection();

