tsParticles.load("particles-bg", {
        fullScreen: { enable: false },
        background: { color: { value: "transparent" } },
        particles: {
            number: { value: 60 },
            color: { value: ["#6366f1", "#60a5fa", "#f59e42"] },
            shape: { type: "circle" },
            opacity: { value: 0.25 },
            size: { value: { min: 2, max: 5 } },
            move: { enable: true, speed: 1.2, direction: "none", outModes: "bounce" },
            links: { enable: true, distance: 120, color: "#6366f1", opacity: 0.13, width: 1 }
        },
        detectRetina: true
    });

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.onclick = () => {
        document.body.classList.toggle('dark');
        themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    };
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = '☀️';
    }

    let nickname = localStorage.getItem('nickname') || '';
    if (!nickname) {
        nickname = prompt('Введите ваш никнейм (от 2 до 16 символов):', 'Гость') || 'Гость';
        nickname = nickname.substring(0, 16);
        localStorage.setItem('nickname', nickname);
    }
    function getAvatar(nick) {
        const color = nick.charCodeAt(0) % 2 === 0 ? 'linear-gradient(135deg,#6366f1,#60a5fa)' : 'linear-gradient(135deg,#f59e42,#fbbf24)';
        return `<span class="avatar" style="background:${color}">${nick[0].toUpperCase()}</span>`;
    }

    const onlineList = document.getElementById('online-list');
    function updateOnlineList() {
        onlineList.innerHTML = '';
        const li = document.createElement('li');
        li.innerHTML = getAvatar(nickname) + ' ' + nickname;
        onlineList.appendChild(li);
    }
    updateOnlineList();

    const chat = document.getElementById('chat');
    const msg = document.getElementById('msg');
    const send = document.getElementById('send');
    const ws = new WebSocket(`ws://${location.host}/ws`);

    function addMsg(text, nick = '', isMe = false) {
        const div = document.createElement('div');
        div.className = 'msg' + (isMe ? ' me' : '');
        div.innerHTML = getAvatar(nick || nickname) + `<div><div class="nick">${nick || nickname}</div><div class="bubble">${text}</div></div>`;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    }

    ws.onmessage = function(event) {
        let data;
        try { data = JSON.parse(event.data); } catch { data = {text: event.data, nick: 'Гость'}; }
        addMsg(data.text || event.data, data.nick || 'Гость', data.nick === nickname);
        if (data.nick !== nickname) playSound(sndRecv);
    };

    msg.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendMsg();
        if (e.key === '/' && msg.value === '') {
            showCommandHint();
        }
    });
    function showCommandHint() {
        const hint = document.createElement('div');
        hint.style.position = 'absolute';
        hint.style.left = msg.getBoundingClientRect().left + 'px';
        hint.style.top = (msg.getBoundingClientRect().top - 38) + 'px';
        hint.style.background = '#fff';
        hint.style.color = '#6366f1';
        hint.style.borderRadius = '8px';
        hint.style.boxShadow = '0 2px 8px rgba(80,120,255,0.13)';
        hint.style.padding = '6px 16px';
        hint.style.fontSize = '1em';
        hint.style.zIndex = 1001;
        hint.textContent = '/clear — очистить чат';
        document.body.appendChild(hint);
        setTimeout(()=>{ if(document.body.contains(hint)) document.body.removeChild(hint); }, 2000);
    }
    function sendMsg() {
        const text = msg.value.trim();
        if (text !== '') {
            if (text === '/clear') {
                chat.innerHTML = '';
                msg.value = '';
                return;
            }
            ws.send(JSON.stringify({text, nick: nickname}));
            msg.value = '';
            playSound(sndSend);
        }
    }

    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const emojis = [
        '😀','😂','😍','😎','😜','😭','😡','👍','🙏','🎉','🔥','💯','🥳','😇','😏','😱','🤔','😅','😋','😢','😤','😈','🤡','👻','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
        '🍕','🍔','🍟','🌭','🍿','🍩','🍪','🍫','🍬','🍭','🍦','🍰','🎂','🍎','🍉','🍓','🍒','🍇','🍌','🍍','🥝','🥑','🥦','🥕','🌽','🍆','🥔','🥨','🥐','🥯','🥞','🧇','🍗','🍖','🍤','🍣','🍱','🍛','🍜','🍝','🍚','🍙','🍘','🍥','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🍰','🧁','🍮','🍯','🥛','🍼','☕','🍵','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🍾','🥄','🍴','🍽️','🥢','🥡','🥤','🧃','🧉','🧊',
        '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🛵','🏍️','🚲','🛴','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢',
        '⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥅','🏒','🏑','🥍','🏏','⛳','🏹','🎣','🤿','🥊','🥋','🎽','⛸️','🥌','🛷','🛹','🎿','⛷️','🏂','🏋️‍♂️','🏋️‍♀️','🤼‍♂️','🤼‍♀️','🤸‍♂️','🤸‍♀️','⛹️‍♂️','⛹️‍♀️','🤺','🤾‍♂️','🤾‍♀️','🏌️‍♂️','🏌️‍♀️','🏇','🧘‍♂️','🧘‍♀️','🏄‍♂️','🏄‍♀️','🏊‍♂️','🏊‍♀️','🤽‍♂️','🤽‍♀️','🚣‍♂️','🚣‍♀️','🧗‍♂️','🧗‍♀️','🚵‍♂️','🚵‍♀️','🚴‍♂️','🚴‍♀️','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹‍♂️','🤹‍♀️','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','♟️','🎯','🎳','🎮','🎰'
    ];
    emojiPicker.innerHTML = emojis.map(e=>`<span>${e}</span>`).join('');
    emojiBtn.onclick = () => {
        emojiPicker.style.display = emojiPicker.style.display === 'flex' ? 'none' : 'flex';
        emojiPicker.style.flexWrap = 'wrap';
    };
    emojiPicker.onclick = e => {
        if (e.target.tagName === 'SPAN') {
            msg.value += e.target.textContent;
            msg.focus();
        }
    };
    document.body.addEventListener('click', e => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) emojiPicker.style.display = 'none';
    });

    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    const box = 20;
    let snake, food, dir, score, game, started = false;

    const snakeSkinSelect = document.getElementById('snake-skin');
    const snakeSkins = {
        classic: { head: '#6366f1', body: '#a5b4fc', food: '#f59e42' },
        neon:    { head: '#00fff7', body: '#00bfff', food: '#ff00e6' },
        red:     { head: '#ef4444', body: '#fca5a5', food: '#f59e42' },
        green:   { head: '#22c55e', body: '#bbf7d0', food: '#f59e42' },
        rainbow: { head: '#f59e42', body: '#6366f1', food: '#22d3ee' }
    };
    function getSnakeSkin() {
        return localStorage.getItem('snakeSkin') || 'classic';
    }
    function setSnakeSkin(skin) {
        localStorage.setItem('snakeSkin', skin);
    }
    snakeSkinSelect.value = getSnakeSkin();
    snakeSkinSelect.onchange = function() {
        setSnakeSkin(this.value);
        drawSnake();
    };

    function getRecords() {
        return JSON.parse(localStorage.getItem('snakeRecords') || '[]');
    }
    function saveRecord(newScore) {
        let recs = getRecords();
        recs.push({score: newScore, nick: nickname, date: new Date().toLocaleDateString()});
        recs = recs.sort((a,b)=>b.score-a.score).slice(0,5);
        localStorage.setItem('snakeRecords', JSON.stringify(recs));
        showRecords();
    }
    function showRecords() {
        const recs = getRecords();
        const el = document.getElementById('snake-records');
        el.innerHTML = recs.length ? recs.map((r,i)=>`<li><b>${r.score}</b> — ${r.nick} <span style='color:#aaa;font-size:0.95em;'>${r.date}</span></li>`).join('') : '<li>Пока нет рекордов</li>';
    }
    showRecords();

    function resetSnake() {
        snake = [{x: 6, y: 6}];
        dir = 'RIGHT';
        score = 0;
        food = {
            x: Math.floor(Math.random()*13),
            y: Math.floor(Math.random()*13)
        };
        document.getElementById('snake-score').textContent = 'Счёт: 0';
    }

    function drawSnake() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        const skin = snakeSkins[getSnakeSkin()] || snakeSkins.classic;
        for (let i=0; i<snake.length; i++) {
            ctx.fillStyle = i === 0 ? skin.head : skin.body;
            ctx.fillRect(snake[i].x*box, snake[i].y*box, box-2, box-2);
        }
        ctx.fillStyle = skin.food;
        ctx.fillRect(food.x*box, food.y*box, box-2, box-2);
    }

    function moveSnake() {
        let head = {x: snake[0].x, y: snake[0].y};
        if (dir === 'LEFT') head.x--;
        if (dir === 'RIGHT') head.x++;
        if (dir === 'UP') head.y--;
        if (dir === 'DOWN') head.y++;
        if (head.x<0 || head.x>12 || head.y<0 || head.y>12 || snake.some(s=>s.x===head.x&&s.y===head.y)) {
            clearInterval(game);
            started = false;
            document.getElementById('snake-score').textContent = 'Игра окончена! Счёт: ' + score;
            playSound(sndGameOver);
            saveRecord(score);
            return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            document.getElementById('snake-score').textContent = 'Счёт: ' + score;
            food = {
                x: Math.floor(Math.random()*13),
                y: Math.floor(Math.random()*13)
            };
            playSound(sndEat);
        } else {
            snake.pop();
        }
        drawSnake();
    }

    document.getElementById('snake-start').onclick = function() {
        if (started) return;
        resetSnake();
        drawSnake();
        started = true;
        game = setInterval(moveSnake, 110);
    };

    document.addEventListener('keydown', function(e) {
        if (!started) return;
        if (e.key === 'ArrowLeft' && dir !== 'RIGHT') dir = 'LEFT';
        if (e.key === 'ArrowUp' && dir !== 'DOWN') dir = 'UP';
        if (e.key === 'ArrowRight' && dir !== 'LEFT') dir = 'RIGHT';
        if (e.key === 'ArrowDown' && dir !== 'UP') dir = 'DOWN';
    });

    const decorBtn = document.getElementById('decor-btn');
    const decorCanvas = document.getElementById('decor-canvas');
    let decorType = localStorage.getItem('decorType') || 'none';
    function setDecor(type) {
        decorType = type;
        localStorage.setItem('decorType', type);
        drawDecor();
    }
    function drawDecor() {
        const ctx = decorCanvas.getContext('2d');
        ctx.clearRect(0,0,decorCanvas.width,decorCanvas.height);
        if (decorType === 'snow') startSnow();
        else if (decorType === 'fireworks') startFireworks();
        else if (decorType === 'random') startRandomBg();
        else stopAllDecor();
    }
    let snowflakes = [], snowAnim;
    function startSnow() {
        stopAllDecor();
        snowflakes = Array.from({length:60},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:2+Math.random()*3,s:1+Math.random()*2}));
        function snow() {
            const ctx = decorCanvas.getContext('2d');
            ctx.clearRect(0,0,decorCanvas.width,decorCanvas.height);
            ctx.fillStyle = '#fff';
            snowflakes.forEach(f=>{
                ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,2*Math.PI);ctx.fill();
                f.y+=f.s; if(f.y>window.innerHeight) {f.y=0;f.x=Math.random()*window.innerWidth;}
            });
            snowAnim = requestAnimationFrame(snow);
        }
        snow();
    }
    let fireworks = [], fireAnim;
    function startFireworks() {
        stopAllDecor();
        function spawnFirework() {
            const x = Math.random()*window.innerWidth, y = window.innerHeight, c = `hsl(${Math.random()*360},90%,60%)`;
            const particles = Array.from({length:30},()=>({x,y,vx:Math.cos(Math.random()*2*Math.PI)*Math.random()*4,vy:-Math.random()*6-2,color:c,a:1}));
            fireworks.push({particles});
        }
        function fire() {
            const ctx = decorCanvas.getContext('2d');
            ctx.clearRect(0,0,decorCanvas.width,decorCanvas.height);
            fireworks.forEach(fw=>{
                fw.particles.forEach(p=>{
                    ctx.globalAlpha = p.a;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();ctx.arc(p.x,p.y,2,0,2*Math.PI);ctx.fill();
                    p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.a*=0.97;
                });
            });
            fireworks = fireworks.filter(fw=>fw.particles.some(p=>p.a>0.05));
            ctx.globalAlpha = 1;
            fireAnim = requestAnimationFrame(fire);
        }
        setInterval(spawnFirework, 1200);
        fire();
    }
    let randomBgAnim;
    function startRandomBg() {
        stopAllDecor();
        let t=0;
        function anim() {
            const ctx = decorCanvas.getContext('2d');
            ctx.clearRect(0,0,decorCanvas.width,decorCanvas.height);
            for(let i=0;i<40;i++){
                ctx.fillStyle = `hsl(${(t*10+i*9)%360},80%,70%)`;
                ctx.beginPath();
                ctx.arc(Math.sin(t/20+i)*window.innerWidth/2+window.innerWidth/2,Math.cos(t/30+i)*window.innerHeight/2+window.innerHeight/2,30+20*Math.sin(t/10+i),0,2*Math.PI);
                ctx.fill();
            }
            t+=0.5;
            randomBgAnim = requestAnimationFrame(anim);
        }
        anim();
    }
    function stopAllDecor() {
        cancelAnimationFrame(snowAnim); cancelAnimationFrame(fireAnim); cancelAnimationFrame(randomBgAnim);
        fireworks=[]; snowflakes=[];
        const ctx = decorCanvas.getContext('2d');
        ctx.clearRect(0,0,decorCanvas.width,decorCanvas.height);
    }
    function resizeDecor() {
        decorCanvas.width = window.innerWidth;
        decorCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeDecor);
    resizeDecor();
    drawDecor();
    decorBtn.onclick = function() {
        const menu = document.createElement('div');
        menu.style.position = 'fixed';
        menu.style.top = '70px';
        menu.style.right = '40px';
        menu.style.background = '#fff';
        menu.style.color = '#222';
        menu.style.borderRadius = '14px';
        menu.style.boxShadow = '0 4px 24px rgba(80,120,255,0.13)';
        menu.style.padding = '12px 18px';
        menu.style.zIndex = 1000;
        menu.style.fontSize = '1.08em';
        menu.innerHTML = `
            <div style='margin-bottom:8px;font-weight:600;color:#6366f1;'>Декорации</div>
            <div style='margin-bottom:6px;cursor:pointer;' data-type='none'>❌ Отключить</div>
            <div style='margin-bottom:6px;cursor:pointer;' data-type='snow'>❄️ Снег</div>
            <div style='margin-bottom:6px;cursor:pointer;' data-type='fireworks'>🎆 Фейерверки</div>
            <div style='margin-bottom:0;cursor:pointer;' data-type='random'>🌈 Случайный фон</div>
        `;
        document.body.appendChild(menu);
        menu.onclick = e => {
            if (e.target.dataset.type) {
                setDecor(e.target.dataset.type);
                document.body.removeChild(menu);
            }
        };
        document.body.addEventListener('click', function handler(ev) {
            if (!menu.contains(ev.target) && ev.target !== decorBtn) {
                document.body.removeChild(menu);
                document.body.removeEventListener('click', handler);
            }
        });
    };

    const soundBtn = document.getElementById('sound-btn');
    let soundOn = localStorage.getItem('soundOn') !== 'off';
    function playSound(url) { if (soundOn) new Audio(url).play(); }
    function updateSoundBtn() { soundBtn.textContent = soundOn ? '🔊' : '🔈'; }
    soundBtn.onclick = function() {
        soundOn = !soundOn;
        localStorage.setItem('soundOn', soundOn ? 'on' : 'off');
        updateSoundBtn();
    };
    updateSoundBtn();
    const sndSend = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3/A4.mp3';
    const sndRecv = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3/C5.mp3';
    const sndEat = 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b4b3e.mp3';
    const sndGameOver = 'https://cdn.pixabay.com/audio/2022/03/15/audio_11e7b1b3b2.mp3';

    const infoBtn = document.getElementById('info-btn');
    const modalBg = document.getElementById('modal-bg');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const modalTabs = document.querySelectorAll('.modal-tab');
    function showModal(tab) {
        modalBg.style.display = 'flex';
        modal.style.display = 'block';
        setModalTab(tab||'settings');
    }
    function hideModal() {
        modalBg.style.display = 'none';
        modal.style.display = 'none';
    }
    infoBtn.onclick = () => showModal('settings');
    modalBg.onclick = hideModal;
    modalTabs.forEach(tab => tab.onclick = () => setModalTab(tab.dataset.tab));
    function setModalTab(tab) {
        modalTabs.forEach(t => t.style.background = 'linear-gradient(90deg,#6366f1 0%,#60a5fa 100%)');
        document.querySelector('.modal-tab[data-tab="'+tab+'"]').style.background = '#fff';
        document.querySelector('.modal-tab[data-tab="'+tab+'"]').style.color = '#6366f1';
        if(tab==='settings') modalContent.innerHTML = `
            <div style='font-size:1.15em;font-weight:600;margin-bottom:10px;'>Настройки</div>
            <div style='margin-bottom:10px;'>Ваш ник: <input id='modal-nick' value='${nickname}' maxlength='16' style='padding:4px 10px;border-radius:8px;border:1px solid #c7d2fe;font-size:1em;'></div>
            <div style='margin-bottom:10px;'>
                <button id='modal-theme' style='padding:6px 18px;border-radius:8px;background:#6366f1;color:#fff;border:none;font-size:1em;cursor:pointer;'>Сменить тему</button>
                <button id='modal-sound' style='padding:6px 18px;border-radius:8px;background:#6366f1;color:#fff;border:none;font-size:1em;cursor:pointer;margin-left:8px;'>${soundOn?'Отключить':'Включить'} звук</button>
            </div>
            <div style='margin-bottom:10px;'>
                <button id='modal-reset-records' style='padding:6px 18px;border-radius:8px;background:#f59e42;color:#fff;border:none;font-size:1em;cursor:pointer;'>Сбросить рекорды змейки</button>
                <button id='modal-reset-decor' style='padding:6px 18px;border-radius:8px;background:#60a5fa;color:#fff;border:none;font-size:1em;cursor:pointer;margin-left:8px;'>Сбросить декорации</button>
            </div>
        `;
        if(tab==='help') modalContent.innerHTML = `
            <div style='font-size:1.15em;font-weight:600;margin-bottom:10px;'>Помощь</div>
            <ul style='padding-left:18px;'>
                <li>Чат: отправляйте сообщения, используйте смайлы 😊</li>
                <li>Команды: <b>/quiz</b> — случайный вопрос, <b>/clear</b> — очистить чат (только у себя)</li>
                <li>Змейка: выберите скин, управляйте стрелками, рекорды сохраняются</li>
                <li>Декорации: снег, фейерверки, случайный фон — кнопка 🎉</li>
                <li>Звук: кнопка 🔊</li>
                <li>Настройки: кнопка ℹ️</li>
            </ul>
        `;
        if(tab==='about') modalContent.innerHTML = `
            <div style='font-size:1.15em;font-weight:600;margin-bottom:10px;'>О проекте</div>
            <div>Go WebSocket Chat & Змейка<br>by <b>Armovit</b> 2025</div>
            <div style='margin-top:10px;font-size:0.98em;color:#888;'>Open Source, MIT License</div>
        `;
        if(tab==='settings') {
            document.getElementById('modal-nick').onchange = function() {
                nickname = this.value.substring(0,16);
                localStorage.setItem('nickname', nickname);
                updateOnlineList();
            };
            document.getElementById('modal-theme').onclick = function() {
                document.body.classList.toggle('dark');
                themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
                localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
            };
            document.getElementById('modal-sound').onclick = function() {
                soundOn = !soundOn;
                localStorage.setItem('soundOn', soundOn ? 'on' : 'off');
                updateSoundBtn();
                this.textContent = soundOn ? 'Отключить звук' : 'Включить звук';
            };
            document.getElementById('modal-reset-records').onclick = function() {
                localStorage.removeItem('snakeRecords');
                showRecords();
            };
            document.getElementById('modal-reset-decor').onclick = function() {
                setDecor('none');
            };
        }
    }
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.left = (e.offsetX-10)+'px';
            ripple.style.top = (e.offsetY-10)+'px';
            ripple.style.width = ripple.style.height = '20px';
            ripple.style.background = 'rgba(99,102,241,0.18)';
            ripple.style.borderRadius = '50%';
            ripple.style.pointerEvents = 'none';
            ripple.style.transform = 'scale(0)';
            ripple.style.transition = 'transform 0.4s, opacity 0.4s';
            this.appendChild(ripple);
            setTimeout(()=>{ripple.style.transform='scale(3)';ripple.style.opacity='0';},10);
            setTimeout(()=>{if(this.contains(ripple))this.removeChild(ripple);},410);
        });
    });
    window.onload = () => { msg.focus(); };
