// script.js

// ============================================
// 1. 게임 초기화 및 전역 변수
// ============================================

class DragonBallGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = {
            titleScreen: document.getElementById('title-screen'),
            dialogueBox: document.getElementById('dialogue-box'),
            sceneIndicator: document.getElementById('scene-indicator'),
            progressBar: document.querySelector('.progress-bar')
        };
        
        // 오디오 요소
        this.audio = {
            bgm: document.getElementById('bgm'),
            sfx16: document.getElementById('sfx-16'),
            sfxCell: document.getElementById('sfx-cell'),
            sfxScream: document.getElementById('sfx-scream'),
            sfxTransformation: document.getElementById('sfx-transformation')
        };
        
        // 게임 상태
        this.state = {
            currentScene: 0,
            sceneProgress: 0,
            isPlaying: false,
            isPaused: false,
            dialogueIndex: 0,
            currentDialogue: null,
            camera: {
                x: 0,
                y: 0,
                zoom: 1,
                shake: { intensity: 0, duration: 0 }
            },
            particles: [],
            effects: [],
            time: 0
        };
        
        // 캐릭터 데이터
        this.characters = {
            gohan: {
                x: 0,
                y: 0,
                emotion: 'normal',
                aura: { intensity: 0, color: '#FFD700', particles: [] },
                tears: [],
                isTransformed: false
            },
            android16: {
                x: 0,
                y: 0,
                isAlive: true,
                damage: 0
            },
            cell: {
                x: 0,
                y: 0,
                isAttacking: false
            }
        };
        
        // 씬 데이터
        this.scenes = [
            {
                id: 0,
                title: "SCENE 1. 붕괴 직전의 정적",
                duration: 8000,
                camera: { start: { x: 0, y: -200, zoom: 0.3 }, end: { x: 0, y: 100, zoom: 0.8 } },
                dialogue: []
            },
            {
                id: 1,
                title: "SCENE 2. 16호의 마지막 시선",
                duration: 10000,
                camera: { start: { x: 200, y: 0, zoom: 1.5 }, end: { x: 200, y: 0, zoom: 2 } },
                dialogue: [
                    { speaker: "안드로이드 16호", text: "내가 좋아했던", delay: 1500 },
                    { speaker: "안드로이드 16호", text: "자연과 동물들을…", delay: 2000 },
                    { speaker: "안드로이드 16호", text: "지.켜.주.거.라.", delay: 2500 },
                    { speaker: "안드로이드 16호", text: "부탁한다~", delay: 2000 }
                ]
            },
            // ... 나머지 씬들도 동일한 구조로 정의
        ];
        
        this.init();
    }
    
    // ============================================
    // 2. 초기화 함수
    // ============================================
    
    init() {
        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // UI 이벤트 리스너
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.canvas.addEventListener('click', () => this.handleClick());
        
        // 게임 루프 시작
        this.lastTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
        
        // 디버그 정보 업데이트
        setInterval(() => this.updateDebugInfo(), 1000);
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.aspectRatio = this.canvas.width / this.canvas.height;
    }
    
    // ============================================
    // 3. 게임 루프 및 상태 관리
    // ============================================
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // FPS 계산
        this.fps = Math.round(1000 / deltaTime);
        
        // 상태 업데이트
        this.update(deltaTime);
        
        // 화면 렌더링
        this.render();
        
        // 다음 프레임 요청
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (!this.state.isPlaying || this.state.isPaused) return;
        
        this.state.time += deltaTime;
        
        // 현재 씬 업데이트
        const scene = this.scenes[this.state.currentScene];
        this.state.sceneProgress = Math.min(this.state.time / scene.duration, 1);
        
        // 카메라 업데이트
        this.updateCamera(scene);
        
        // 파티클 및 효과 업데이트
        this.updateParticles(deltaTime);
        this.updateEffects(deltaTime);
        
        // 캐릭터 상태 업데이트
        this.updateCharacters(deltaTime);
        
        // 씬 완료 체크
        if (this.state.sceneProgress >= 1) {
            this.nextScene();
        }
        
        // UI 업데이트
        this.updateUI();
    }
    
    updateCamera(scene) {
        const progress = this.state.sceneProgress;
        const start = scene.camera.start;
        const end = scene.camera.end;
        
        this.state.camera.x = start.x + (end.x - start.x) * progress;
        this.state.camera.y = start.y + (end.y - start.y) * progress;
        this.state.camera.zoom = start.zoom + (end.zoom - start.zoom) * progress;
        
        // 카메라 쉐이크
        if (this.state.camera.shake.duration > 0) {
            this.state.camera.shake.duration -= 16;
            const intensity = this.state.camera.shake.intensity;
            this.state.camera.x += (Math.random() - 0.5) * intensity * 2;
            this.state.camera.y += (Math.random() - 0.5) * intensity * 2;
        }
    }
    
    // ============================================
    // 4. 렌더링 시스템
    // ============================================
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경색 설정
        this.drawBackground();
        
        // 카메라 변환 적용
        this.applyCameraTransform();
        
        // 현재 씬에 따른 렌더링
        switch(this.state.currentScene) {
            case 0:
                this.renderScene1();
                break;
            case 1:
                this.renderScene2();
                break;
            case 2:
                this.renderScene3();
                break;
            case 3:
                this.renderScene4();
                break;
            case 4:
                this.renderScene5();
                break;
            case 5:
                this.renderScene6();
                break;
            case 6:
                this.renderScene7();
                break;
            case 7:
                this.renderScene8();
                break;
            case 8:
                this.renderScene9();
                break;
        }
        
        // 파티클 렌더링
        this.renderParticles();
        
        // 효과 렌더링
        this.renderEffects();
        
        // 카메라 변환 복원
        this.restoreCameraTransform();
    }
    
    applyCameraTransform() {
        this.ctx.save();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(this.state.camera.zoom, this.state.camera.zoom);
        this.ctx.translate(-centerX + this.state.camera.x, -centerY + this.state.camera.y);
    }
    
    restoreCameraTransform() {
        this.ctx.restore();
    }
    
    // ============================================
    // 5. 씬별 렌더링 함수 (상세 구현)
    // ============================================
    
    renderScene1() {
        // 경기장 배경
        this.drawDestroyedStadium();
        
        // 손오반 렌더링
        this.drawGohan({
            x: 0,
            y: this.canvas.height * 0.6,
            emotion: 'defeated',
            scale: 2
        });
        
        // 먼지 입자 효과
        this.addDustParticles();
    }
    
    renderScene2() {
        // 안드로이드 16호 클로즈업
        this.drawAndroid16({
            x: 0,
            y: 0,
            emotion: 'calm',
            damage: 0.3,
            scale: 3
        });
        
        // 배경: 흐릿한 잔디밭
        this.drawBlurredBackground('#2a5c2a', '#1e421e');
        
        // 기계적 스파크 효과
        this.addSparks(this.characters.android16.x, this.characters.android16.y);
    }
    
    renderScene3() {
        // 셀의 발 클로즈업
        this.drawCellFoot({
            x: 0,
            y: 50,
            scale: 2.5
        });
        
        // 안드로이드 16호 파괴 애니메이션
        if (this.state.sceneProgress > 0.5) {
            this.drawAndroid16Destruction();
        }
    }
    
    renderScene4() {
        // 손오반 눈동자 클로즈업
        this.drawGohanEye({
            x: 0,
            y: 0,
            emotion: 'shock',
            scale: 5
        });
        
        // 배경 색상 변화
        const redIntensity = this.state.sceneProgress * 100;
        this.ctx.fillStyle = `rgba(139, 0, 0, ${0.3 * this.state.sceneProgress})`;
        this.ctx.fillRect(-1000, -1000, 2000, 2000);
        
        // 비둘기 상징 컷
        if (this.state.sceneProgress > 0.3 && this.state.sceneProgress < 0.4) {
            this.drawDoveSymbol();
        }
    }
    
    renderScene5() {
        // 손오반 얼굴 클로즈업 (무음)
        this.drawGohanFace({
            x: 0,
            y: 0,
            emotion: 'silent_rage',
            tears: true,
            scale: 4
        });
        
        // 미세한 표정 변화
        const tremble = Math.sin(this.state.time * 0.01) * 0.5;
        this.state.camera.x += tremble;
        this.state.camera.y += tremble * 0.5;
    }
    
    renderScene6() {
        // 폭발 장면
        this.drawExplosion();
        
        // 손오반 오라 변환
        this.drawTransformationAura();
        
        // 땅 갈라짐 효과
        this.drawGroundCracks();
        
        // 카메라 흔들림
        this.shakeCamera(10, 1000);
    }
    
    // ============================================
    // 6. 캐릭터 드로잉 함수
    // ============================================
    
    drawGohan(params) {
        const { x, y, emotion, scale = 1 } = params;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // 얼굴 구조 (타원형)
        ctx.fillStyle = '#f5d5b0'; // 살색
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 감정에 따른 눈 렌더링
        switch(emotion) {
            case 'defeated':
                this.drawGohanEyesDefeated();
                break;
            case 'shock':
                this.drawGohanEyesShock();
                break;
            case 'silent_rage':
                this.drawGohanEyesRage();
                break;
            case 'transformed':
                this.drawGohanEyesTransformed();
                break;
        }
        
        // 감정에 따른 입 렌더링
        this.drawGohanMouth(emotion);
        
        // 머리카락 (감정에 따라 변화)
        this.drawGohanHair(emotion);
        
        // 복장 (너덜너덜한 도복)
        this.drawGohanClothing(emotion);
        
        // 오라 효과
        if (this.characters.gohan.aura.intensity > 0) {
            this.drawAuraEffect(x, y, this.characters.gohan.aura);
        }
        
        ctx.restore();
    }
    
    drawGohanEyesDefeated() {
        const ctx = this.ctx;
        
        // 처진 눈매
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-10, -10, 8, 6, 0.1, 0, Math.PI * 2);
        ctx.ellipse(10, -10, 8, 6, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // 동공 (아래로 향함)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-10, -8, 3, 0, Math.PI * 2);
        ctx.arc(10, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈가의 그림자 (피로감)
        ctx.strokeStyle = 'rgba(139, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-10, -10, 9, 0.5, Math.PI - 0.5);
        ctx.arc(10, -10, 9, Math.PI + 0.5, -0.5, true);
        ctx.stroke();
    }
    
    drawGohanEyesRage() {
        const ctx = this.ctx;
        
        // 날카롭게 찢어진 눈
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        // 왼쪽 눈
        ctx.moveTo(-18, -15);
        ctx.lineTo(-2, -5);
        ctx.lineTo(-18, 5);
        ctx.closePath();
        // 오른쪽 눈
        ctx.moveTo(18, -15);
        ctx.lineTo(2, -5);
        ctx.lineTo(18, 5);
        ctx.closePath();
        ctx.fill();
        
        // 좁아진 동공
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-10, -5, 1.5, 2, 0.3, 0, Math.PI * 2);
        ctx.ellipse(10, -5, 1.5, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈썹 (안쪽으로 모임)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, -18);
        ctx.lineTo(-8, -12);
        ctx.moveTo(20, -18);
        ctx.lineTo(8, -12);
        ctx.stroke();
    }
    
    drawAndroid16(params) {
        const { x, y, emotion, damage, scale = 1 } = params;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // 얼굴 구조 (사각형)
        ctx.fillStyle = '#2a2a2a'; // 어두운 금속색
        ctx.beginPath();
        ctx.roundRect(-25, -30, 50, 60, 5);
        ctx.fill();
        
        // 기계적 디테일
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // 이마 라인
        ctx.moveTo(-20, -25);
        ctx.lineTo(20, -25);
        // 광대 라인
        ctx.moveTo(-25, -10);
        ctx.lineTo(25, -10);
        // 턱 라인
        ctx.moveTo(-15, 20);
        ctx.lineTo(15, 20);
        ctx.stroke();
        
        // 눈 (작고 깊게 박힘)
        ctx.fillStyle = '#c00'; // 붉은 눈
        ctx.beginPath();
        ctx.arc(-10, -15, 4, 0, Math.PI * 2);
        ctx.arc(10, -15, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈동자 (고정적)
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(-10, -15, 1.5, 0, Math.PI * 2);
        ctx.arc(10, -15, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 입 (직선형)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 10);
        ctx.lineTo(8, 10);
        ctx.stroke();
        
        // 손상 효과
        if (damage > 0) {
            this.drawDamageEffects(damage);
        }
        
        ctx.restore();
    }
    
    drawCellFoot(params) {
        const { x, y, scale = 1 } = params;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // 셀의 다리 (곤충형)
        ctx.fillStyle = '#1a5c1a'; // 녹색 계열
        ctx.beginPath();
        // 허벅지
        ctx.ellipse(0, -40, 35, 50, 0, 0, Math.PI * 2);
        // 종아리
        ctx.ellipse(0, 30, 25, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 관절 디테일
        ctx.strokeStyle = '#0f3d0f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // 무릎
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        // 관절 라인
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
            ctx.lineTo(Math.cos(angle) * 35, Math.sin(angle) * 50);
        }
        ctx.stroke();
        
        // 발톱
        ctx.fillStyle = '#333';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 15, 70);
            ctx.lineTo(i * 10, 90);
            ctx.lineTo(i * 20, 90);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // ============================================
    // 7. 효과 및 파티클 시스템
    // ============================================
    
    drawAuraEffect(x, y, aura) {
        const ctx = this.ctx;
        const intensity = aura.intensity;
        
        ctx.save();
        ctx.translate(x, y);
        
        // 오라 외곽선 (빛나는 효과)
        const gradient = ctx.createRadialGradient(0, 0, 20, 0, 0, 50 * intensity);
        gradient.addColorStop(0, `${aura.color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${aura.color}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 50 * intensity, 0, Math.PI * 2);
        ctx.fill();
        
        // 오라 내부 파티클
        aura.particles.forEach(particle => {
            const angle = particle.angle + this.state.time * 0.001;
            const radius = 20 + particle.radiusOffset;
            
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * radius * intensity,
                Math.sin(angle) * radius * intensity,
                particle.size,
                0, Math.PI * 2
            );
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    drawExplosion() {
        const ctx = this.ctx;
        const progress = this.state.sceneProgress;
        
        // 폭발 중심
        const centerX = this.characters.gohan.x;
        const centerY = this.characters.gohan.y;
        
        // 충격파
        const shockwaveRadius = progress * 300;
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, shockwaveRadius
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 땅 갈라짐
        if (progress > 0.2) {
            this.drawGroundCracks(centerX, centerY, progress);
        }
        
        // 흙먼지 파동
        this.addDustWave(centerX, centerY, progress);
    }
    
    addDustParticles() {
        if (Math.random() < 0.3) {
            this.state.particles.push({
                x: (Math.random() - 0.5) * this.canvas.width,
                y: (Math.random() - 0.5) * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: Math.random() * -0.5,
                radius: Math.random() * 3 + 1,
                color: 'rgba(200, 180, 140, 0.5)',
                life: 100 + Math.random() * 100
            });
        }
    }
    
    // ============================================
    // 8. 사운드 및 진동 시스템
    // ============================================
    
    playSceneAudio(sceneId) {
        switch(sceneId) {
            case 0: // 정적
                this.audio.bgm.volume = 0;
                break;
            case 1: // 16호 대사
                this.playDialogueAudio(this.scenes[1].dialogue);
                break;
            case 2: // 셀 공격
                this.audio.sfxCell.currentTime = 0;
                this.audio.sfxCell.volume = 0.7;
                this.audio.sfxCell.play();
                break;
            case 5: // 오반 포효
                setTimeout(() => {
                    this.audio.sfxScream.currentTime = 0;
                    this.audio.sfxScream.volume = 0.8;
                    this.audio.sfxScream.play();
                    this.shakeCamera(20, 2000);
                }, 1000);
                break;
            case 6: // 변신
                this.audio.sfxTransformation.currentTime = 0;
                this.audio.sfxTransformation.volume = 0.6;
                this.audio.sfxTransformation.play();
                break;
        }
    }
    
    playDialogueAudio(dialogues) {
        if (this.state.dialogueIndex < dialogues.length) {
            const dialogue = dialogues[this.state.dialogueIndex];
            
            // 대사 표시
            this.showDialogue(dialogue.speaker, dialogue.text);
            
            // 다음 대사 예약
            setTimeout(() => {
                this.state.dialogueIndex++;
                this.playDialogueAudio(dialogues);
            }, dialogue.delay);
        }
    }
    
    // ============================================
    // 9. UI 및 인터랙션
    // ============================================
    
    showDialogue(speaker, text) {
        this.ui.dialogueBox.classList.remove('hidden');
        this.ui.dialogueBox.classList.add('fade-in');
        
        document.querySelector('.speaker').textContent = speaker;
        document.querySelector('.text').textContent = text;
    }
    
    updateUI() {
        // 진행률 바 업데이트
        this.ui.progressBar.style.width = `${this.state.sceneProgress * 100}%`;
        
        // 씬 타이틀 업데이트
        if (this.scenes[this.state.currentScene]) {
            document.querySelector('.scene-title').textContent = 
                this.scenes[this.state.currentScene].title;
        }
    }
    
    shakeCamera(intensity, duration) {
        this.state.camera.shake = {
            intensity: intensity,
            duration: duration
        };
    }
    
    // ============================================
    // 10. 게임 흐름 제어
    // ============================================
    
    startGame() {
        this.state.isPlaying = true;
        this.ui.titleScreen.classList.add('fade-out');
        this.ui.sceneIndicator.classList.remove('hidden');
        
        setTimeout(() => {
            this.ui.titleScreen.classList.add('hidden');
        }, 500);
        
        // 첫 씬 시작
        this.playSceneAudio(0);
    }
    
    nextScene() {
        this.state.currentScene++;
        this.state.sceneProgress = 0;
        this.state.time = 0;
        this.state.dialogueIndex = 0;
        
        if (this.state.currentScene >= this.scenes.length) {
            this.endGame();
            return;
        }
        
        // 씬별 오디오 재생
        this.playSceneAudio(this.state.currentScene);
        
        // 대화창 초기화
        this.ui.dialogueBox.classList.add('hidden');
    }
    
    endGame() {
        this.state.isPlaying = false;
        
        // 엔딩 크레딧 표시
        this.showEndingCredits();
    }
    
    showEndingCredits() {
        const credits = document.createElement('div');
        credits.className = 'credits-screen';
        credits.innerHTML = `
            <h1>DRAGONBALL Z</h1>
            <h2>오반의 각성</h2>
            <div class="credits-content">
                <p>"지켜주거라..." - 안드로이드 16호</p>
                <p>감독: Akira Toriyama</p>
                <p>개발: GitHub Canvas Game</p>
                <p>모든 그래픽은 Canvas로 직접 렌더링되었습니다.</p>
            </div>
            <button id="restart-btn" class="btn-primary">다시 보기</button>
        `;
        
        document.getElementById('container').appendChild(credits);
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload();
        });
    }
    
    handleKeyPress(e) {
        switch(e.code) {
            case 'Space':
                if (this.state.isPlaying && this.ui.dialogueBox.classList.contains('fade-in')) {
                    this.nextDialogue();
                }
                break;
            case 'Escape':
                this.state.isPaused = !this.state.isPaused;
                break;
        }
    }
    
    handleClick() {
        if (!this.state.isPlaying && !this.ui.titleScreen.classList.contains('hidden')) {
            this.startGame();
        } else if (this.state.isPlaying) {
            this.nextScene();
        }
    }
    
    updateDebugInfo() {
        const debug = document.getElementById('debug-info');
        if (!debug) return;
        
        document.getElementById('fps-counter').textContent = this.fps || 0;
        document.getElementById('scene-index').textContent = this.state.currentScene;
    }
}

// 게임 인스턴스 생성
window.addEventListener('DOMContentLoaded', () => {
    const game = new DragonBallGame();
    
    // 글로벌 접근을 위한 디버그용
    window.dragonBallGame = game;
});
