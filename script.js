// 게임 상태 관리
class GameState {
    constructor() {
        this.currentScene = 0;
        this.scenes = [];
        this.isPlaying = false;
        this.isLoading = true;
        this.loadProgress = 0;
        this.canvas = null;
        this.ctx = null;
        this.lastTime = 0;
        this.camera = {
            x: 0, y: 0, zoom: 1, 
            targetX: 0, targetY: 0, targetZoom: 1,
            shake: 0
        };
        this.characters = new Map();
        this.particles = [];
        this.isDialogueVisible = true;
        this.currentDialogue = null;
        this.dialogueIndex = 0;
        this.textSpeed = 30; // 문자당 밀리초
        this.isTextAnimating = false;
        this.textAnimationTimer = 0;
    }
}

// 캐릭터 클래스
class Character {
    constructor(id, config) {
        this.id = id;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.scale = config.scale || 1;
        this.rotation = config.rotation || 0;
        this.emotion = config.emotion || 'neutral';
        this.opacity = config.opacity || 1;
        this.isVisible = config.isVisible !== false;
        this.animation = null;
        
        // 캐릭터별 고유 설정
        switch(id) {
            case 'gohan':
                this.type = 'gohan';
                this.hairColor = '#F8C300'; // 황금빛
                this.skinColor = '#FFE0B5';
                this.orangeGiColor = '#FF6600';
                this.blackInnerColor = '#1A1A1A';
                this.aura = { active: false, intensity: 0, color: '#F8C300' };
                this.expression = {
                    eyebrows: 'neutral',
                    eyes: 'normal',
                    mouth: 'neutral',
                    tears: false
                };
                break;
                
            case 'android16':
                this.type = 'android16';
                this.metalColor = '#666666';
                this.darkMetalColor = '#333333';
                this.redColor = '#CC0000';
                this.skinColor = '#E8DCCA';
                this.damage = 0;
                break;
                
            case 'cell':
                this.type = 'cell';
                this.armorColor = '#2E8B57';
                this.darkArmorColor = '#1E5B37';
                this.highlightColor = '#4CAF50';
                this.skinColor = '#D4AF37';
                this.smileLevel = 0.5;
                break;
                
            case 'goku':
                this.type = 'goku';
                this.hairColor = '#000000';
                this.skinColor = '#FFE0B5';
                this.orangeGiColor = '#FF6600';
                this.blueGiColor = '#0066CC';
                break;
                
            case 'piccolo':
                this.type = 'piccolo';
                this.skinColor = '#2E8B57';
                this.darkSkinColor = '#1E5B37';
                this.whiteGiColor = '#FFFFFF';
                this.purpleGiColor = '#800080';
                break;
        }
    }
    
    update(deltaTime) {
        // 애니메이션 업데이트
        if (this.animation) {
            this.animation.update(deltaTime, this);
        }
        
        // 특수 효과 업데이트
        if (this.type === 'gohan' && this.aura.active) {
            this.aura.intensity += deltaTime * 0.001;
        }
    }
    
    draw(ctx, camera) {
        if (!this.isVisible) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // 카메라 변환 적용
        const screenX = (this.x - camera.x) * camera.zoom + ctx.canvas.width / 2;
        const screenY = (this.y - camera.y) * camera.zoom + ctx.canvas.height / 2;
        
        ctx.translate(screenX, screenY);
        ctx.scale(this.scale * camera.zoom, this.scale * camera.zoom);
        ctx.rotate(this.rotation);
        
        // 캐릭터 타입별 렌더링
        switch(this.type) {
            case 'gohan':
                this.drawGohan(ctx);
                break;
            case 'android16':
                this.drawAndroid16(ctx);
                break;
            case 'cell':
                this.drawCell(ctx);
                break;
            case 'goku':
                this.drawGoku(ctx);
                break;
            case 'piccolo':
                this.drawPiccolo(ctx);
                break;
        }
        
        // 오라 효과
        if (this.type === 'gohan' && this.aura.active) {
            this.drawAura(ctx, this.aura.intensity);
        }
        
        ctx.restore();
    }
    
    drawGohan(ctx) {
        // 머리 그리기
        ctx.fillStyle = this.expression.eyebrows === 'angry' ? '#FFD700' : this.hairColor;
        this.drawGohanHair(ctx);
        
        // 얼굴 그리기
        ctx.fillStyle = this.skinColor;
        this.drawGohanFace(ctx);
        
        // 눈 그리기
        this.drawGohanEyes(ctx);
        
        // 입 그리기
        this.drawGohanMouth(ctx);
        
        // 눈물
        if (this.expression.tears) {
            this.drawTears(ctx);
        }
        
        // 옷 그리기
        this.drawGohanClothes(ctx);
    }
    
