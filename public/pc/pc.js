// (上部の変数定義はそのまま)

socket.on('cmd', (data) => {
    switch(data.type) {
        case 'changeScreen':
            goToScreen(data.screen);
            // 注ぐ画面(mix)に戻ったときは傾きを強制リセット
            if (data.screen === 'mix' || data.screen === 'home') {
                cupWrapper.style.transform = 'rotate(0deg)';
                mixProgress = 0;
            }
            if (data.screen === 'home') location.reload();
            break;

        case 'move':
            // 左右ボタンの反応を確実に
            selectedIndex = (selectedIndex + data.dir + colors.length) % colors.length;
            updateSelection();
            break;

        case 'reset':
            // やり直し：中身を空にして傾きも直す
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
            goToScreen('shake');
            cupLid.style.top = '0';
            cupContainer.style.backgroundColor = getMixedColor(); 
            break;

        case 'shake':
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
            // ★修正：振るモード(shake)の時だけ傾くように制限する
            // これで注ぐ画面で斜めになるのを防ぎます
            const currentScreen = document.querySelector('.screen.active').id;
            if (currentScreen === 'screen-mix' && mixProgress > 0) {
                 // 混ぜ始めたら少し傾く
                 cupWrapper.style.transform = `rotate(${data.value * 0.5}deg)`;
            } else if (currentScreen === 'screen-shake') {
                 cupWrapper.style.transform = `rotate(${data.value * 0.8}deg)`;
            }
            break;

        case 'complete':
            saveWork(data.title);
            break;
    }
});
