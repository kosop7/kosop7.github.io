// main.js
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 캔버스 크기 설정
    canvas.width = 1200;
    canvas.height = 800;
    
    // UI 요소
    const audioMeter = document.querySelector('.audio-meter');
    const meterFill = document.querySelector('.meter-fill');
    const meterText = document.querySelector('.meter-text');
    const inventory = document.querySelector('.inventory');
    const breadItem = document.getElementById('bread');
    const waterItem = document.getElementById('water');
    const trustMeter = document.querySelector('.trust-meter');
    const trustFill = document.querySelector('.trust-fill');
    const trustText = document.querySelectorAll('.meter-text')[1];
    const imaginationMeter = document.querySelector('.imagination-meter');
    const imaginationFill = document.querySelector('.imagination-fill');
    const imaginationText = document.querySelectorAll('.meter-text')[2];
    const dialog = document.getElementById('dialog');
    const dialogText = document.querySelector('.dialog-text');
    
    // 게임 상태
    const gameState = {
        currentScene: 'well', // well, kitchen, hideout
        audioLevel: 0,
        hasBread: false,
        hasWater: false,
        trustLevel: 0,
        imaginationLevel: 30,
        isStressed: false,
        isImaginationActive: false,
        observationComplete: false,
        escapeComplete: false,
        soldierInteraction: 0,
        fatherPattern: 0,
        motherPattern: 0,
        time: 0,
        lastInteraction: 0,
        breathSoundFrequency: 0.3,
        waterDropFrequency: 0.1
    };
    
    // 캐릭터 데이터
    const characters = {
        ana: {
            x: 600,
            y: 600,
            width: 40,
            height: 100,
            state: 'idle', // idle, walking, running, observing, stressed
            direction: 'right',
            emotion: 'neutral', // neutral, curious, scared, sad
            animationFrame: 0,
            particles: []
        },
        father: {
            x: 300,
            y: 400,
            width: 50,
            height: 110,
            state: 'reading', // reading, looking, washing
            patternTimer: 0,
            handBandaged: true,
            glassesOn: true
        },
        mother: {
            x: 900,
            y: 450,
            width: 45,
            height: 105,
            state: 'washing', // washing, listening
            patternTimer: 0
        },
        soldier: {
            x: 600,
            y: 300,
            width: 50,
            height: 110,
            state: 'hiding', // hiding, observing, reacting
            trustLevel: 0,
            form: 'soldier', // soldier, monster, hybrid
            gazeDirection: 'down'
        }
    };
    
    // 장면 데이터
    const scenes = {
        well: {
            background: '#0a0a1a',
            wellX: 600,
            wellY: 300,
            wellRadius: 100,
            particles: [],
            breathSoundActive: false
        },
        kitchen: {
            background: '#1a1a0a',
            tableX: 600,
            tableY: 500,
            breadX: 650,
            breadY: 480,
            waterX: 550,
            waterY: 480,
            doorX: 1100,
            doorY: 400,
            fatherPattern: 10, // 10초마다 신문에서 눈을 뜀
            motherPattern: 15 // 15초마다 주변을 둘러봄
        },
        hideout: {
            background: '#0a1a1a',
            darkLevel: 0.8,
            lightBeams: [],
            soldierHidden: true,
            photoX: 0,
            photoY: 0,
            photoVisible: false
        }
    };
    
    // 게임 데이터
    let keys = {};
    let mouse = { x: 0, y: 0, down: false };
    let gameTime = 0;
    let isInteracting = false;
    let dialogQueue = [];
    let currentDialog = null;
    
    // 초기화
    function init() {
        // UI 초기화
        audioMeter.style.opacity = '0';
        inventory.style.opacity = '0';
        trustMeter.style.opacity = '0';
        imaginationMeter.style.opacity = '1';
        
        // 이벤트 리스너
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', () => mouse.down = true);
        canvas.addEventListener('mouseup', () => mouse.down = false);
        
        // 대화 초기화
        showDialog("우물가. 평소와 다른 고요함이 느껴진다...");
        
        // 게임 루프 시작
        gameLoop();
    }
    
    // 입력 처리
    function handleKeyDown(e) {
        keys[e.key.toLowerCase()] = true;
        
        // F 키로 상호작용
        if (e.key === 'f' || e.key === 'F') {
            handleInteraction();
        }
        
        // 스페이스바로 대화 진행
        if (e.key === ' ' && currentDialog) {
            continueDialog();
        }
        
        // 상상력 활성화 (E 키)
        if (e.key === 'e' || e.key === 'E') {
            if (gameState.imaginationLevel > 10) {
                gameState.isImaginationActive = !gameState.isImaginationActive;
                if (gameState.isImaginationActive) {
                    gameState.imaginationLevel -= 10;
                }
            }
        }
    }
    
    function handleKeyUp(e) {
        keys[e.key.toLowerCase()] = false;
    }
    
    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }
    
    // 상호작용 처리
    function handleInteraction() {
        const now = Date.now();
        if (now - gameState.lastInteraction < 500) return; // 상호작용 쿨타임
        
        gameState.lastInteraction = now;
        
        switch(gameState.currentScene) {
            case 'well':
                startAudioObservation();
                break;
            case 'kitchen':
                attemptItemPickup();
                break;
            case 'hideout':
                interactWithSoldier();
                break;
        }
    }
    
    // 청각 관찰 시작 (우물 장면)
    function startAudioObservation() {
        if (gameState.observationComplete) return;
        
        audioMeter.style.opacity = '1';
        isInteracting = true;
        characters.ana.state = 'observing';
        
        // 숨소리 시뮬레이션
        gameState.breathSoundFrequency = 0.3 + Math.random() * 0.4;
    }
    
    // 아이템 줍기 시도 (부엌 장면)
    function attemptItemPickup() {
        const ana = characters.ana;
        const scene = scenes.kitchen;
        
        // 빵과의 거리 확인
        const distToBread = Math.sqrt(
            Math.pow(ana.x - scene.breadX, 2) + 
            Math.pow(ana.y - scene.breadY, 2)
        );
        
        // 물병과의 거리 확인
        const distToWater = Math.sqrt(
            Math.pow(ana.x - scene.waterX, 2) + 
            Math.pow(ana.y - scene.waterY, 2)
        );
        
        // 문과의 거리 확인
        const distToDoor = Math.sqrt(
            Math.pow(ana.x - scene.doorX, 2) + 
            Math.pow(ana.y - scene.doorY, 2)
        );
        
        // 아이템 줍기
        if (distToBread < 60 && !gameState.hasBread) {
            if (canPickupSafely()) {
                gameState.hasBread = true;
                breadItem.classList.add('active');
                showDialog("빵 조각을 얻었다.");
            } else {
                showDialog("지금은 위험해... 부모님이 보고 있을지도 모른다.");
                triggerStress();
            }
        } else if (distToWater < 60 && !gameState.hasWater) {
            if (canPickupSafely()) {
                gameState.hasWater = true;
                waterItem.classList.add('active');
                showDialog("물병을 얻었다.");
            } else {
                showDialog("지금은 위험해... 부모님이 보고 있을지도 모른다.");
                triggerStress();
            }
        } else if (distToDoor < 80 && gameState.hasBread && gameState.hasWater) {
            if (canEscapeSafely()) {
                gameState.escapeComplete = true;
                gameState.currentScene = 'hideout';
                characters.ana.x = 200;
                characters.ana.y = 600;
                inventory.style.opacity = '0';
                showDialog("무사히 집을 빠져나왔다. 이제 은신처로 가야 한다...");
            } else {
                showDialog("지금은 나갈 수 없다. 부모님이 보고 있다.");
                triggerStress();
            }
        }
    }
    
    // 군인과 상호작용 (은신처 장면)
    function interactWithSoldier() {
        const ana = characters.ana;
        const soldier = characters.soldier;
        
        const distance = Math.sqrt(
            Math.pow(ana.x - soldier.x, 2) + 
            Math.pow(ana.y - soldier.y, 2)
        );
        
        if (distance < 100) {
            // 너무 가까움 - 군인이 공포 반응
            soldier.state = 'reacting';
            gameState.trustLevel = Math.max(0, gameState.trustLevel - 10);
            showDialog("군인이 몸을 움츠리며 공포에 떨고 있다. 너무 가까이 접근하지 말자.");
        } else if (distance < 250) {
            // 적절한 거리 - 아이템 제공
            if (gameState.hasBread || gameState.hasWater) {
                soldier.state = 'observing';
                gameState.trustLevel += 15;
                gameState.soldierInteraction++;
                
                if (gameState.hasBread) {
                    gameState.hasBread = false;
                    breadItem.classList.remove('active');
                    showDialog("빵을 군인 근처에 두었다. 그의 시선이 부드러워진다.");
                } else if (gameState.hasWater) {
                    gameState.hasWater = false;
                    waterItem.classList.remove('active');
                    showDialog("물을 군인 근처에 두었다. 그의 고통이 조금 줄어든 것 같다.");
                }
                
                // 신뢰도가 충분히 높아지면 가족 사진 발견
                if (gameState.trustLevel >= 70 && gameState.soldierInteraction >= 2) {
                    scenes.hideout.photoVisible = true;
                    scenes.hideout.photoX = soldier.x - 30;
                    scenes.hideout.photoY = soldier.y + 80;
                    showDialog("군인의 군복 주머니에서 '낡은 가족 사진'을 발견했다...");
                }
            } else {
                showDialog("군인이 뭔가를 원하는 것 같다. 음식이나 물이 필요할지도...");
            }
        } else {
            // 안전한 거리 - 관찰
            showDialog("군인을 관찰하고 있다... 그는 심하게 다쳤지만 여전히 생명의 징후가 보인다.");
        }
    }
    
    // 안전하게 아이템을 집을 수 있는지 확인
    function canPickupSafely() {
        const father = characters.father;
        const mother = characters.mother;
        
        // 아버지 패턴: 10초마다 신문에서 눈을 들어 거실을 둘러봄
        const fatherPatternTime = gameState.time % gameState.fatherPattern;
        const isFatherLooking = fatherPatternTime < 2; // 2초 동안 둘러봄
        
        // 어머니 패턴: 물소리로 인해 주변 소리를 잘 듣지 못함
        const motherPatternTime = gameState.time % gameState.motherPattern;
        const isMotherListening = motherPatternTime < 3; // 3초 동안 청취
        
        // 아버지가 보고 있지 않고, 어머니가 듣고 있지 않을 때 안전
        return !isFatherLooking && !isMotherListening;
    }
    
    // 안전하게 탈출할 수 있는지 확인
    function canEscapeSafely() {
        const father = characters.father;
        const mother = characters.mother;
        
        // 아버지와 어머니가 모두 다른 방향을 보고 있을 때
        const fatherDirection = Math.abs(father.x - characters.ana.x) > 300;
        const motherDirection = Math.abs(mother.x - characters.ana.x) > 300;
        
        return fatherDirection && motherDirection && canPickupSafely();
    }
    
    // 스트레스 트리거
    function triggerStress() {
        gameState.isStressed = true;
        characters.ana.state = 'stressed';
        
        // 스트레스 보더 효과
        const border = document.createElement('div');
        border.className = 'stress-border';
        document.querySelector('.container').appendChild(border);
        
        // 0.5초 후 효과 제거
        setTimeout(() => {
            if (border.parentNode) {
                border.parentNode.removeChild(border);
            }
        }, 500);
        
        // 2초 후 스트레스 상태 해제
        setTimeout(() => {
            gameState.isStressed = false;
            if (characters.ana.state === 'stressed') {
                characters.ana.state = 'idle';
            }
        }, 2000);
    }
    
    // 대화 표시
    function showDialog(text) {
        dialogQueue.push(text);
        
        if (!currentDialog) {
            nextDialog();
        }
    }
    
    function nextDialog() {
        if (dialogQueue.length > 0) {
            currentDialog = dialogQueue.shift();
            dialogText.textContent = currentDialog;
            dialog.style.display = 'flex';
        } else {
            currentDialog = null;
            dialog.style.display = 'none';
        }
    }
    
    function continueDialog() {
        nextDialog();
    }
    
    // 아나 렌더링
    function renderAna() {
        const ana = characters.ana;
        ctx.save();
        
        // 감정에 따른 색상 설정
        let particleColor;
        switch(ana.emotion) {
            case 'curious':
                particleColor = '#ffd700'; // 연금색
                break;
            case 'scared':
                particleColor = '#40e0d0'; // 청록색
                break;
            case 'sad':
                particleColor = '#9370db'; // 보라색
                break;
            default:
                particleColor = '#aaaaaa'; // 기본색
        }
        
        // 아나의 몸체
        ctx.fillStyle = gameState.isStressed ? '#5a5a8a' : '#8a8acc';
        ctx.fillRect(ana.x - ana.width/2, ana.y - ana.height, ana.width, ana.height);
        
        // 머리 (검은 단발)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ana.x, ana.y - ana.height + 15, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 얼굴
        ctx.fillStyle = '#f5d5c0';
        ctx.beginPath();
        ctx.arc(ana.x, ana.y - ana.height + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈 (감정에 따라 동공 크기 변화)
        let pupilSize = 4;
        if (ana.emotion === 'scared') pupilSize = 6; // 30% 확대
        if (ana.emotion === 'curious') pupilSize = 3.5;
        
        ctx.fillStyle = '#000';
        // 왼쪽 눈
        ctx.beginPath();
        ctx.arc(ana.x - 5, ana.y - ana.height + 13, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        // 오른쪽 눈
        ctx.beginPath();
        ctx.arc(ana.x + 5, ana.y - ana.height + 13, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 상상력 활성화 시 입자 효과
        if (gameState.isImaginationActive) {
            // 입자 생성
            if (Math.random() < 0.3) {
                ana.particles.push({
                    x: ana.x + (Math.random() - 0.5) * 100,
                    y: ana.y - ana.height + (Math.random() - 0.5) * 100,
                    size: Math.random() * 4 + 2,
                    life: 1.0,
                    color: particleColor
                });
            }
            
            // 입자 업데이트 및 렌더링
            for (let i = ana.particles.length - 1; i >= 0; i--) {
                const p = ana.particles[i];
                p.life -= 0.02;
                p.y -= 1;
                
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                if (p.life <= 0) {
                    ana.particles.splice(i, 1);
                }
            }
            ctx.globalAlpha = 1.0;
        }
        
        // 의상 (카디건)
        ctx.fillStyle = '#663399';
        ctx.fillRect(ana.x - ana.width/2 + 5, ana.y - ana.height + 30, ana.width - 10, ana.height - 40);
        
        // 치마
        ctx.fillStyle = '#4a4a8a';
        ctx.fillRect(ana.x - ana.width/2 + 8, ana.y - 20, ana.width - 16, 25);
        
        // 다리
        ctx.fillStyle = '#8a8acc';
        ctx.fillRect(ana.x - 8, ana.y, 5, 30);
        ctx.fillRect(ana.x + 3, ana.y, 5, 30);
        
        // 양말 (한쪽은 발목까지, 다른쪽은 종아리까지)
        ctx.fillStyle = '#ffffff';
        // 왼쪽 양말 (종아리 중간)
        ctx.fillRect(ana.x - 8, ana.y + 25, 5, 15);
        // 오른쪽 양말 (발목)
        ctx.fillRect(ana.x + 3, ana.y + 20, 5, 10);
        
        ctx.restore();
    }
    
    // 아버지 렌더링
    function renderFather() {
        const father = characters.father;
        const scene = gameState.currentScene;
        
        ctx.save();
        
        // 아버지의 공간적 영향력 (파란색 톤)
        if (scene === 'kitchen') {
            // 주변에 파란색 조명 효과
            ctx.shadowColor = '#1a5fb4';
            ctx.shadowBlur = 30;
        }
        
        // 아버지 몸체
        ctx.fillStyle = '#2a4a6a';
        ctx.fillRect(father.x - father.width/2, father.y - father.height, father.width, father.height);
        
        // 머리
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(father.x, father.y - father.height + 20, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // 안경
        if (father.glassesOn) {
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 2;
            // 왼쪽 렌즈
            ctx.beginPath();
            ctx.arc(father.x - 8, father.y - father.height + 18, 6, 0, Math.PI * 2);
            ctx.stroke();
            // 오른쪽 렌즈
            ctx.beginPath();
            ctx.arc(father.x + 8, father.y - father.height + 18, 6, 0, Math.PI * 2);
            ctx.stroke();
            // 안경 다리
            ctx.beginPath();
            ctx.moveTo(father.x - 14, father.y - father.height + 18);
            ctx.lineTo(father.x - 25, father.y - father.height + 15);
            ctx.moveTo(father.x + 14, father.y - father.height + 18);
            ctx.lineTo(father.x + 25, father.y - father.height + 15);
            ctx.stroke();
            
            // 안경에 아나의 반사
            if (Math.abs(father.x - characters.ana.x) < 200) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(father.x - 8, father.y - father.height + 18, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(father.x + 8, father.y - father.height + 18, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // 손 (붕대 감은 오른손)
        ctx.fillStyle = father.handBandaged ? '#fff' : '#f5d5c0';
        ctx.fillRect(father.x + 15, father.y - 40, 15, 10);
        
        // 붕대
        if (father.handBandaged) {
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(father.x + 16, father.y - 35);
            ctx.lineTo(father.x + 28, father.y - 35);
            ctx.stroke();
        }
        
        // 꿀방울 효과 (지나간 자리)
        if (scene === 'kitchen' && father.state === 'looking') {
            ctx.fillStyle = 'rgba(255, 200, 50, 0.5)';
            ctx.beginPath();
            ctx.arc(father.x - 10, father.y + 10, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 어머니 렌더링
    function renderMother() {
        const mother = characters.mother;
        
        ctx.save();
        
        // 어머니 몸체
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(mother.x - mother.width/2, mother.y - mother.height, mother.width, mother.height);
        
        // 머리
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.arc(mother.x, mother.y - mother.height + 20, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // 물소리 효과 (세척 중일 때)
        if (mother.state === 'washing') {
            ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
            for (let i = 0; i < 5; i++) {
                const radius = 10 + i * 5;
                ctx.beginPath();
                ctx.arc(mother.x + 20, mother.y - 20, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    // 군인/정령 렌더링
    function renderSoldier() {
        const soldier = characters.soldier;
        
        ctx.save();
        
        // 신뢰도와 상상력에 따른 형태 결정
        let form = 'soldier';
        if (gameState.trustLevel > 50 && gameState.imaginationLevel > 50) {
            form = 'monster';
        } else if (gameState.trustLevel > 30 || gameState.imaginationLevel > 30) {
            form = 'hybrid';
        }
        
        soldier.form = form;
        
        // 기본 군인 형태
        let bodyColor = '#3a5a3a';
        let details = [];
        
        if (form === 'monster') {
            // 프랑켄슈타인 괴물 형태
            bodyColor = '#2a4a2a';
            details.push({
                type: 'bolt',
                x: soldier.x,
                y: soldier.y - soldier.height + 30
            });
            details.push({
                type: 'flatHead',
                yOffset: -5
            });
            details.push({
                type: 'goldCracks'
            });
        } else if (form === 'hybrid') {
            // 혼합 형태
            bodyColor = '#3a4a3a';
            details.push({
                type: 'partialBolt',
                x: soldier.x - 10,
                y: soldier.y - soldier.height + 35
            });
            details.push({
                type: 'someCracks'
            });
        }
        
        // 그림자 효과 (아나가 두려울 때)
        if (characters.ana.emotion === 'scared') {
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 50;
            ctx.shadowOffsetX = 20;
            ctx.shadowOffsetY = 20;
        }
        
        // 후광 효과 (아나가 호기심을 가질 때)
        if (characters.ana.emotion === 'curious') {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 40;
        }
        
        // 몸체
        ctx.fillStyle = bodyColor;
        ctx.fillRect(soldier.x - soldier.width/2, soldier.y - soldier.height, soldier.width, soldier.height);
        
        // 머리
        ctx.fillStyle = form === 'monster' ? '#1a3a1a' : '#2a2a2a';
        let headRadius = 18;
        if (form === 'monster') {
            headRadius = 16; // 평평한 머리
        }
        ctx.beginPath();
        ctx.arc(soldier.x, soldier.y - soldier.height + headRadius, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 상처/금색 균열
        if (details.some(d => d.type.includes('Cracks'))) {
            ctx.strokeStyle = form === 'monster' ? '#ffd700' : '#c0a050';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // 얼굴 균열
            ctx.moveTo(soldier.x - 5, soldier.y - soldier.height + 10);
            ctx.lineTo(soldier.x + 5, soldier.y - soldier.height + 25);
            // 몸통 균열
            ctx.moveTo(soldier.x - 10, soldier.y - soldier.height + 50);
            ctx.lineTo(soldier.x + 15, soldier.y - soldier.height + 80);
            ctx.stroke();
        }
        
        // 목 볼트 (프랑켄슈타인)
        if (details.some(d => d.type.includes('bolt'))) {
            const bolt = details.find(d => d.type.includes('bolt'));
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(bolt.x - 4, bolt.y - 4, 8, 8);
            ctx.fillStyle = '#a0a0a0';
            ctx.fillRect(bolt.x - 2, bolt.y - 2, 4, 4);
        }
        
        // 시선 방향 표시
        if (soldier.gazeDirection !== 'down') {
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(soldier.x, soldier.y - soldier.height + 18);
            
            let endX = soldier.x, endY = soldier.y - soldier.height + 18;
            switch(soldier.gazeDirection) {
                case 'left':
                    endX -= 50;
                    break;
                case 'right':
                    endX += 50;
                    break;
                case 'up':
                    endY -= 50;
                    break;
                case 'down':
                    endY += 50;
                    break;
            }
            
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // 시선이 아이템이나 단서를 가리키는 경우
            if (scenes.hideout.photoVisible && soldier.gazeDirection === 'left') {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(scenes.hideout.photoX, scenes.hideout.photoY, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        // 가족 사진 렌더링
        if (scenes.hideout.photoVisible) {
            ctx.save();
            ctx.fillStyle = '#f5e6c8';
            ctx.fillRect(scenes.hideout.photoX - 25, scenes.hideout.photoY - 35, 50, 70);
            
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(scenes.hideout.photoX - 20, scenes.hideout.photoY - 30, 40, 60);
            
            // 간단한 사람 실루엣
            ctx.fillStyle = '#fff';
            // 어른 2명
            ctx.fillRect(scenes.hideout.photoX - 15, scenes.hideout.photoY - 10, 8, 20);
            ctx.fillRect(scenes.hideout.photoX + 7, scenes.hideout.photoY - 10, 8, 20);
            // 아이 1명
            ctx.fillRect(scenes.hideout.photoX - 5, scenes.hideout.photoY - 5, 10, 15);
            
            ctx.restore();
        }
    }
    
    // 우물 장면 렌더링
    function renderWellScene() {
        const scene = scenes.well;
        
        // 배경
        ctx.fillStyle = scene.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 별들
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.6;
            const size = Math.random() * 2 + 0.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 우물
        ctx.save();
        ctx.translate(scene.wellX, scene.wellY);
        
        // 우물 외벽
        ctx.fillStyle = '#4a3a2a';
        ctx.beginPath();
        ctx.arc(0, 0, scene.wellRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 우물 내부 (어둡게)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, scene.wellRadius - 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 우물 가장자리
        ctx.strokeStyle = '#6a5a4a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, scene.wellRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 우물 안의 물
        ctx.fillStyle = 'rgba(50, 100, 150, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, scene.wellRadius - 25, 0, Math.PI * 2);
        ctx.fill();
        
        // 물방울 효과
        if (Math.random() < gameState.waterDropFrequency) {
            const angle = Math.random() * Math.PI * 2;
            const radius = scene.wellRadius - 30;
            const dropX = Math.cos(angle) * radius;
            const dropY = Math.sin(angle) * radius;
            
            scene.particles.push({
                x: dropX,
                y: dropY,
                size: Math.random() * 3 + 1,
                life: 1.0,
                color: '#6495ed'
            });
        }
        
        // 숨소리 효과
        if (isInteracting && Math.random() < gameState.breathSoundFrequency) {
            const breathRadius = 30 + Math.sin(gameState.time * 0.1) * 10;
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, breathRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 숨소리 게이지 증가
            if (gameState.audioLevel < 100) {
                gameState.audioLevel += 0.5;
                updateAudioMeter();
                
                if (gameState.audioLevel >= 100) {
                    gameState.observationComplete = true;
                    audioMeter.style.opacity = '0';
                    isInteracting = false;
                    characters.ana.state = 'idle';
                    showDialog("우물 아래에 '낯선 존재의 존재감'이 느껴진다... 지도에 물음표가 표시되었다.");
                }
            }
        }
        
        // 물방울 입자 렌더링
        for (let i = scene.particles.length - 1; i >= 0; i--) {
            const p = scene.particles[i];
            p.y += 2;
            p.life -= 0.02;
            
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            if (p.life <= 0) {
                scene.particles.splice(i, 1);
            }
        }
        ctx.globalAlpha = 1.0;
        
        ctx.restore();
        
        // 아나 렌더링
        characters.ana.x = scene.wellX + 150;
        characters.ana.y = scene.wellY + 100;
        renderAna();
        
        // 장면 전환 힌트
        if (gameState.observationComplete) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(canvas.width/2 - 200, canvas.height - 100, 400, 60);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Noto Sans KR';
            ctx.textAlign = 'center';
            ctx.fillText('집으로 돌아가기 (엔터 키)', canvas.width/2, canvas.height - 70);
            
            if (keys.enter) {
                gameState.currentScene = 'kitchen';
                characters.ana.x = 200;
                characters.ana.y = 700;
                inventory.style.opacity = '1';
                showDialog("집 안 부엌. 어머니가 설거지하는 소리, 아버지의 신문 넘기는 소리... 시계 초침 소리가 유난히 크게 들린다.");
            }
        }
    }
    
    // 부엌 장면 렌더링
    function renderKitchenScene() {
        const scene = scenes.kitchen;
        
        // 배경
        ctx.fillStyle = scene.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 바닥
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
        
        // 벽
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
        
        // 식탁
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(scene.tableX - 100, scene.tableY - 20, 200, 40);
        ctx.fillRect(scene.tableX - 110, scene.tableY, 20, 100);
        ctx.fillRect(scene.tableX + 90, scene.tableY, 20, 100);
        
        // 빵
        if (!gameState.hasBread) {
            ctx.fillStyle = '#d4a574';
            ctx.beginPath();
            ctx.arc(scene.breadX, scene.breadY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // 빵 텍스처
            ctx.fillStyle = '#b08c5a';
            ctx.beginPath();
            ctx.arc(scene.breadX, scene.breadY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // 상호작용 힌트
            if (Math.abs(characters.ana.x - scene.breadX) < 60) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '14px Noto Sans KR';
                ctx.textAlign = 'center';
                ctx.fillText('빵 조각 (F 키로 집기)', scene.breadX, scene.breadY - 25);
            }
        }
        
        // 물병
        if (!gameState.hasWater) {
            ctx.fillStyle = '#1e90ff';
            ctx.fillRect(scene.waterX - 10, scene.waterY - 20, 20, 40);
            
            ctx.fillStyle = '#87ceeb';
            ctx.fillRect(scene.waterX - 8, scene.waterY - 18, 16, 36);
            
            // 상호작용 힌트
            if (Math.abs(characters.ana.x - scene.waterX) < 60) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '14px Noto Sans KR';
                ctx.textAlign = 'center';
                ctx.fillText('물병 (F 키로 집기)', scene.waterX, scene.waterY - 35);
            }
        }
        
        // 문
        ctx.fillStyle = '#654321';
        ctx.fillRect(scene.doorX - 40, scene.doorY - 100, 80, 200);
        
        // 문 손잡이
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(scene.doorX + 20, scene.doorY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 탈출 힌트
        if (gameState.hasBread && gameState.hasWater && 
            Math.abs(characters.ana.x - scene.doorX) < 80) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Noto Sans KR';
            ctx.textAlign = 'center';
            ctx.fillText('집을 빠져나가기 (F 키)', scene.doorX, scene.doorY - 120);
        }
        
        // 시계 (초침 소리 강조)
        ctx.save();
        ctx.translate(100, 100);
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        // 초침
        const secondAngle = (gameState.time % 60) * Math.PI / 30;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(secondAngle) * 25, -Math.cos(secondAngle) * 25);
        ctx.stroke();
        
        ctx.restore();
        
        // 아버지 패턴 업데이트
        gameState.fatherPattern = scene.fatherPattern;
        characters.father.patternTimer += 0.1;
        
        if (characters.father.patternTimer >= scene.fatherPattern) {
            characters.father.state = characters.father.state === 'reading' ? 'looking' : 'reading';
            characters.father.patternTimer = 0;
            
            if (characters.father.state === 'looking') {
                showDialog("아버지가 신문에서 눈을 들어 거실을 둘러보고 있다...");
            }
        }
        
        // 어머니 패턴 업데이트
        gameState.motherPattern = scene.motherPattern;
        characters.mother.patternTimer += 0.1;
        
        if (characters.mother.patternTimer >= scene.motherPattern) {
            characters.mother.state = characters.mother.state === 'washing' ? 'listening' : 'washing';
            characters.mother.patternTimer = 0;
            
            if (characters.mother.state === 'listening') {
                showDialog("어머니가 물소리를 멈추고 주변 소리를 듣고 있다...");
            }
        }
        
        // 아버지 렌더링
        characters.father.x = 300;
        characters.father.y = 500;
        renderFather();
        
        // 어머니 렌더링
        characters.mother.x = 900;
        characters.mother.y = 500;
        renderMother();
        
        // 아나 렌더링 및 이동
        updateAnaMovement();
        renderAna();
        
        // 아버지 시각적 시야 표시
        if (characters.father.state === 'looking') {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.moveTo(characters.father.x, characters.father.y - characters.father.height);
            ctx.lineTo(characters.father.x - 200, characters.father.y - characters.father.height - 100);
            ctx.lineTo(characters.father.x + 200, characters.father.y - characters.father.height - 100);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        
        // 어머니 청각 범위 표시
        if (characters.mother.state === 'listening') {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                const radius = 100 + i * 30;
                ctx.beginPath();
                ctx.arc(characters.mother.x, characters.mother.y - characters.mother.height, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    
    // 은신처 장면 렌더링
    function renderHideoutScene() {
        const scene = scenes.hideout;
        
        // 배경 (어두운)
        ctx.fillStyle = scene.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 먼지 빛 (틈새로 비치는)
        scene.lightBeams = scene.lightBeams || [];
        if (Math.random() < 0.05) {
            scene.lightBeams.push({
                x: Math.random() * canvas.width,
                y: 0,
                width: Math.random() * 20 + 5,
                height: Math.random() * 200 + 100,
                life: 1.0
            });
        }
        
        // 먼지 빛 렌더링
        for (let i = scene.lightBeams.length - 1; i >= 0; i--) {
            const beam = scene.lightBeams[i];
            beam.life -= 0.01;
            
            ctx.save();
            ctx.globalAlpha = beam.life * 0.3;
            ctx.fillStyle = '#fff8dc';
            ctx.fillRect(beam.x, beam.y, beam.width, beam.height);
            ctx.restore();
            
            if (beam.life <= 0) {
                scene.lightBeams.splice(i, 1);
            }
        }
        
        // 벽
        ctx.fillStyle = '#2a2a1a';
        ctx.fillRect(100, 100, canvas.width - 200, canvas.height - 200);
        
        // 바닥
        ctx.fillStyle = '#1a1a0a';
        ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
        
        // 군인 렌더링
        characters.soldier.x = canvas.width / 2;
        characters.soldier.y = canvas.height / 2 + 50;
        
        // 군인의 시선 방향 설정
        if (!scenes.hideout.photoVisible) {
            const directions = ['left', 'right', 'up', 'down'];
            if (Math.random() < 0.02) {
                characters.soldier.gazeDirection = directions[Math.floor(Math.random() * directions.length)];
            }
        } else {
            characters.soldier.gazeDirection = 'left'; // 사진을 보도록
        }
        
        // 군인의 상태 설정
        if (gameState.soldierInteraction === 0) {
            characters.soldier.state = 'hiding';
        } else if (gameState.soldierInteraction === 1) {
            characters.soldier.state = 'observing';
        } else {
            characters.soldier.state = 'trusting';
        }
        
        renderSoldier();
        
        // 고통스러운 숨소리 효과
        if (Math.random() < 0.1) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const breathSize = 40 + Math.sin(gameState.time * 0.2) * 20;
            ctx.arc(characters.soldier.x, characters.soldier.y - 30, breathSize, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // 신뢰도와 상상력 게이지 표시
        trustMeter.style.opacity = '1';
        imaginationMeter.style.opacity = '1';
        
        // 신뢰도 업데이트
        gameState.trustLevel = Math.min(100, Math.max(0, gameState.trustLevel));
        trustFill.style.width = `${gameState.trustLevel}%`;
        trustText.textContent = `${Math.round(gameState.trustLevel)}%`;
        
        // 상상력 업데이트 (시간에 따라 서서히 회복)
        if (!gameState.isImaginationActive && gameState.imaginationLevel < 100) {
            gameState.imaginationLevel += 0.05;
        }
        imaginationFill.style.width = `${gameState.imaginationLevel}%`;
        imaginationText.textContent = `${Math.round(gameState.imaginationLevel)}%`;
        
        // 아나 렌더링 및 이동
        updateAnaMovement();
        renderAna();
        
        // 군인과의 거리에 따른 상호작용 힌트
        const distance = Math.sqrt(
            Math.pow(characters.ana.x - characters.soldier.x, 2) + 
            Math.pow(characters.ana.y - characters.soldier.y, 2)
        );
        
        if (distance < 300) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(canvas.width/2 - 200, canvas.height - 80, 400, 50);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Noto Sans KR';
            ctx.textAlign = 'center';
            
            if (distance < 100) {
                ctx.fillText('너무 가깝습니다! 군인이 두려워합니다. 뒤로 물러나세요.', canvas.width/2, canvas.height - 50);
            } else if (distance < 250) {
                if (gameState.hasBread || gameState.hasWater) {
                    ctx.fillText('F 키로 음식이나 물을 제공할 수 있습니다.', canvas.width/2, canvas.height - 50);
                } else {
                    ctx.fillText('군인이 도움이 필요한 것 같습니다. 음식이나 물이 필요할지도...', canvas.width/2, canvas.height - 50);
                }
            } else {
                ctx.fillText('F 키로 군인을 관찰할 수 있습니다.', canvas.width/2, canvas.height - 50);
            }
        }
        
        // 게임 완료 조건
        if (scenes.hideout.photoVisible) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(canvas.width/2 - 250, canvas.height/2 - 100, 500, 200);
            ctx.fillStyle = '#fff';
            ctx.font = '20px Noto Sans KR';
            ctx.textAlign = 'center';
            ctx.fillText('낡은 가족 사진을 발견했습니다.', canvas.width/2, canvas.height/2 - 50);
            ctx.font = '16px Noto Sans KR';
            ctx.fillText('이 사진은 누구의 것일까요? 그들과 무슨 관계일까요?', canvas.width/2, canvas.height/2 - 10);
            ctx.fillText('게임을 플레이해주셔서 감사합니다.', canvas.width/2, canvas.height/2 + 40);
            ctx.font = '14px Noto Sans KR';
            ctx.fillText('새로고침하여 다시 플레이할 수 있습니다.', canvas.width/2, canvas.height/2 + 80);
        }
    }
    
    // 아나 이동 업데이트
    function updateAnaMovement() {
        const ana = characters.ana;
        const speed = gameState.isStressed ? 1.5 : 2.5;
        
        if (keys['arrowleft'] || keys['a']) {
            ana.x -= speed;
            ana.direction = 'left';
            ana.state = 'walking';
            ana.animationFrame = (ana.animationFrame + 0.1) % 10;
        } else if (keys['arrowright'] || keys['d']) {
            ana.x += speed;
            ana.direction = 'right';
            ana.state = 'walking';
            ana.animationFrame = (ana.animationFrame + 0.1) % 10;
        } else if (keys['arrowup'] || keys['w']) {
            ana.y -= speed;
            ana.state = 'walking';
            ana.animationFrame = (ana.animationFrame + 0.1) % 10;
        } else if (keys['arrowdown'] || keys['s']) {
            ana.y += speed;
            ana.state = 'walking';
            ana.animationFrame = (ana.animationFrame + 0.1) % 10;
        } else {
            if (ana.state === 'walking') {
                ana.state = 'idle';
            }
        }
        
        // 달리기 (Shift 키)
        if ((keys['shift'] || keys[' ']) && ana.state === 'walking') {
            ana.x += (ana.direction === 'right' ? 1 : -1) * 1.5;
            ana.state = 'running';
        }
        
        // 경계 체크
        ana.x = Math.max(50, Math.min(canvas.width - 50, ana.x));
        ana.y = Math.max(100, Math.min(canvas.height - 50, ana.y));
        
        // 감정 업데이트 (상황에 따라)
        if (gameState.currentScene === 'well' && isInteracting) {
            ana.emotion = 'curious';
        } else if (gameState.isStressed) {
            ana.emotion = 'scared';
        } else if (gameState.currentScene === 'hideout' && gameState.trustLevel < 30) {
            ana.emotion = 'scared';
        } else if (gameState.currentScene === 'hideout' && gameState.trustLevel >= 70) {
            ana.emotion = 'curious';
        } else {
            ana.emotion = 'neutral';
        }
    }
    
    // 오디오 미터 업데이트
    function updateAudioMeter() {
        meterFill.style.width = `${gameState.audioLevel}%`;
        meterText.textContent = `${Math.round(gameState.audioLevel)}%`;
    }
    
    // 게임 루프
    function gameLoop() {
        // 시간 업데이트
        gameState.time += 0.1;
        gameTime = gameState.time;
        
        // 장면 렌더링
        switch(gameState.currentScene) {
            case 'well':
                renderWellScene();
                break;
            case 'kitchen':
                renderKitchenScene();
                break;
            case 'hideout':
                renderHideoutScene();
                break;
        }
        
        // 다음 프레임 요청
        requestAnimationFrame(gameLoop);
    }
    
    // 게임 초기화
    init();
});