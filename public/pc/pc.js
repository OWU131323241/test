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
socket.on('cmd', (data) => {
    switch(data.type) {
        case 'changeScreen':
            // 全画面を一旦隠す
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            
            if (data.screen === 'mix' || data.screen === 'shake') {
                // 「つくる」か「まぜる」の時は、制作画面(screen-mix)を出す
                document.getElementById('screen-mix').classList.add('active');
                // ディスペンサーは「つくる(mix)」の時だけ出す
                drinkBar.style.display = (data.screen === 'mix') ? 'flex' : 'none';
                // 容器を真っ直ぐに戻す
                cupWrapper.style.transform = 'rotate(0deg)';
            } else {
                // ホームやギャラリーはそのまま表示
                const target = document.getElementById('screen-' + data.screen);
                if (target) target.classList.add('active');
            }
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
            if (!pourInterval) pourInterval = setInterval(pour, 40);
            break;

        case 'stopPour':
            isPouring = false;
            clearInterval(pourInterval);
            pourInterval = null;
            break;

        case 'mixMode':
            // 振るモード：蓋を閉めて色を計算
            cupLid.style.top = '0';
            cupContainer.style.backgroundColor = getMixedColor(); 
            drinkBar.style.display = 'none'; // ディスペンサーを隠す
            break;

        case 'shake':
            mixProgress += 0.05;
            if (mixProgress > 1) mixProgress = 1;
            layers.style.opacity = (1 - mixProgress).toString();
            layers.style.filter = `blur(${mixProgress * 10}px)`;
            
            // ガタガタ揺れる演出
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
            // 振っているときだけ少し傾ける
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
