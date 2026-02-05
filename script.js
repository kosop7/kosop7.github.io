// script.js

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
        
        this.state = {
            currentScene: 0,
            sceneProgress: 0,
            isPlaying: false,
            isPaused: false,
            dialogueIndex: 0,
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
        
        this.characters = {
            gohan: {
                x: 0,
                y: 0,
                emotion: 'defeated',
                aura: { intensity: 0, color: '#FFD700', particles: [] },
                tears: [],
                isTransformed: false
            }
        };
        
        this.scenes = [
            {
                id: 0,
                title: "SCENE 1. 붕괴 직전의 정적",
                duration: 5000, // 5초
                camera: { start: { x: 0, y: -200, zoom: 0.3 }, end: { x: 0, y: 100, zoom: 0.8 } },
                dialogue: []
            }
        ];
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.canvas.addEventListener('click', () => this.handleClick());
        
        this.lastTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (!this.state.isPlaying || this.state.isPaused) return;
        
        this.state.time += deltaTime;
        const scene = this.scenes[this.state.currentScene];
        this.state.sceneProgress = Math.min(this.state.time / scene.duration, 1);
        
        if (this.state.sceneProgress >= 1) {
            this.nextScene();
        }
        
        this.updateUI();
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 배경을 검은색으로 지우기
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        if (this.state.isPlaying) {
            // 현재 씬 렌더링
            switch(this.state.currentScene) {
                case 0:
                    this.renderScene1();
                    break;
                default:
                    // 아무것도 안 함
                    break;
            }
        }
    }
    
    renderScene1() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 경기장 배경 그리기 (단순화)
        // 바닥
        ctx.fillStyle = '#333';
        ctx.fillRect(0, height * 0.6, width, height * 0.4);
        
        // 부서진 바닥 조각들
        ctx.fillStyle = '#555';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = height * 0.6 + Math.random() * height * 0.4;
            const w = Math.random() * 30 + 10;
            const h = Math.random() * 30 + 10;
            ctx.fillRect(x, y, w, h);
        }
        
        // 손오반 그리기
        this.drawGohan({
            x: width / 2,
            y: height * 0.7,
            emotion: 'defeated',
            scale: 1.5
        });
    }
    
    drawGohan(params) {
        const { x, y, emotion, scale = 1 } = params;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // 얼굴 (타원형)
        ctx.fillStyle = '#f5d5b0';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈 (처진 모양)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        // 왼쪽 눈
        ctx.ellipse(-12, -10, 8, 6, 0.2, 0, Math.PI * 2);
        // 오른쪽 눈
        ctx.ellipse(12, -10, 8, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // 동공
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-12, -8, 3, 0, Math.PI * 2);
        ctx.arc(12, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 입 (슬픈 표현)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 10, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // 머리카락 (검은색)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        // 머리카락 기본
        ctx.ellipse(0, -40, 35, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 머리카락 가닥 몇 개
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI/2 + (i-2) * 0.3;
            ctx.beginPath();
            ctx.moveTo(0, -40);
            ctx.lineTo(Math.cos(angle) * 40, -40 + Math.sin(angle) * 20);
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#000';
            ctx.stroke();
        }
        
        // 옷 (주황색 도복)
        ctx.fillStyle = '#ff8c00';
        // 상의
        ctx.fillRect(-40, 30, 80, 60);
        // 소매
        ctx.fillRect(-60, 30, 20, 40);
        ctx.fillRect(40, 30, 20, 40);
        
        // 옷 디테일 (검은 선)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // 가운데 선
        ctx.moveTo(0, 30);
        ctx.lineTo(0, 90);
        // 칼라
        ctx.moveTo(-30, 30);
        ctx.lineTo(30, 30);
        ctx.stroke();
        
        ctx.restore();
    }
    
    updateUI() {
        this.ui.progressBar.style.width = `${this.state.sceneProgress * 100}%`;
        
        if (this.scenes[this.state.currentScene]) {
            document.querySelector('.scene-title').textContent = 
                this.scenes[this.state.currentScene].title;
        }
    }
    
    startGame() {
        this.state.isPlaying = true;
        this.ui.titleScreen.classList.add('fade-out');
        this.ui.sceneIndicator.classList.remove('hidden');
        
        setTimeout(() => {
            this.ui.titleScreen.classList.add('hidden');
        }, 500);
    }
    
    nextScene() {
        this.state.currentScene++;
        this.state.sceneProgress = 0;
        this.state.time = 0;
        
        if (this.state.currentScene >= this.scenes.length) {
            this.endGame();
            return;
        }
        
        this.ui.dialogueBox.classList.add('hidden');
    }
    
    endGame() {
        this.state.isPlaying = false;
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
                <p>개발: 너의 첫 게임!</p>
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
                    this.nextScene();
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
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new DragonBallGame();
});
