const socket = io();
// (要素取得部分は以前のまま)

socket.on('cmd', (data) => {
    console.log("Received command:", data.type, data); // ←ここで届いているか確認できる

    switch(data.type) {
        case 'changeScreen':
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            if (data.screen === 'mix' || data.screen === 'shake') {
                document.getElementById('screen-mix').classList.add('active');
                document.getElementById('drink-bar').style.display = (data.screen === 'mix') ? 'flex' : 'none';
            } else {
                const target = document.getElementById('screen-' + data.screen);
                if (target) target.classList.add('active');
            }
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
            cupLid.style.top = '0';
            cupContainer.style.backgroundColor = getMixedColor(); 
            document.getElementById('drink-bar').style.display = 'none';
            break;

        case 'shake':
            mixProgress += 0.05;
            if (mixProgress > 1) mixProgress = 1;
            layers.style.opacity = (1 - mixProgress).toString();
            layers.style.filter = `blur(${mixProgress * 10}px)`;
            const shakeX = (Math.random() - 0.5) * 30;
            const shakeRot = (Math.random() - 0.5) * 20;
            cupWrapper.style.transform = `translate(${shakeX}px, 0) rotate(${shakeRot}deg)`;
            clearTimeout(window.shakeTimeout);
            window.shakeTimeout = setTimeout(() => {
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
