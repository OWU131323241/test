const socket = io();

// (layers, cupWrapper, 等の要素取得は以前のままとします)

socket.on('cmd', (data) => {
    switch(data.type) {
        case 'changeScreen':
            // スマホからの命令で画面を切り替える
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const target = document.getElementById('screen-' + data.screen);
            
            // 注ぐ画面(mix)やホーム(home)ではコップを真っ直ぐにする
            if (data.screen === 'mix' || data.screen === 'home') {
                cupWrapper.style.transition = 'transform 0.5s';
                cupWrapper.style.transform = 'rotate(0deg)';
                if (data.screen === 'mix') {
                    document.getElementById('screen-mix').classList.add('active');
                    document.getElementById('drink-bar').style.display = 'flex';
                }
            }
            if (target) target.classList.add('active');
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

        case 'shake':
            // ふるアニメーション（コップの中身を混ぜる）
            mixProgress += 0.05;
            if (mixProgress > 1) mixProgress = 1;
            layers.style.opacity = (1 - mixProgress).toString();
            layers.style.filter = `blur(${mixProgress * 15}px)`;
            
            // 激しい揺れ
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
            // 混ぜている最中か、ふる画面のときだけ傾く
            const currentActive = document.querySelector('.screen.active');
            if (currentActive && (currentActive.id === 'screen-shake' || mixProgress > 0)) {
                cupWrapper.style.transition = 'transform 0.1s';
                cupWrapper.style.transform = `rotate(${data.value * 0.6}deg)`;
            }
            break;

        case 'complete':
            saveWork(data.title);
            break;
    }
});
