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
    layer.style.height = '3px';
    layers.appendChild(layer);
    pouredColors.push(color);
}

function getMixedColor() {
    if (pouredColors.length === 0) return '#fff9c4'; // デフォルト色
    let r = 0, g = 0, b = 0;
    pouredColors.forEach(c => {
        r += colorMap[c][0];
        g += colorMap[c][1];
        b += colorMap[c][2];
    });
    const count = pouredColors.length;
    return `rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`;
}

// ★画面切り替えを確実に行う共通関数
function goToScreen(screenId) {
    console.log("Moving to screen:", screenId);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + screenId);
    if (target) {
        target.classList.add('active');
    } else {
        console.error("Screen not found:", screenId);
    }
}

socket.on('cmd', (data) => {
    switch(data.type) {
        case 'changeScreen':
            // スマホから届いた screenId にPCの画面も合わせる
            console.log("PC Screen changing to:", data.screen);
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const target = document.getElementById('screen-' + data.screen);
            if (target) target.classList.add('active');
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
            cupContainer.style.backgroundColor = getMixedColor(); 
            mixProgress = 0;
            layers.style.opacity = '1';
            break;

case 'shake':
            // 1. 混ざり具合を更新
            mixProgress += 0.05;
            if (mixProgress > 1) mixProgress = 1;
            
            // 2. 色の見た目を変更（層をぼかして透明にする）
            layers.style.opacity = (1 - mixProgress).toString();
            layers.style.filter = `blur(${mixProgress * 15}px)`;
            
            // 3. ★ガタガタ揺れるアニメーションを強化★
            // 振るたびにランダムな方向に瞬間的にずらす
            const shakeX = (Math.random() - 0.5) * 30; // 左右に最大15px
            const shakeY = (Math.random() - 0.5) * 30; // 上下に最大15px
            const shakeRot = (Math.random() - 0.5) * 20; // 最大10度回転
            
            cupWrapper.style.transition = 'none'; // 振っている間は即座に反応させる
            cupWrapper.style.transform = `translate(${shakeX}px, ${shakeY}px) rotate(${shakeRot}deg)`;
            
            // 振るのを止めた時にスッと戻るように、少し後に戻す処理を入れる
            clearTimeout(window.shakeTimeout);
            window.shakeTimeout = setTimeout(() => {
                cupWrapper.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                cupWrapper.style.transform = `translate(0, 0) rotate(0deg)`;
            }, 100);
            break;

        case 'tilt':
            // 4. 傾きアニメーション（混ぜている最中は少しだけ、混ぜる前はしっかり傾く）
            if (!isPouring) { // 注いでいない時だけ傾きに反応
                const tiltEffect = mixProgress > 0.8 ? 0.2 : 0.6; // 混ざるほど重くなって傾かなくなる演出
                cupWrapper.style.transition = 'transform 0.1s linear';
                cupWrapper.style.transform = `rotate(${data.value * tiltEffect}deg)`;
            }
            break;

        case 'complete':
            // ★保存処理を呼び出す
            saveWork(data.title);
            break;
    }
});

// ★保存とギャラリー移動をセットにした関数
async function saveWork(title) {
    console.log("Saving work...");
    try {
        // 画像化の前に少し待つ（描画を安定させるため）
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // cup-containerを画像にする
        const canvas = await html2canvas(cupContainer, {
            backgroundColor: "#fff9c4",
            scale: 1,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const grid = document.getElementById('gallery-grid');
        
        // カード作成
        const card = document.createElement('div');
        card.className = 'work-card';
        card.innerHTML = `<img src="${imgData}"><p><strong>${title}</strong></p>`;
        grid.prepend(card); // 新しいものを上に追加

        console.log("Save complete, moving to gallery.");
        // 保存が終わってから画面を切り替える
        goToScreen('gallery');

    } catch (err) {
        console.error("Save error:", err);
        // エラーが起きてもとりあえずギャラリーには移動させる
        goToScreen('gallery');
    }
}

updateSelection();


