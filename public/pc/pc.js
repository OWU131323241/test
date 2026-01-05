const socket = io();
const layersDiv = document.getElementById('layers');
const cupLid = document.getElementById('cup-lid');
const cupWrapper = document.getElementById('cup-wrapper');
const drinkBar = document.getElementById('drink-bar');

let colors = ['red', 'blue', 'yellow', 'white'];
let currentIndex = 0;
let pourInterval = null;
let mixLevel = 0; // 0: 層、100: 完全に混ざった

socket.on('cmd', (data) => {
    switch(data.type) {
        case 'changeScreen':
            if (document.getElementById('screen-' + data.screen)) {
                showScreen(data.screen);
                if(data.screen === 'gallery') loadGallery();
            }
            break;
        case 'move':
            currentIndex = (currentIndex + data.dir + 4) % 4;
            updateDispenser();
            break;
        case 'startPour':
            startPouring();
            break;
        case 'stopPour':
            stopPouring();
            break;
        case 'reset':
            layersDiv.innerHTML = '';
            mixLevel = 0;
            break;
        case 'mixMode':
            drinkBar.style.visibility = 'hidden';
            cupLid.style.top = '0px';
            cupWrapper.style.transition = "transform 0.1s linear";
            break;
        case 'tilt':
            // 傾きに連動（1.5倍ズームした状態で回転）
            cupWrapper.style.transform = `scale(1.5) rotate(${data.value}deg)`;
            break;
        case 'shake':
            processMix(data.value);
            break;
        case 'complete':
            saveCupAsWork(data.title);
            break;
    }
});

function processMix(speed) {
    mixLevel += speed * 0.1;
    const allLayers = document.querySelectorAll('.layer');
    
    allLayers.forEach((l) => {
        // 振るほど「ぼかし」が強くなり、層が溶けていく
        const blurVal = mixLevel / 4;
        const opacityVal = 1 - (mixLevel / 200); // 振るほど個別の層が薄くなる
        l.style.filter = `blur(${blurVal}px)`;
        l.style.opacity = opacityVal;
        
        // 振るほど層が伸びて混ざり合う
        if (mixLevel > 20) {
            l.style.transform = `translateY(${(Math.random()-0.5) * mixLevel}px) scaleY(${1 + mixLevel/50})`;
        }
    });

    // 背景に「混ざり合った後の色」をうっすら表示させる
    if (mixLevel > 5) {
        const targetColor = getAverageColor();
        layersDiv.style.backgroundColor = targetColor;
        // 背景の透明度を振るほど濃くする
        layersDiv.style.opacity = Math.min(mixLevel / 100, 1);
    }
}

// 注がれた色の平均を計算する簡易関数
function getAverageColor() {
    const layers = document.querySelectorAll('.layer');
    if (layers.length === 0) return "#fff9c4";
    // 簡易的に最後の色と最初の色の間くらいの色をイメージ（実際はもっと複雑ですが演出用）
    return layers[Math.floor(layers.length / 2)].style.backgroundColor;
}

// （以下、showScreen, updateDispenser, startPouringなどは以前のコードと同じ）
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    if(id === 'mix') {
        drinkBar.style.visibility = 'visible';
        cupLid.style.top = '-30px';
        cupWrapper.style.transform = 'scale(1)';
        layersDiv.innerHTML = '';
        layersDiv.style.backgroundColor = "transparent";
        mixLevel = 0;
    }
}
function updateDispenser() {
    document.querySelectorAll('.dispenser').forEach((d, i) => {
        d.classList.toggle('selected', i === currentIndex);
    });
}
function startPouring() {
    if(pourInterval) return;
    pourInterval = setInterval(() => {
        const layer = document.createElement('div');
        layer.className = 'layer';
        layer.style.backgroundColor = colors[currentIndex];
        layersDiv.appendChild(layer);
    }, 50);
}
function stopPouring() { clearInterval(pourInterval); pourInterval = null; }
async function saveCupAsWork(title) {
    const canvas = await html2canvas(document.getElementById('cup-container'));
    localStorage.setItem('works', JSON.stringify([...JSON.parse(localStorage.getItem('works') || '[]'), { title, image: canvas.toDataURL(), id: Date.now() }]));
}
function loadGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    [...JSON.parse(localStorage.getItem('works') || '[]')].reverse().forEach(w => {
        const div = document.createElement('div');
        div.className = 'work-card';
        div.innerHTML = `<img src="${w.image}"><p><strong>${w.title}</strong></p><button onclick="deleteWork(${w.id})">削除</button>`;
        grid.appendChild(div);
    });
}
window.deleteWork = (id) => {
    localStorage.setItem('works', JSON.stringify(JSON.parse(localStorage.getItem('works') || '[]').filter(w => w.id !== id)));
    loadGallery();
};