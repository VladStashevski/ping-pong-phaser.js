import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene {
    private ball!: Phaser.GameObjects.Arc;
    private playerPaddle!: Phaser.GameObjects.Rectangle;
    private aiPaddle!: Phaser.GameObjects.Rectangle;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private playerScore: number = 0;
    private aiScore: number = 0;
    private playerScoreText!: Phaser.GameObjects.Text;
    private aiScoreText!: Phaser.GameObjects.Text;
    private ballVelocity: { x: number; y: number } = { x: 0, y: 0 };
    private ballSpeed: number = 300;
    private gameState: 'waiting' | 'playing' = 'waiting';
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private plusKey!: Phaser.Input.Keyboard.Key;
    private minusKey!: Phaser.Input.Keyboard.Key;
    private qKey!: Phaser.Input.Keyboard.Key;
    private eKey!: Phaser.Input.Keyboard.Key;
    private instructionText!: Phaser.GameObjects.Text;
    private speedText!: Phaser.GameObjects.Text;
    private difficultyText!: Phaser.GameObjects.Text;
    private isMobile: boolean = false;
    private gameWidth!: number;
    private gameHeight!: number;
    private paddleHeight!: number;
    private paddleWidth!: number;
    private ballRadius!: number;
    private aiDifficulty: number = 0.3;
    private touchSensitivity: number = 1.5; // Множитель чувствительности для мобильных устройств
    private lastTouchY: number = 0;

    constructor() {
        super('Game');
    }

    preload() {
    }

    create() {
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;

        this.paddleHeight = this.gameHeight * 0.25;
        this.paddleWidth = Math.max(8, this.gameWidth * 0.008);
        this.ballRadius = Math.max(10, Math.min(this.gameWidth, this.gameHeight) * 0.015);

        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || this.scale.displaySize.width <= 768;

        this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0x000000);

        this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, 2, this.gameHeight, 0xffffff);

        this.ball = this.add.circle(this.gameWidth / 2, this.gameHeight / 2, this.ballRadius, 0xffffff);
        this.ball.setStrokeStyle(1, 0xffffff);

        this.playerPaddle = this.add.rectangle(this.paddleWidth / 2, this.gameHeight / 2, this.paddleWidth, this.paddleHeight, 0xffffff);
        this.playerPaddle.setStrokeStyle(1, 0xffffff);

        this.aiPaddle = this.add.rectangle(this.gameWidth - this.paddleWidth / 2, this.gameHeight / 2, this.paddleWidth, this.paddleHeight, 0xffffff);
        this.aiPaddle.setStrokeStyle(1, 0xffffff);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.plusKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
        this.minusKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
        this.qKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);


        if (this.isMobile) {
            this.input.on('pointerdown', this.handleTouch, this);
            this.input.on('pointermove', this.handleTouchMove, this);
        }


        const scoreFontSize = Math.max(32, this.gameWidth * 0.04);
        this.playerScoreText = this.add.text(this.gameWidth * 0.25, this.gameHeight * 0.1, '0', {
            fontSize: `${scoreFontSize}px`,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.aiScoreText = this.add.text(this.gameWidth * 0.75, this.gameHeight * 0.1, '0', {
            fontSize: `${scoreFontSize}px`,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);


        const instructionFontSize = Math.max(16, this.gameWidth * 0.02);
        const instructionMessage = this.isMobile ? 'Коснитесь экрана для начала игры' : 'Нажмите ПРОБЕЛ для начала игры';
        this.instructionText = this.add.text(this.gameWidth / 2, this.gameHeight * 0.4, instructionMessage, {
            fontSize: `${instructionFontSize}px`,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);


        const speedFontSize = Math.max(14, this.gameWidth * 0.015);
        this.speedText = this.add.text(this.gameWidth / 2, this.gameHeight * 0.9, `Скорость: ${this.ballSpeed}`, {
            fontSize: `${speedFontSize}px`,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        if (!this.isMobile) {
            this.speedText.setText(`Скорость: ${this.ballSpeed} (+/- для изменения)`);
        }


        const difficultyFontSize = Math.max(14, this.gameWidth * 0.015);
        const difficultyLevel = this.aiDifficulty < 0.3 ? 'Легко' : this.aiDifficulty < 0.6 ? 'Средне' : 'Сложно';
        this.difficultyText = this.add.text(this.gameWidth / 2, this.gameHeight * 0.85, `Сложность ИИ: ${difficultyLevel}`, {
            fontSize: `${difficultyFontSize}px`,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        if (!this.isMobile) {
            this.difficultyText.setText(`Сложность ИИ: ${difficultyLevel} (Q/E для изменения)`);
        }


        this.ball.setPosition(this.gameWidth / 2, this.gameHeight / 2);
        this.ballVelocity = { x: 0, y: 0 };


        this.scale.on('resize', this.handleResize, this);

        EventBus.emit('current-scene-ready', this);
    }


    public setBallSpeed(speed: number): void {
        this.ballSpeed = Math.max(50, Math.min(1000, speed));
    }

    public getBallSpeed(): number {
        return this.ballSpeed;
    }

    public increaseBallSpeed(amount: number = 50): void {
        this.setBallSpeed(this.ballSpeed + amount);
    }

    public decreaseBallSpeed(amount: number = 50): void {
        this.setBallSpeed(this.ballSpeed - amount);
    }


    public setAIDifficulty(difficulty: number): void {
        this.aiDifficulty = Math.max(0.1, Math.min(0.9, difficulty));
    }

    public getAIDifficulty(): number {
        return this.aiDifficulty;
    }

    public increaseAIDifficulty(amount: number = 0.1): void {
        this.setAIDifficulty(this.aiDifficulty + amount);
    }

    public decreaseAIDifficulty(amount: number = 0.1): void {
        this.setAIDifficulty(this.aiDifficulty - amount);
    }

    // Методы для настройки чувствительности касаний
    public setTouchSensitivity(sensitivity: number): void {
        this.touchSensitivity = Math.max(0.1, Math.min(5.0, sensitivity));
    }

    public getTouchSensitivity(): number {
        return this.touchSensitivity;
    }

    public increaseTouchSensitivity(amount: number = 0.1): void {
        this.setTouchSensitivity(this.touchSensitivity + amount);
    }

    public decreaseTouchSensitivity(amount: number = 0.1): void {
        this.setTouchSensitivity(this.touchSensitivity - amount);
    }

    private updateSpeedDisplay(): void {
        if (this.isMobile) {
            this.speedText.setText(`Скорость: ${this.ballSpeed}`);
        } else {
            this.speedText.setText(`Скорость: ${this.ballSpeed} (+/- для изменения)`);
        }
    }

    private updateDifficultyDisplay(): void {
        const difficultyLevel = this.aiDifficulty < 0.3 ? 'Легко' : this.aiDifficulty < 0.6 ? 'Средне' : 'Сложно';
        if (this.isMobile) {
            this.difficultyText.setText(`Сложность ИИ: ${difficultyLevel}`);
        } else {
            this.difficultyText.setText(`Сложность ИИ: ${difficultyLevel} (Q/E для изменения)`);
        }
    }

    update() {

        if (this.gameState === 'waiting' && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.gameState = 'playing';
            this.instructionText.setVisible(false);
            this.resetBall();
        }


        if (Phaser.Input.Keyboard.JustDown(this.plusKey)) {
            this.increaseBallSpeed();
            this.updateSpeedDisplay();
        }
        if (Phaser.Input.Keyboard.JustDown(this.minusKey)) {
            this.decreaseBallSpeed();
            this.updateSpeedDisplay();
        }


        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.increaseAIDifficulty();
            this.updateDifficultyDisplay();
        }
        if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
            this.decreaseAIDifficulty();
            this.updateDifficultyDisplay();
        }


        if (this.gameState !== 'playing') {
            return;
        }


        const paddleSpeed = this.gameHeight * 0.008;
        const paddleBounds = this.paddleHeight / 2;

        if (!this.isMobile) {
            if (this.cursors.up.isDown && this.playerPaddle.y > paddleBounds) {
                this.playerPaddle.y -= paddleSpeed;
            } else if (this.cursors.down.isDown && this.playerPaddle.y < this.gameHeight - paddleBounds) {
                this.playerPaddle.y += paddleSpeed;
            }
        }


        const ballY = this.ball.y;
        const aiPaddleY = this.aiPaddle.y;
        let aiSpeed = paddleSpeed * (0.4 + this.aiDifficulty * 0.4);


        const mistakeChance = (1 - this.aiDifficulty) * 0.3;
        const mistake = Math.random();

        if (mistake < mistakeChance) {
            const mistakeType = Math.random();
            if (mistakeType < 0.4) {
                aiSpeed = -aiSpeed * 0.5;
            } else if (mistakeType < 0.7) {
                aiSpeed = 0;
            } else {
                aiSpeed *= 0.2;
            }
        }


        const ballMovingTowardsAI = this.ballVelocity.x > 0;
        if (!ballMovingTowardsAI) {
            aiSpeed *= (0.2 + this.aiDifficulty * 0.3);
        }


        const predictionError = (1 - this.aiDifficulty) * 60;
        const targetY = ballY + (Math.random() - 0.5) * predictionError;

        const deadZone = 10 + (1 - this.aiDifficulty) * 20;

        if (targetY < aiPaddleY - deadZone && this.aiPaddle.y > paddleBounds) {
            this.aiPaddle.y -= aiSpeed;
        } else if (targetY > aiPaddleY + deadZone && this.aiPaddle.y < this.gameHeight - paddleBounds) {
            this.aiPaddle.y += aiSpeed;
        }


        this.ball.x += this.ballVelocity.x;
        this.ball.y += this.ballVelocity.y;


        if (this.ball.y <= this.ballRadius || this.ball.y >= this.gameHeight - this.ballRadius) {
            this.ballVelocity.y = -this.ballVelocity.y;

            this.ball.y = Math.max(this.ballRadius, Math.min(this.gameHeight - this.ballRadius, this.ball.y));
        }


        if (this.checkCollision(this.ball, this.playerPaddle)) {
            this.hitPaddle(this.playerPaddle);
        } else if (this.checkCollision(this.ball, this.aiPaddle)) {
            this.hitPaddle(this.aiPaddle);
        }


        if (this.ball.x < -this.ballRadius) {
            this.aiScore++;
            this.aiScoreText.setText(this.aiScore.toString());
            this.gameState = 'waiting';
            this.instructionText.setVisible(true);
            this.ball.setPosition(this.gameWidth / 2, this.gameHeight / 2);
            this.ballVelocity = { x: 0, y: 0 };
            this.playerPaddle.setPosition(this.paddleWidth / 2, this.gameHeight / 2);
            this.aiPaddle.setPosition(this.gameWidth - this.paddleWidth / 2, this.gameHeight / 2);
        } else if (this.ball.x > this.gameWidth + this.ballRadius) {
            this.playerScore++;
            this.playerScoreText.setText(this.playerScore.toString());
            this.gameState = 'waiting';
            this.instructionText.setVisible(true);
            this.ball.setPosition(this.gameWidth / 2, this.gameHeight / 2);
            this.ballVelocity = { x: 0, y: 0 };
            this.playerPaddle.setPosition(this.paddleWidth / 2, this.gameHeight / 2);
            this.aiPaddle.setPosition(this.gameWidth - this.paddleWidth / 2, this.gameHeight / 2);
        }
    }

    private checkCollision(ball: Phaser.GameObjects.Arc, paddle: Phaser.GameObjects.Rectangle): boolean {
        const ballRadius = this.ballRadius;
        const paddleHalfWidth = this.paddleWidth / 2;
        const paddleHalfHeight = this.paddleHeight / 2;

        return ball.x - ballRadius < paddle.x + paddleHalfWidth &&
            ball.x + ballRadius > paddle.x - paddleHalfWidth &&
            ball.y - ballRadius < paddle.y + paddleHalfHeight &&
            ball.y + ballRadius > paddle.y - paddleHalfHeight;
    }

    private hitPaddle(paddle: Phaser.GameObjects.Rectangle): void {
        const diff = this.ball.y - paddle.y;
        const normalizedDiff = diff / (this.paddleHeight / 2);
        const angle = normalizedDiff * 0.5;

        const direction = paddle.x < this.gameWidth / 2 ? 1 : -1;
        const speed = this.ballSpeed * (this.game.loop.delta / 1000);
        this.ballVelocity.x = speed * direction;
        this.ballVelocity.y = speed * angle;
    }

    private resetBall(): void {
        this.ball.setPosition(this.gameWidth / 2, this.gameHeight / 2);

        const angle = (Math.random() - 0.5) * 0.5;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const speed = this.ballSpeed * (this.game.loop.delta / 1000);

        this.ballVelocity.x = speed * direction;
        this.ballVelocity.y = speed * angle;
    }

    private handleTouch(pointer: Phaser.Input.Pointer): void {
        if (this.gameState === 'waiting') {
            this.gameState = 'playing';
            this.instructionText.setVisible(false);
            this.resetBall();
        }

        // Запоминаем начальную позицию касания
        this.lastTouchY = pointer.y;
    }

    private handleTouchMove(pointer: Phaser.Input.Pointer): void {
        if (this.gameState === 'playing' && this.isMobile) {
            // Вычисляем разность движения пальца
            const deltaY = pointer.y - this.lastTouchY;

            // Применяем множитель чувствительности
            const sensitiveMovement = deltaY * this.touchSensitivity;

            // Новая позиция ракетки
            const newY = this.playerPaddle.y + sensitiveMovement;

            const paddleBounds = this.paddleHeight / 2;

            // Ограничиваем движение границами экрана
            if (newY >= paddleBounds && newY <= this.gameHeight - paddleBounds) {
                this.playerPaddle.y = newY;
            } else {
                // Если выходим за границы, ставим на границу
                this.playerPaddle.y = Math.max(paddleBounds, Math.min(this.gameHeight - paddleBounds, newY));
            }

            this.lastTouchY = pointer.y;
        }
    }

    private handleResize(): void {
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;


        this.paddleHeight = this.gameHeight * 0.25;
        this.paddleWidth = Math.max(8, this.gameWidth * 0.008);
        this.ballRadius = Math.max(10, Math.min(this.gameWidth, this.gameHeight) * 0.015);


        const background = this.children.getAt(0) as Phaser.GameObjects.Rectangle;
        background.setSize(this.gameWidth, this.gameHeight);
        background.setPosition(this.gameWidth / 2, this.gameHeight / 2);


        const centerLine = this.children.getAt(1) as Phaser.GameObjects.Rectangle;
        centerLine.setSize(2, this.gameHeight);
        centerLine.setPosition(this.gameWidth / 2, this.gameHeight / 2);


        this.ball.setRadius(this.ballRadius);


        this.playerPaddle.setSize(this.paddleWidth, this.paddleHeight);
        this.playerPaddle.setPosition(this.paddleWidth / 2, this.gameHeight / 2);

        this.aiPaddle.setSize(this.paddleWidth, this.paddleHeight);
        this.aiPaddle.setPosition(this.gameWidth - this.paddleWidth / 2, this.gameHeight / 2);


        const scoreFontSize = Math.max(32, this.gameWidth * 0.04);
        this.playerScoreText.setPosition(this.gameWidth * 0.25, this.gameHeight * 0.1);
        this.playerScoreText.setFontSize(scoreFontSize);

        this.aiScoreText.setPosition(this.gameWidth * 0.75, this.gameHeight * 0.1);
        this.aiScoreText.setFontSize(scoreFontSize);

        const instructionFontSize = Math.max(16, this.gameWidth * 0.02);
        this.instructionText.setPosition(this.gameWidth / 2, this.gameHeight * 0.4);
        this.instructionText.setFontSize(instructionFontSize);

        const speedFontSize = Math.max(14, this.gameWidth * 0.015);
        this.speedText.setPosition(this.gameWidth / 2, this.gameHeight * 0.9);
        this.speedText.setFontSize(speedFontSize);

        const difficultyFontSize = Math.max(14, this.gameWidth * 0.015);
        this.difficultyText.setPosition(this.gameWidth / 2, this.gameHeight * 0.85);
        this.difficultyText.setFontSize(difficultyFontSize);
    }
}