    drawGohanHair(ctx) {
        // 손오반 머리카락 (원작 스타일)
        ctx.beginPath();
        // 정수리 부분
        ctx.moveTo(0, -80);
        ctx.lineTo(-20, -100);
        ctx.lineTo(-15, -120);
        ctx.lineTo(15, -120);
        ctx.lineTo(20, -100);
        ctx.closePath();
        ctx.fill();
        
        // 옆머리
        ctx.beginPath();
        ctx.moveTo(-40, -70);
        ctx.lineTo(-60, -90);
        ctx.lineTo(-50, -100);
        ctx.lineTo(-30, -80);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(40, -70);
        ctx.lineTo(60, -90);
        ctx.lineTo(50, -100);
        ctx.lineTo(30, -80);
        ctx.closePath();
        ctx.fill();
    }
    
    drawGohanFace(ctx) {
        // 얼굴 타원형 (부드러운 타원형)
        ctx.beginPath();
        ctx.ellipse(0, -30, 35, 45, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawGohanEyes(ctx) {
        const isAngry = this.expression.eyebrows === 'angry';
        const eyeHeight = isAngry ? 8 : 15;
        const eyeY = -40;
        
        // 왼쪽 눈
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-15, eyeY, 12, eyeHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 오른쪽 눈
        ctx.beginPath();
        ctx.ellipse(15, eyeY, 12, eyeHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈동자 (분노 시 축소)
        const pupilSize = isAngry ? 3 : 6;
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-15, eyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(15, eyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈썹
        ctx.fillStyle = 'black';
        if (isAngry) {
            // 분노한 눈썹 (안쪽으로 모임)
            ctx.beginPath();
            ctx.moveTo(-25, eyeY - 20);
            ctx.lineTo(-10, eyeY - 15);
            ctx.lineTo(-5, eyeY - 20);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(25, eyeY - 20);
            ctx.lineTo(10, eyeY - 15);
            ctx.lineTo(5, eyeY - 20);
            ctx.fill();
        } else {
            // 평소 눈썹 (완만한 아치형)
            ctx.beginPath();
            ctx.moveTo(-25, eyeY - 15);
            ctx.lineTo(-5, eyeY - 10);
            ctx.lineTo(-10, eyeY - 15);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(25, eyeY - 15);
            ctx.lineTo(5, eyeY - 10);
            ctx.lineTo(10, eyeY - 15);
            ctx.fill();
        }
    }
    
    drawGohanMouth(ctx) {
        ctx.fillStyle = '#E8B4B4';
        
        switch(this.expression.mouth) {
            case 'neutral':
                // 중립 (입꼬리 살짝 내려감)
                ctx.beginPath();
                ctx.ellipse(0, -10, 10, 5, 0, 0, Math.PI);
                ctx.fill();
                break;
                
            case 'determined':
                // 결의 (입을 굳게 다문 모습)
                ctx.beginPath();
                ctx.moveTo(-12, -8);
                ctx.lineTo(12, -8);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#E8B4B4';
                ctx.stroke();
                break;
                
            case 'scream':
                // 포효 (크게 벌린 입)
                ctx.beginPath();
                ctx.ellipse(0, -5, 15, 10, 0, 0, Math.PI);
                ctx.fill();
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.ellipse(0, -5, 12, 7, 0, 0, Math.PI);
                ctx.fill();
                break;
        }
    }
    
    drawTears(ctx) {
        ctx.fillStyle = 'rgba(100, 150, 255, 0.7)';
        // 왼쪽 눈물
        ctx.beginPath();
        ctx.ellipse(-15, -20, 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // 오른쪽 눈물
        ctx.beginPath();
        ctx.ellipse(15, -20, 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawGohanClothes(ctx) {
        // 주황색 도복 상의
        ctx.fillStyle = this.orangeGiColor;
        ctx.beginPath();
        ctx.moveTo(-25, 10);
        ctx.lineTo(-35, 50);
        ctx.lineTo(35, 50);
        ctx.lineTo(25, 10);
        ctx.closePath();
        ctx.fill();
        
        // 검정색 이너
        ctx.fillStyle = this.blackInnerColor;
        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(-25, 50);
        ctx.lineTo(25, 50);
        ctx.lineTo(15, 10);
        ctx.closePath();
        ctx.fill();
        
        // 칼라
        ctx.fillStyle = this.orangeGiColor;
        ctx.fillRect(-20, 0, 40, 15);
        
        // 손
        ctx.fillStyle = this.skinColor;
        // 왼쪽 손
        ctx.beginPath();
        ctx.ellipse(-40, 40, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // 오른쪽 손
        ctx.beginPath();
        ctx.ellipse(40, 40, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawAura(ctx, intensity) {
        const gradient = ctx.createRadialGradient(0, 0, 30, 0, 0, 100 + intensity * 50);
        gradient.addColorStop(0, `rgba(248, 195, 0, ${0.3 + intensity * 0.2})`);
        gradient.addColorStop(1, 'rgba(248, 195, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 100 + intensity * 50, 0, Math.PI * 2);
        ctx.fill();
        
        // 번개 효과
        if (intensity > 0.5) {
            this.drawLightning(ctx, intensity);
        }
    }
    
    drawLightning(ctx, intensity) {
        ctx.strokeStyle = `rgba(100, 200, 255, ${intensity})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const length = 50 + Math.random() * 50 * intensity;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            let x = 0, y = 0;
            
            for (let j = 0; j < 5; j++) {
                x += Math.cos(angle) * length/5 + (Math.random() - 0.5) * 20;
                y += Math.sin(angle) * length/5 + (Math.random() - 0.5) * 20;
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
        }
    }
    
    drawAndroid16(ctx) {
        // 얼굴 (사각형)
        ctx.fillStyle = this.metalColor;
        ctx.fillRect(-40, -60, 80, 60);
        
        // 상세 디테일
        ctx.fillStyle = this.darkMetalColor;
        // 눈 부분
        ctx.fillRect(-30, -50, 15, 10);
        ctx.fillRect(15, -50, 15, 10);
        
        // 입 부분
        ctx.fillRect(-20, -25, 40, 5);
        
        // 기계적 디테일
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        
        // 얼굴 패널 라인
        ctx.beginPath();
        ctx.moveTo(-40, -30);
        ctx.lineTo(40, -30);
        ctx.stroke();
        
        // 눈 주변
        ctx.beginPath();
        ctx.arc(-22, -45, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(22, -45, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // 머리 파손 효과
        if (this.damage > 0) {
            this.drawDamage(ctx);
        }
    }
    
    drawDamage(ctx) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        // 불규칙한 파손 모양
        ctx.moveTo(20, -60);
        ctx.lineTo(40, -50);
        ctx.lineTo(35, -30);
        ctx.lineTo(15, -40);
        ctx.closePath();
        ctx.fill();
        
        // 스파크 효과
        if (this.damage > 0.5) {
            ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 3; i++) {
                const x = 30 + Math.random() * 10;
                const y = -45 + Math.random() * 10;
                const length = 5 + Math.random() * 10;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random() - 0.5) * length, 
                          y + (Math.random() - 0.5) * length);
                ctx.stroke();
            }
        }
    }
    
    drawCell(ctx) {
        // 얼굴 기본형 (곤충+인간 혼합)
        ctx.fillStyle = this.armorColor;
        ctx.beginPath();
        ctx.moveTo(-40, -50);
        ctx.lineTo(-20, -70);
        ctx.lineTo(20, -70);
        ctx.lineTo(40, -50);
        ctx.lineTo(30, -20);
        ctx.lineTo(-30, -20);
        ctx.closePath();
        ctx.fill();
        
        // 얼굴 하이라이트
        ctx.fillStyle = this.highlightColor;
        ctx.beginPath();
        ctx.moveTo(-35, -45);
        ctx.lineTo(-15, -65);
        ctx.lineTo(15, -65);
        ctx.lineTo(35, -45);
        ctx.lineTo(25, -25);
        ctx.lineTo(-25, -25);
        ctx.closePath();
        ctx.fill();
        
        // 눈 (반쯤 뜬 상태)
        ctx.fillStyle = 'black';
        // 왼쪽 눈
        ctx.beginPath();
        ctx.ellipse(-15, -50, 8, 4, 0, 0, Math.PI);
        ctx.fill();
        // 오른쪽 눈
        ctx.beginPath();
        ctx.ellipse(15, -50, 8, 4, 0, 0, Math.PI);
        ctx.fill();
        
        // 미소 (비대칭 미소)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const smileLevel = this.smileLevel;
        ctx.moveTo(-20, -30);
        ctx.quadraticCurveTo(0, -25 + smileLevel * 10, 
                           20, -30 - smileLevel * 5);
        ctx.stroke();
    }
    
    drawGoku(ctx) {
        // 간소화된 오공 디자인
        ctx.fillStyle = this.skinColor;
        // 얼굴
        ctx.beginPath();
        ctx.arc(0, -40, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // 머리카락
        ctx.fillStyle = this.hairColor;
        this.drawSpikyHair(ctx, 6);
        
        // 눈
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-15, -45, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(15, -45, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈동자
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-15, -45, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(15, -45, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 입 (놀란 표정)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(0, -25, 8, 6, 0, 0, Math.PI);
        ctx.fill();
    }
    
    drawPiccolo(ctx) {
        // 피콜로 얼굴
        ctx.fillStyle = this.skinColor;
        // 길쭉한 얼굴형
        ctx.beginPath();
        ctx.ellipse(0, -50, 25, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 뿔
        ctx.beginPath();
        ctx.moveTo(0, -90);
        ctx.lineTo(-10, -120);
        ctx.lineTo(10, -120);
        ctx.closePath();
        ctx.fill();
        
        // 눈 (날카로운)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-12, -50, 6, 10, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(12, -50, 6, 10, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈동자
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-12, -50, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(12, -50, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈썹 (항상 찌푸린 모양)
        ctx.fillStyle = this.darkSkinColor;
        ctx.beginPath();
        ctx.moveTo(-20, -60);
        ctx.lineTo(-5, -55);
        ctx.lineTo(-10, -65);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(20, -60);
        ctx.lineTo(5, -55);
        ctx.lineTo(10, -65);
        ctx.closePath();
        ctx.fill();
        
        // 입 (다문 입)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, -30);
        ctx.lineTo(15, -30);
        ctx.stroke();
    }
    
    drawSpikyHair(ctx, spikes) {
        for (let i = 0; i < spikes; i++) {
            const angle = (i / spikes) * Math.PI * 2;
            const length = 40 + Math.random() * 10;
            
            ctx.beginPath();
            ctx.moveTo(0, -80);
            ctx.lineTo(
                Math.cos(angle) * length,
                -80 + Math.sin(angle) * length
            );
            ctx.lineTo(
                Math.cos(angle + 0.3) * (length * 0.7),
                -80 + Math.sin(angle + 0.3) * (length * 0.7)
            );
            ctx.closePath();
            ctx.fill();
        }
    }
}

// 파티클 시스템
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 2 + Math.random() * 4;
        this.type = type; // 'dust', 'spark', 'blood', 'energy'
        this.color = this.getColor();
    }
    
    getColor() {
        switch(this.type) {
            case 'dust': return `rgba(200, 180, 150, ${this.life})`;
            case 'spark': return `rgba(255, 255, 200, ${this.life})`;
            case 'blood': return `rgba(200, 0, 0, ${this.life})`;
            case 'energy': return `rgba(100, 200, 255, ${this.life})`;
            default: return `rgba(255, 255, 255, ${this.life})`;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // 중력
        this.life -= this.decay;
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 애니메이션 클래스
class Animation {
    constructor(target, duration, easing = 'linear') {
        this.target = target;
        this.duration = duration;
        this.easing = easing;
        this.progress = 0;
        this.isComplete = false;
        this.startValues = {};
        this.endValues = {};
    }
    
    setStartValues(values) {
        this.startValues = { ...values };
    }
    
    setEndValues(values) {
        this.endValues = { ...values };
    }
    
    update(deltaTime, character) {
        this.progress += deltaTime / this.duration;
        
        if (this.progress >= 1) {
            this.progress = 1;
            this.isComplete = true;
        }
        
        const t = this.ease(this.progress);
        
        // 각 속성 보간
        for (const key in this.endValues) {
            const start = this.startValues[key] !== undefined ? 
                         this.startValues[key] : character[key];
            const end = this.endValues[key];
            
            if (typeof start === 'number') {
                character[key] = start + (end - start) * t;
            }
        }
        
        return !this.isComplete;
    }
    
    ease(t) {
        switch(this.easing) {
            case 'easeIn': return t * t;
            case 'easeOut': return t * (2 - t);
            case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            default: return t; // linear
        }
    }
}

// 장면 정의
const scenes = [
    {
        id: 1,
        name: "붕괴 직전의 정적",
        camera: { x: 0, y: 0, zoom: 0.5 },
        characters: [
            { id: 'gohan', x: 0, y: 100, scale: 1.2, emotion: 'defeated' }
        ],
        background: 'ruined_stadium',
        dialogue: [],
        duration: 3000,
        effects: ['dust_particles', 'faint_light']
    },
    {
        id: 2,
        name: "16호의 마지막 시선",
        camera: { x: 200, y: 50, zoom: 2 },
        characters: [
            { id: 'android16', x: 200, y: 50, scale: 1.5, emotion: 'calm' }
        ],
        background: 'grass_field',
        dialogue: [
            { speaker: '안드로이드 16호', text: '내가 좋아했던', delay: 1000 },
            { speaker: '안드로이드 16호', text: '자연과 동물들을…', delay: 1500 },
            { speaker: '안드로이드 16호', text: '지.켜.주.거.라.', delay: 2000 },
            { speaker: '안드로이드 16호', text: '부탁한다~', delay: 1000 }
        ],
        effects: ['mechanical_sparks', 'fade_in_out']
    },
    {
        id: 3,
        name: "선택을 빼앗는 폭력",
        camera: { x: 0, y: 0, zoom: 1 },
        characters: [
            { id: 'cell', x: 0, y: 0, scale: 1.5, emotion: 'smirking' },
            { id: 'android16', x: -100, y: 50, scale: 1, emotion: 'damaged' }
        ],
        background: 'stadium',
        dialogue: [
            { speaker: '셀', text: '쓸데없는 참견이다.', delay: 800 },
            { speaker: '셀', text: '실패작 녀석.', delay: 800 }
        ],
        effects: ['slow_motion', 'crush_effect', 'explosion']
    },
    {
        id: 4,
        name: "오반의 눈, 세계의 균열",
        camera: { x: 0, y: 100, zoom: 3 },
        characters: [
            { id: 'gohan', x: 0, y: 100, scale: 1.5, emotion: 'angry_tears' }
        ],
        background: 'red_sky',
        dialogue: [],
        effects: ['eye_closeup', 'blood_tear', 'sky_redden', 'doves']
    },
    {
        id: 5,
        name: "침묵의 임계점",
        camera: { x: 0, y: 100, zoom: 2.5 },
        characters: [
            { id: 'gohan', x: 0, y: 100, scale: 1.8, emotion: 'determined' }
        ],
        background: 'still_sky',
        dialogue: [],
        effects: ['silence', 'long_hold', 'single_tear']
    },
    {
        id: 6,
        name: "폭발",
        camera: { x: 0, y: 100, zoom: 1, shake: 0.3 },
        characters: [
            { id: 'gohan', x: 0, y: 100, scale: 2, emotion: 'screaming' }
        ],
        background: 'storm',
        dialogue: [],
        effects: ['scream', 'ground_crack', 'dust_wave', 'camera_shake', 'energy_surge']
    },
    {
        id: 7,
        name: "목격자들의 반응",
        camera: { x: -300, y: 0, zoom: 1 },
        characters: [
            { id: 'goku', x: -300, y: 0, scale: 1, emotion: 'shocked' },
            { id: 'piccolo', x: -350, y: 0, scale: 1, emotion: 'surprised' }
        ],
        background: 'stadium',
        dialogue: [
            { speaker: '화면 밖', text: '오반!!', delay: 1000 }
        ],
        effects: ['cut_away', 'reaction_shot']
    },
    {
        id: 8,
        name: "새로운 얼굴",
        camera: { x: 0, y: 100, zoom: 2 },
        characters: [
            { id: 'gohan', x: 0, y: 100, scale: 1.5, emotion: 'transformed' }
        ],
        background: 'lightning_storm',
        dialogue: [
            { speaker: '내레이션', text: '드디어... 오반의 분노의 한계가 넘은 것인가?', delay: 2000 }
        ],
        effects: ['super_saiyan_hair', 'lightning', 'aura_glow']
    },
    {
        id: 9,
        name: "선언 없는 선언",
        camera: { x: 0, y: 100, zoom: 2.2 },
        characters: [
            { id: 'gohan', x: 0, y: 100, scale: 1.6, emotion: 'final' }
        ],
        background: 'apocalyptic',
        dialogue: [],
        effects: ['prolonged_silence', 'fade_to_black', 'final_shot']
    }
];

// 메인 게임 클래스
class DragonBallZGame {
    constructor() {
        this.state = new GameState();
        this.scenes = scenes;
        this.init();
    }
    
    async init() {
        // 캔버스 설정
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI 요소
        this.dialogueBox = document.getElementById('dialogue-box');
        this.speakerName = document.getElementById('speaker-name');
        this.dialogueText = document.getElementById('dialogue-text');
        this.sceneNumber = document.getElementById('scene-number');
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.querySelector('.loading-progress');
        
        // 리사이즈 핸들러
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 터치 이벤트
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('click', (e) => this.handleTouch(e));
        
        // 로딩 시뮬레이션
        await this.simulateLoading();
        
        // 게임 시작
        this.start();
    }
    
    resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // 고해상도 지원
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = container.clientWidth * dpr;
        this.canvas.height = container.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);
        
        if (this.state.isPlaying) {
            this.render();
        }
    }
    
    async simulateLoading() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                this.state.loadProgress += 0.05;
                this.loadingProgress.style.width = `${this.state.loadProgress * 100}%`;
                
                if (this.state.loadProgress >= 1) {
                    clearInterval(interval);
                    setTimeout(() => {
                        this.loadingScreen.style.display = 'none';
                        this.state.isLoading = false;
                        resolve();
                    }, 500);
                }
            }, 50);
        });
    }
    
    start() {
        this.state.isPlaying = true;
        this.loadScene(0);
        this.gameLoop();
    }
    
    loadScene(sceneIndex) {
        if (sceneIndex >= this.scenes.length) {
            // 게임 종료
            this.showEnding();
            return;
        }
        
        this.state.currentScene = sceneIndex;
        const scene = this.scenes[sceneIndex];
        
        // 장면 번호 업데이트
        this.sceneNumber.textContent = scene.id;
        
        // 카메라 설정
        Object.assign(this.state.camera, scene.camera);
        
        // 캐릭터 초기화
        this.state.characters.clear();
        scene.characters.forEach(charConfig => {
            const character = new Character(charConfig.id, charConfig);
            
            // 감정 설정
            switch(charConfig.emotion) {
                case 'defeated':
                    character.expression = {
                        eyebrows: 'neutral',
                        eyes: 'downcast',
                        mouth: 'neutral',
                        tears: false
                    };
                    character.opacity = 0.8;
                    break;
                    
                case 'angry_tears':
                    character.expression = {
                        eyebrows: 'angry',
                        eyes: 'normal',
                        mouth: 'determined',
                        tears: true
                    };
                    character.aura = { active: true, intensity: 0.1, color: '#F8C300' };
                    break;
                    
                case 'transformed':
                    character.expression = {
                        eyebrows: 'angry',
                        eyes: 'focused',
                        mouth: 'determined',
                        tears: false
                    };
                    character.aura = { active: true, intensity: 1, color: '#FFD700' };
                    character.hairColor = '#FFD700';
                    break;
                    
                case 'screaming':
                    character.expression = {
                        eyebrows: 'angry',
                        eyes: 'wide',
                        mouth: 'scream',
                        tears: false
                    };
                    character.aura = { active: true, intensity: 2, color: '#FF4500' };
                    break;
            }
            
            this.state.characters.set(charConfig.id, character);
        });
        
        // 대사 설정
        this.state.currentDialogue = scene.dialogue;
        this.state.dialogueIndex = 0;
        
        if (scene.dialogue.length > 0) {
            this.showDialogue(scene.dialogue[0]);
        } else {
            this.hideDialogue();
        }
        
        // 파티클 초기화
        this.state.particles = [];
        
        // 장면별 특수 효과
        this.setupSceneEffects(scene);
    }
    
    setupSceneEffects(scene) {
        switch(scene.id) {
            case 1: // 붕괴 직전의 정적
                // 먼지 파티클 생성
                for (let i = 0; i < 50; i++) {
                    this.state.particles.push(new Particle(
                        Math.random() * this.canvas.width - this.canvas.width/2,
                        Math.random() * this.canvas.height - this.canvas.height/2,
                        'dust'
                    ));
                }
                break;
                
            case 3: // 선택을 빼앗는 폭력
                // 16호 파손 애니메이션
                const android16 = this.state.characters.get('android16');
                if (android16) {
                    const crushAnimation = new Animation(android16, 1000, 'easeIn');
                    crushAnimation.setStartValues({ damage: 0 });
                    crushAnimation.setEndValues({ damage: 1 });
                    android16.animation = crushAnimation;
                    
                    // 파편 파티클
                    setTimeout(() => {
                        for (let i = 0; i < 30; i++) {
                            this.state.particles.push(new Particle(
                                android16.x + (Math.random() - 0.5) * 50,
                                android16.y + (Math.random() - 0.5) * 50,
                                'spark'
                            ));
                        }
                    }, 500);
                }
                break;
                
            case 6: // 폭발
                // 지면 갈라짐 효과
                setTimeout(() => {
                    for (let i = 0; i < 100; i++) {
                        this.state.particles.push(new Particle(
                            (Math.random() - 0.5) * 200,
                            100 + Math.random() * 50,
                            'energy'
                        ));
                    }
                    this.state.camera.shake = 0.5;
                    
                    // 2초 후 흔들림 감소
                    setTimeout(() => {
                        this.state.camera.shake = 0.2;
                    }, 2000);
                }, 1000);
                break;
                
            case 8: // 새로운 얼굴
                // 번개 효과
                setInterval(() => {
                    if (this.state.currentScene === 7) {
                        for (let i = 0; i < 3; i++) {
                            this.state.particles.push(new Particle(
                                (Math.random() - 0.5) * 100,
                                -100 + Math.random() * 50,
                                'spark'
                            ));
                        }
                    }
                }, 300);
                break;
        }
    }
    
    showDialogue(dialogue) {
        this.state.isDialogueVisible = true;
        this.dialogueBox.classList.remove('hidden');
        
        this.speakerName.textContent = dialogue.speaker;
        this.dialogueText.textContent = '';
        
        // 타이핑 효과
        this.state.isTextAnimating = true;
        this.state.textAnimationTimer = 0;
        this.animateText(dialogue.text);
    }
    
    animateText(text) {
        let currentIndex = 0;
        const animate = () => {
            if (currentIndex < text.length && this.state.isTextAnimating) {
                this.dialogueText.textContent += text[currentIndex];
                currentIndex++;
                
                // 특수 문자 지연
                const char = text[currentIndex - 1];
                const delay = char === '.' ? 500 : 
                            char === ',' ? 300 : 
                            char === '~' ? 400 : 30;
                
                setTimeout(animate, delay);
            } else {
                this.state.isTextAnimating = false;
            }
        };
        
        animate();
    }
    
    hideDialogue() {
        this.state.isDialogueVisible = false;
        this.dialogueBox.classList.add('hidden');
    }
    
    nextDialogue() {
        if (!this.state.currentDialogue) return;
        
        if (this.state.isTextAnimating) {
            // 텍스트 애니메이션 스킵
            this.state.isTextAnimating = false;
            const currentDialogue = this.state.currentDialogue[this.state.dialogueIndex];
            this.dialogueText.textContent = currentDialogue.text;
            return;
        }
        
        this.state.dialogueIndex++;
        
        if (this.state.dialogueIndex < this.state.currentDialogue.length) {
            this.showDialogue(this.state.currentDialogue[this.state.dialogueIndex]);
        } else {
            this.hideDialogue();
            
            // 다음 장면으로 자동 전환 (대사가 끝난 후)
            const currentScene = this.scenes[this.state.currentScene];
            if (currentScene.dialogue.length > 0) {
                setTimeout(() => {
                    this.loadScene(this.state.currentScene + 1);
                }, 1000);
            }
        }
    }
    
    handleTouch(event) {
        event.preventDefault();
        
        if (this.state.isLoading) return;
        
        // 대사 처리
        if (this.state.isDialogueVisible) {
            this.nextDialogue();
            return;
        }
        
        // 다음 장면으로
        const currentScene = this.scenes[this.state.currentScene];
        if (currentScene.dialogue.length === 0) {
            // 대사 없는 장면은 터치 시 바로 다음 장면
            setTimeout(() => {
                this.loadScene(this.state.currentScene + 1);
            }, 300);
        }
    }
    
    updateCamera(deltaTime) {
        const cam = this.state.camera;
        const speed = 0.002 * deltaTime;
        
        // 카메라 목표 위치로 부드럽게 이동
        cam.x += (cam.targetX - cam.x) * speed;
        cam.y += (cam.targetY - cam.y) * speed;
        cam.zoom += (cam.targetZoom - cam.zoom) * speed;
        
        // 카메라 흔들림
        if (cam.shake > 0) {
            cam.x += (Math.random() - 0.5) * cam.shake * 10;
            cam.y += (Math.random() - 0.5) * cam.shake * 10;
            cam.shake *= 0.95; // 감쇠
            
            if (cam.shake < 0.01) cam.shake = 0;
        }
    }
    
    update(deltaTime) {
        // 카메라 업데이트
        this.updateCamera(deltaTime);
        
        // 캐릭터 업데이트
        for (const character of this.state.characters.values()) {
            character.update(deltaTime);
        }
        
        // 파티클 업데이트
        this.state.particles = this.state.particles.filter(p => p.update());
        
        // 장면별 업데이트 로직
        this.updateScene(deltaTime);
    }
    
    updateScene(deltaTime) {
        const scene = this.scenes[this.state.currentScene];
        
        switch(scene.id) {
            case 1: // 롱숏에서 클로즈업으로
                if (this.state.currentDialogue && this.state.dialogueIndex >= scene.dialogue.length) {
                    // 대사가 끝나면 카메라 이동
                    this.state.camera.targetZoom = 1.5;
                    this.state.camera.targetY = 100;
                    
                    // 일정 시간 후 다음 장면
                    setTimeout(() => {
                        if (this.state.currentScene === 0) {
                            this.loadScene(1);
                        }
                    }, 3000);
                }
                break;
                
            case 4: // 눈물 효과
                const gohan = this.state.characters.get('gohan');
                if (gohan && !gohan.expression.tears) {
                    gohan.expression.tears = true;
                }
                break;
        }
    }
    
    drawBackground() {
        const ctx = this.ctx;
        const scene = this.scenes[this.state.currentScene];
        
        // 배경색 설정
        switch(scene.background) {
            case 'ruined_stadium':
                // 파괴된 경기장 배경
                const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                gradient.addColorStop(0, '#2C3E50');
                gradient.addColorStop(0.5, '#34495E');
                gradient.addColorStop(1, '#2C3E50');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // 경기장 바닥
                ctx.fillStyle = '#7F8C8D';
                ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);
                
                // 균열
                ctx.strokeStyle = '#2C3E50';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.canvas.width * 0.3, this.canvas.height * 0.65);
                ctx.lineTo(this.canvas.width * 0.5, this.canvas.height * 0.7);
                ctx.lineTo(this.canvas.width * 0.7, this.canvas.height * 0.63);
                ctx.stroke();
                break;
                
            case 'red_sky':
                // 핏빛 하늘
                const redGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                redGradient.addColorStop(0, '#8B0000');
                redGradient.addColorStop(0.5, '#B22222');
                redGradient.addColorStop(1, '#8B0000');
                ctx.fillStyle = redGradient;
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
                
            case 'lightning_storm':
                // 번개 폭풍 배경
                const stormGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                stormGradient.addColorStop(0, '#1A1A2E');
                stormGradient.addColorStop(0.5, '#16213E');
                stormGradient.addColorStop(1, '#0F3460');
                ctx.fillStyle = stormGradient;
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
                
            default:
                // 기본 배경
                ctx.fillStyle = '#1C2833';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    render() {
        if (!this.state.isPlaying) return;
        
        const ctx = this.ctx;
        
        // 캔버스 클리어
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경 그리기
        this.drawBackground();
        
        // 카메라 변환 저장
        ctx.save();
        
        // 카메라 변환 적용
        const cam = this.state.camera;
        ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(-cam.x, -cam.y);
        
        // 파티클 그리기 (배경에)
        this.state.particles.forEach(particle => {
            particle.draw(ctx);
        });
        
        // 캐릭터 그리기 (정렬된 순서대로)
        const sortedCharacters = Array.from(this.state.characters.values())
            .sort((a, b) => a.y - b.y); // y좌표 기준 정렬
        
        sortedCharacters.forEach(character => {
            character.draw(ctx, cam);
        });
        
        // 카메라 변환 복원
        ctx.restore();
        
        // 장면별 특수 효과
        this.renderSceneEffects();
    }
    
    renderSceneEffects() {
        const ctx = this.ctx;
        const scene = this.scenes[this.state.currentScene];
        
        switch(scene.id) {
            case 4: // 비둘기 효과
                this.drawDove();
                break;
                
            case 6: // 지면 갈라짐 효과
                this.drawGroundCrack();
                break;
        }
    }
    
    drawDove() {
        const ctx = this.ctx;
        const time = Date.now() * 0.001;
        
        ctx.save();
        ctx.translate(this.canvas.width * 0.5 + Math.sin(time) * 50, 
                     this.canvas.height * 0.3 - time * 50 % this.canvas.height);
        
        // 비둘기 몸체
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 날개
        ctx.beginPath();
        ctx.ellipse(-8, -2, 8, 4, Math.sin(time * 5) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(8, -2, 8, 4, -Math.sin(time * 5) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawGroundCrack() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height * 0.7;
        
        ctx.strokeStyle = 'rgba(139, 0, 0, 0.8)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // 지면 균열
        ctx.beginPath();
        ctx.moveTo(centerX - 100, centerY);
        for (let i = 0; i < 10; i++) {
            const x = centerX - 100 + i * 20 + (Math.random() - 0.5) * 15;
            const y = centerY + i * 5 + (Math.random() - 0.5) * 10;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 100, centerY);
        for (let i = 0; i < 10; i++) {
            const x = centerX + 100 - i * 20 + (Math.random() - 0.5) * 15;
            const y = centerY + i * 5 + (Math.random() - 0.5) * 10;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - (this.state.lastTime || currentTime);
        this.state.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    showEnding() {
        this.state.isPlaying = false;
        
        // 엔딩 크레딧
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Noto Sans KR';
        ctx.textAlign = 'center';
        ctx.fillText('THE END', this.canvas.width / 2, this.canvas.height / 2);
        
        ctx.fillStyle = 'white';
        ctx.font = '24px Noto Sans KR';
        ctx.fillText('터치하여 다시 시작', this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        // 다시 시작 이벤트
        const restart = () => {
            this.canvas.removeEventListener('touchstart', restart);
            this.canvas.removeEventListener('click', restart);
            this.state = new GameState();
            this.start();
        };
        
        this.canvas.addEventListener('touchstart', restart);
        this.canvas.addEventListener('click', restart);
    }
}

// 게임 시작
window.addEventListener('load', () => {
    new DragonBallZGame();
});
