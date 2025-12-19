class MazeGame {
    constructor() {
        this.currentScreen = 'start-screen';
        this.currentLevel = null;
        this.customLevels = this.loadCustomLevels();
        this.player = {
            x: 0,
            y: 0,
            lives: 3,
            inventory: [],
            hasSword: false
        };
        this.maze = {
            grid: [],
            width: 10,
            height: 10,
            start: { x: 0, y: 0 },
            end: { x: 9, y: 9 }
        };
        this.gameState = 'playing'; // 'playing', 'paused', 'won', 'lost'
        this.editMode = false;
        this.currentTool = 'wall';
        this.customMaze = null;
        this.mazeHistory = [];
        this.historyIndex = -1;
        this.trains = [];
        this.pacmen = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // 检查是否有分享的关卡
        if (!this.checkSharedLevel()) {
            this.showScreen('start-screen');
        }
        
        this.updateCustomLevelButtons();
    }

    setupEventListeners() {
        // 开始界面
        document.getElementById('start-button').addEventListener('click', () => {
            this.showScreen('level-select-screen');
        });

        // 分享模态框
        const shareModal = document.getElementById('share-modal');
        const closeButton = document.querySelector('.close-button');
        const copyButton = document.getElementById('copy-link-button');

        closeButton.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });

        copyButton.addEventListener('click', () => {
            const shareLink = document.getElementById('share-link');
            shareLink.select();
            document.execCommand('copy');
            
            const copySuccess = document.getElementById('copy-success');
            copySuccess.style.display = 'block';
            setTimeout(() => {
                copySuccess.style.display = 'none';
            }, 2000);
        });

        window.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.style.display = 'none';
            }
        });



        document.getElementById('custom-level-button').addEventListener('click', () => {
            this.enterEditMode();
        });

        const levelSelect = document.getElementById('level-select');
        const editLevelButton = document.getElementById('edit-level-button');

        editLevelButton.addEventListener('click', () => {
            const selectedLevelId = levelSelect.value;
            if (selectedLevelId) {
                const levelData = this.customLevels[selectedLevelId];
                if (levelData) {
                    console.log('加载关卡数据:', levelData);
                    this.showScreen('edit-screen');
                    this.loadLevelForEditing(levelData);
                } else {
                    alert('无法加载关卡数据！');
                }
            } else {
                alert('请先选择一个关卡！');
            }
        });

        document.getElementById('back-to-start-button').addEventListener('click', () => {
            this.showScreen('start-screen');
        });

        // 游戏控制
        document.getElementById('pause-button').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartLevel();
        });

        // 暂停界面
        document.getElementById('resume-button').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('exit-to-levels-button').addEventListener('click', () => {
            this.showScreen('level-select-screen');
        });

        // 结果界面
        document.getElementById('restart-level-button').addEventListener('click', () => {
            this.restartLevel();
        });

        document.getElementById('next-level-button').addEventListener('click', () => {
            this.loadNextLevel();
        });

        document.getElementById('back-to-levels-result-button').addEventListener('click', () => {
            this.showScreen('level-select-screen');
        });

        // 编辑模式
        document.querySelectorAll('.tool-button').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTool = e.target.dataset.tool;
            });
        });

        document.getElementById('set-start-button').addEventListener('click', () => {
            this.currentTool = 'start';
            document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        });

        document.getElementById('set-end-button').addEventListener('click', () => {
            this.currentTool = 'end';
            document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        });

        document.getElementById('clear-button').addEventListener('click', () => {
            this.saveToHistory();
            this.clearMaze();
        });

        document.getElementById('undo-button').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redo-button').addEventListener('click', () => {
            this.redo();
        });

        document.getElementById('save-button').addEventListener('click', () => {
            this.saveCustomMaze();
        });

        document.getElementById('exit-edit-button').addEventListener('click', () => {
            this.showScreen('level-select-screen');
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.movePlayer(1, 0);
                    break;
                case ' ':
                    this.useItem();
                    break;
                case 'p':
                case 'P':
                    this.pauseGame();
                    break;
            }
        });

        // 圆盘方向触控控制
        this.setupTouchControl();
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;

        if (screenId === 'game-screen' && this.gameState === 'playing') {
            this.updateGameDisplay();
        }
    }

    loadLevel(level) {
        this.currentLevel = level;
        
        // 加载自定义关卡或生成新关卡
        if (this.customLevels[level]) {
            this.maze = JSON.parse(JSON.stringify(this.customLevels[level].maze));
        } else {
            // 生成新关卡
            this.generateLevel(level);
        }
        
        // 在迷宫设置完成后再重置玩家位置
        this.resetPlayer();
        
        this.createMazeDisplay();
        this.updateGameDisplay();
        this.startGameLoop();
        this.showScreen('game-screen');
        this.gameState = 'playing';
    }

    generateLevel(level) {
        // 根据关卡难度生成迷宫
        let width, height;
        
        switch (level) {
            case 1:
                width = 8;
                height = 8;
                break;
            case 2:
                width = 10;
                height = 10;
                break;
            case 3:
                width = 12;
                height = 12;
                break;
            default:
                width = 8;
                height = 8;
        }

        this.maze.width = width;
        this.maze.height = height;
        
        // 使用DFS算法生成连通的迷宫
        this.generateDFSMaze(width, height);

        // 根据关卡设置起点和终点
        this.maze.start = { x: 1, y: 1 };
        this.maze.end = { x: width - 2, y: height - 2 };
        this.maze.grid[this.maze.start.y][this.maze.start.x] = 'start';
        this.maze.grid[this.maze.end.y][this.maze.end.x] = 'end';

        // 根据关卡添加额外的障碍物、陷阱和道具
        this.addExtraWalls(level);
        this.addTraps(level);
        this.addItems(level);
    }

    generateDFSMaze(width, height) {
        // 初始化网格，所有单元格都是墙
        this.maze.grid = [];
        for (let y = 0; y < height; y++) {
            this.maze.grid[y] = [];
            for (let x = 0; x < width; x++) {
                this.maze.grid[y][x] = 'wall';
            }
        }

        // DFS迷宫生成
        const startX = 1;
        const startY = 1;
        
        // 标记起点为通路
        this.maze.grid[startY][startX] = '';
        
        // 定义四个方向：上、右、下、左
        const directions = [
            { dx: 0, dy: -2 }, // 上
            { dx: 2, dy: 0 },  // 右
            { dx: 0, dy: 2 },  // 下
            { dx: -2, dy: 0 }  // 左
        ];
        
        // DFS函数
        const dfs = (x, y) => {
            // 随机打乱方向
            this.shuffleArray(directions);
            
            // 尝试每个方向
            for (const dir of directions) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                // 检查是否在边界内且是墙
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && this.maze.grid[ny][nx] === 'wall') {
                    // 打通当前单元格到新单元格的墙
                    this.maze.grid[ny][nx] = '';
                    this.maze.grid[y + dir.dy / 2][x + dir.dx / 2] = '';
                    
                    // 递归处理新单元格
                    dfs(nx, ny);
                }
            }
        };
        
        // 从起点开始生成迷宫
        dfs(startX, startY);
        
        // 确保终点是通路
        this.maze.grid[height - 2][width - 2] = '';
        
        // 确保从起点到终点有路径
        this.ensurePath();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    ensurePath() {
        // 确保从起点到终点有一条清晰的路径
        let x = this.maze.start.x;
        let y = this.maze.start.y;
        
        // 简单的路径确保：从起点向右/向下移动直到接近终点
        while (x < this.maze.end.x - 1) {
            this.maze.grid[y][x + 1] = '';
            x++;
        }
        
        while (y < this.maze.end.y - 1) {
            this.maze.grid[y + 1][x] = '';
            y++;
        }
    }

    addExtraWalls(level) {
        // 添加额外的墙壁，但确保不会阻塞路径
        const maxExtraWalls = Math.floor((this.maze.width * this.maze.height) / 8);
        let placedWalls = 0;
        let attempts = 0;
        const maxAttempts = 100;

        while (placedWalls < maxExtraWalls && attempts < maxAttempts) {
            attempts++;
            const x = Math.floor(Math.random() * (this.maze.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.maze.height - 2)) + 1;

            // 确保不在起点、终点或已有障碍物上放置
            if (this.maze.grid[y][x] === '' && 
                !(x === this.maze.start.x && y === this.maze.start.y) && 
                !(x === this.maze.end.x && y === this.maze.end.y)) {
                
                // 临时放置墙壁
                this.maze.grid[y][x] = 'wall';
                
                // 检查是否仍然有从起点到终点的路径
                if (this.hasPath()) {
                    placedWalls++;
                } else {
                    // 如果阻塞了路径，移除墙壁
                    this.maze.grid[y][x] = '';
                }
            }
        }
    }
    
    hasPath() {
        // 使用BFS检查是否有从起点到终点的路径
        const queue = [];
        const visited = [];
        
        // 初始化访问数组
        for (let y = 0; y < this.maze.height; y++) {
            visited[y] = [];
            for (let x = 0; x < this.maze.width; x++) {
                visited[y][x] = false;
            }
        }
        
        // 将起点加入队列
        queue.push({ x: this.maze.start.x, y: this.maze.start.y });
        visited[this.maze.start.y][this.maze.start.x] = true;
        
        // 定义四个方向：上、右、下、左
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }  // 左
        ];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // 如果到达终点，返回true
            if (current.x === this.maze.end.x && current.y === this.maze.end.y) {
                return true;
            }
            
            // 检查四个方向
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                
                // 检查是否在边界内、未访问过且不是墙
                if (nx >= 0 && nx < this.maze.width && ny >= 0 && ny < this.maze.height && 
                    !visited[ny][nx] && this.maze.grid[ny][nx] !== 'wall') {
                    
                    queue.push({ x: nx, y: ny });
                    visited[ny][nx] = true;
                }
            }
        }
        
        // 如果无法到达终点，返回false
        return false;
    }

    addTraps(level) {
        // 添加陷阱
        const trapTypes = ['bomb', 'radiation', 'manhole', 'elevator'];
        const trapCount = level * 2;
        let placedTraps = 0;
        let attempts = 0;
        const maxAttempts = 200;

        // 先保存当前网格状态，用于回滚
        let originalGrid = JSON.stringify(this.maze.grid);

        while (placedTraps < trapCount && attempts < maxAttempts) {
            attempts++;
            const x = Math.floor(Math.random() * (this.maze.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.maze.height - 2)) + 1;
            const trapType = trapTypes[Math.floor(Math.random() * trapTypes.length)];

            // 确保不在起点、终点或已有障碍物上放置
            if (this.maze.grid[y][x] === '' && 
                !(x === this.maze.start.x && y === this.maze.start.y) && 
                !(x === this.maze.end.x && y === this.maze.end.y)) {
                
                // 临时放置陷阱
                this.maze.grid[y][x] = trapType;
                
                // 检查是否仍然有从起点到终点的路径
                if (this.hasPath()) {
                    placedTraps++;
                    // 更新原始网格状态
                    originalGrid = JSON.stringify(this.maze.grid);
                } else {
                    // 如果阻塞了路径，回滚到之前的状态
                    this.maze.grid = JSON.parse(originalGrid);
                }
            }
        }



        if (level >= 3) {
            // 保存当前状态，用于回滚火车轨道
            originalGrid = JSON.stringify(this.maze.grid);
            
            // 添加火车轨道
            this.addTrainTrack();
            
            // 检查添加火车轨道后是否仍然有路径
            if (!this.hasPath()) {
                // 如果阻塞了路径，回滚到添加轨道前的状态
                this.maze.grid = JSON.parse(originalGrid);
                // 尝试添加较少的轨道
                this.addSparseTrainTrack();
            }
        }
    }
    
    addSparseTrainTrack() {
        // 添加较少的火车轨道，确保不会阻塞路径
        const isHorizontal = Math.random() > 0.5;
        const trackLength = Math.floor((isHorizontal ? this.maze.width : this.maze.height) / 3);
        
        if (isHorizontal) {
            // 水平轨道
            const y = Math.floor(Math.random() * (this.maze.height - 4)) + 2;
            const startX = Math.floor(Math.random() * (this.maze.width - trackLength - 2)) + 1;
            
            for (let x = startX; x < startX + trackLength; x++) {
                if (this.maze.grid[y][x] === '') {
                    this.maze.grid[y][x] = 'train';
                }
            }
        } else {
            // 垂直轨道
            const x = Math.floor(Math.random() * (this.maze.width - 4)) + 2;
            const startY = Math.floor(Math.random() * (this.maze.height - trackLength - 2)) + 1;
            
            for (let y = startY; y < startY + trackLength; y++) {
                if (this.maze.grid[y][x] === '') {
                    this.maze.grid[y][x] = 'train';
                }
            }
        }
    }

    addTrainTrack() {
        // 随机选择轨道方向
        const isHorizontal = Math.random() > 0.5;
        
        if (isHorizontal) {
            // 水平轨道
            const y = Math.floor(Math.random() * (this.maze.height - 4)) + 2;
            for (let x = 1; x < this.maze.width - 1; x++) {
                if (this.maze.grid[y][x] === '') {
                    this.maze.grid[y][x] = 'train';
                }
            }
        } else {
            // 垂直轨道
            const x = Math.floor(Math.random() * (this.maze.width - 4)) + 2;
            for (let y = 1; y < this.maze.height - 1; y++) {
                if (this.maze.grid[y][x] === '') {
                    this.maze.grid[y][x] = 'train';
                }
            }
        }
    }

    addItems(level) {
        // 添加道具
        const itemTypes = ['lollipop', 'map', 'sword'];
        const itemCount = Math.min(level + 1, 5);

        for (let i = 0; i < itemCount; i++) {
            const x = Math.floor(Math.random() * (this.maze.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.maze.height - 2)) + 1;
            const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

            if (this.maze.grid[y][x] === '') {
                this.maze.grid[y][x] = itemType;
            }
        }

        // 终点设置为普通出口，不直接放置宝箱
        this.maze.grid[this.maze.end.y][this.maze.end.x] = 'end';
        
        // 在迷宫中随机位置放置宝箱，但确保有路径可达
        this.placeChest();
    }
    
    placeChest() {
        // 在迷宫中找一个合适的位置放置宝箱
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            attempts++;
            const x = Math.floor(Math.random() * (this.maze.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.maze.height - 2)) + 1;
            
            // 确保不在起点、终点或已有障碍物上放置
            if (this.maze.grid[y][x] === '' && 
                !(x === this.maze.start.x && y === this.maze.start.y) && 
                !(x === this.maze.end.x && y === this.maze.end.y)) {
                
                this.maze.grid[y][x] = 'chest';
                return;
            }
        }
        
        // 如果找不到合适位置，就放在终点旁边
        const endX = this.maze.end.x;
        const endY = this.maze.end.y;
        
        // 检查终点周围的四个方向
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }  // 左
        ];
        
        for (const dir of directions) {
            const x = endX + dir.dx;
            const y = endY + dir.dy;
            
            if (x > 0 && x < this.maze.width - 1 && y > 0 && y < this.maze.height - 1 && this.maze.grid[y][x] === '') {
                this.maze.grid[y][x] = 'chest';
                return;
            }
        }
    }

    createMazeDisplay() {
        const container = document.getElementById('maze-container');
        container.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'maze-grid';
        grid.style.gridTemplateColumns = `repeat(${this.maze.width}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${this.maze.height}, 1fr)`;

        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell';
                // 添加data-x和data-y属性
                cell.dataset.x = x;
                cell.dataset.y = y;
                if (this.maze.grid[y][x]) {
                    cell.classList.add(this.maze.grid[y][x]);
                }
                grid.appendChild(cell);
            }
        }

        container.appendChild(grid);

        // 创建玩家
        this.playerElement = document.createElement('div');
        this.playerElement.className = 'player';
        container.appendChild(this.playerElement);

        // 初始化玩家位置
        this.updatePlayerPosition();
    }

    updatePlayerPosition() {
        const cellSize = 100 / this.maze.width;
        this.playerElement.style.left = `${this.player.x * cellSize}%`;
        this.playerElement.style.top = `${this.player.y * cellSize}%`;
    }

    resetPlayer() {
        this.player.x = this.maze.start.x;
        this.player.y = this.maze.start.y;
        this.player.lives = 3;
        this.player.inventory = [];
        this.player.hasSword = false;
        this.trains = [];
        this.pacmen = [];
    }

    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // 检查边界
        if (newX < 0 || newX >= this.maze.width || newY < 0 || newY >= this.maze.height) {
            return;
        }

        // 检查墙壁
        if (this.maze.grid[newY][newX] === 'wall') {
            return;
        }

        // 检查道具（先检查道具，再检查陷阱，确保玩家能先收集宝剑）
        const isItem = this.isItem(this.maze.grid[newY][newX]);
        if (isItem) {
            this.collectItem(this.maze.grid[newY][newX]);
            this.maze.grid[newY][newX] = '';
            this.updateMazeDisplay();
            
            // 收集道具后直接更新玩家位置
            this.player.x = newX;
            this.player.y = newY;
            this.updatePlayerPosition();
            return;
        }

        // 检查陷阱
        if (this.isTrap(this.maze.grid[newY][newX])) {
            this.triggerTrap(this.maze.grid[newY][newX]);
            return;
        }

        // 检查终点
        if (this.maze.grid[newY][newX] === 'end') {
            // 到达终点后，显示宝箱位置
            this.revealChest();
            return;
        }
        
        // 检查宝箱
        if (this.maze.grid[newY][newX] === 'chest') {
            this.winLevel();
            return;
        }

        // 更新玩家位置
        this.player.x = newX;
        this.player.y = newY;
        this.updatePlayerPosition();
        
        // 玩家移动后立即检查碰撞
        this.checkCollisions();
    }
    
    revealChest() {
        // 找到宝箱位置
        let chestX = -1;
        let chestY = -1;
        
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                if (this.maze.grid[y][x] === 'chest') {
                    chestX = x;
                    chestY = y;
                    break;
                }
            }
            if (chestX !== -1) break;
        }
        
        if (chestX !== -1) {
            // 显示宝箱位置（闪烁效果）
            const cells = document.querySelectorAll('.maze-cell');
            const chestIndex = chestY * this.maze.width + chestX;
            const chestCell = cells[chestIndex];
            
            if (chestCell) {
                chestCell.style.animation = 'blink 0.5s infinite';
                
                // 显示提示消息
                const message = document.createElement('div');
                message.className = 'game-message';
                message.textContent = '你找到了出口！现在去寻找隐藏的宝箱吧！';
                message.style.position = 'absolute';
                message.style.top = '50%';
                message.style.left = '50%';
                message.style.transform = 'translate(-50%, -50%)';
                message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                message.style.color = 'white';
                message.style.padding = '20px';
                message.style.borderRadius = '10px';
                message.style.zIndex = '1000';
                message.style.fontSize = '18px';
                message.style.textAlign = 'center';
                
                document.getElementById('maze-container').appendChild(message);
                
                // 3秒后隐藏消息
                setTimeout(() => {
                    message.remove();
                }, 3000);
            }
        }
    }

    isTrap(cell) {
        return ['bomb', 'radiation', 'manhole', 'elevator', 'train', 'pacman'].includes(cell);
    }

    isItem(cell) {
        return ['lollipop', 'map', 'sword'].includes(cell);
    }

    triggerTrap(trapType) {
        switch (trapType) {
            case 'bomb':
                this.createExplosion(this.player.x, this.player.y);
                this.loseLife();
                break;
            case 'radiation':
                this.loseLife();
                break;
            case 'manhole':
                this.loseLife();
                break;
            case 'elevator':
                this.loseLife();
                break;

            case 'train':
                this.loseLife();
                break;
            
            case 'pacman':
                if (this.player.hasSword) {
                    // 玩家有宝剑，击败食人鬼
                    this.defeatPacman(this.player.x, this.player.y);
                    this.showMessage('你用宝剑击败了食人鬼！');
                } else {
                    // 玩家没有宝剑，失去生命
                    this.loseLife();
                    this.showMessage('食人鬼吃掉了你！');
                }
                break;
        }
    }



    createExplosion(x, y) {
        const container = document.getElementById('maze-container');
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        
        const cellSize = 100 / this.maze.width;
        explosion.style.left = `${x * cellSize}%`;
        explosion.style.top = `${y * cellSize}%`;
        
        container.appendChild(explosion);
        
        setTimeout(() => {
            explosion.remove();
        }, 500);
    }

    defeatPacman(x, y) {
        // 将食人鬼改为战败状态
        this.maze.grid[y][x] = 'pacman-defeated';
        
        // 更新迷宫显示
        this.updateMazeDisplay();
        
        // 创建击败动画效果
        const cell = document.querySelector(`.maze-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add('collect');
            setTimeout(() => {
                cell.classList.remove('collect');
            }, 300);
        }
    }

    collectItem(itemType) {
        // 创建收集动画
        const cell = document.querySelector(`.maze-cell.${itemType}`);
        if (cell) {
            cell.classList.add('collect');
            setTimeout(() => {
                cell.classList.remove('collect');
            }, 300);
        }
        
        // 特殊处理宝剑
        if (itemType === 'sword') {
            // 直接给予玩家宝剑效果
            this.player.hasSword = true;
            // 显示持有宝剑提示
            this.showMessage('你获得了宝剑！');
        } else {
            // 其他物品则添加到物品栏
            this.player.inventory.push(itemType);
        }
        
        this.updateGameDisplay();
    }

    useItem() {
        if (this.player.inventory.length === 0) return;

        const item = this.player.inventory.pop();
        switch (item) {
            case 'map':
                this.showMap();
                break;
            case 'sword':
                // 使用宝剑道具，获得宝剑效果
                this.player.hasSword = true;
                this.showItemMessage('你使用了宝剑！');
                break;
        }
        
        this.updateGameDisplay();
    }

    showMap() {
        // 显示地图效果
        const cells = document.querySelectorAll('.maze-cell');
        cells.forEach(cell => {
            if (cell.classList.contains('end') || cell.classList.contains('chest')) {
                cell.style.animation = 'blink 1s infinite';
            }
        });
        
        setTimeout(() => {
            cells.forEach(cell => {
                cell.style.animation = '';
            });
        }, 5000);
    }



    loseLife() {
        this.player.lives--;
        this.updateGameDisplay();
        
        if (this.player.lives <= 0) {
            this.loseLevel();
        } else {
            // 重置玩家位置
            this.player.x = this.maze.start.x;
            this.player.y = this.maze.start.y;
            this.updatePlayerPosition();
        }
    }

    updateGameDisplay() {
        // 更新关卡信息
        document.getElementById('current-level').textContent = this.currentLevel;
        
        // 更新生命值
        const livesContainer = document.getElementById('lives');
        livesContainer.innerHTML = '';
        for (let i = 0; i < this.player.lives; i++) {
            const life = document.createElement('div');
            life.className = 'life';
            livesContainer.appendChild(life);
        }
        
        // 更新道具栏
        const inventoryContainer = document.getElementById('inventory');
        inventoryContainer.innerHTML = '';
        this.player.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.classList.add(item);
            inventoryContainer.appendChild(itemElement);
        });
    }

    updateMazeDisplay() {
        const cells = document.querySelectorAll('.maze-cell');
        let index = 0;
        
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                const cell = cells[index++];
                cell.className = 'maze-cell';
                // 添加data-x和data-y属性
                cell.dataset.x = x;
                cell.dataset.y = y;
                if (this.maze.grid[y][x]) {
                    cell.classList.add(this.maze.grid[y][x]);
                }
            }
        }
    }

    startGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        
        this.gameLoopInterval = setInterval(() => {
            if (this.gameState !== 'playing') return;
            
            this.updateTrains();
            this.updatePacmen();
            this.checkCollisions();
        }, 500);
    }

    setupTouchControl() {
        const touchCircle = document.querySelector('.touch-circle');
        const touchKnob = document.querySelector('.touch-knob');
        if (!touchCircle || !touchKnob) return;

        let isTouching = false;
        let centerX, centerY;

        const getTouchPosition = (e) => {
            const rect = touchCircle.getBoundingClientRect();
            const touch = e.touches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        };

        const updateKnobPosition = (pos) => {
            const maxDistance = touchCircle.offsetWidth / 2 - touchKnob.offsetWidth / 2;
            const dx = pos.x - centerX;
            const dy = pos.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const ratio = Math.min(distance / maxDistance, 1);

            const knobX = centerX + (dx / distance) * ratio * maxDistance;
            const knobY = centerY + (dy / distance) * ratio * maxDistance;

            touchKnob.style.transform = `translate(${knobX - touchKnob.offsetWidth / 2}px, ${knobY - touchKnob.offsetHeight / 2}px)`;
        };

        const resetKnobPosition = () => {
            touchKnob.style.transform = 'translate(0, 0)';
        };

        const determineDirection = (pos) => {
            const dx = pos.x - centerX;
            const dy = pos.y - centerY;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            if (angle >= -45 && angle < 45) {
                return { dx: 1, dy: 0 }; // 右
            } else if (angle >= 45 && angle < 135) {
                return { dx: 0, dy: 1 }; // 下
            } else if (angle >= 135 || angle < -135) {
                return { dx: -1, dy: 0 }; // 左
            } else {
                return { dx: 0, dy: -1 }; // 上
            }
        };

        touchCircle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isTouching = true;
            const rect = touchCircle.getBoundingClientRect();
            centerX = rect.width / 2;
            centerY = rect.height / 2;

            const pos = getTouchPosition(e);
            updateKnobPosition(pos);
            
            if (this.gameState === 'playing') {
                const direction = determineDirection(pos);
                this.movePlayer(direction.dx, direction.dy);
            }
        }, { passive: false });

        touchCircle.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isTouching) return;

            const pos = getTouchPosition(e);
            updateKnobPosition(pos);
            
            if (this.gameState === 'playing') {
                const direction = determineDirection(pos);
                this.movePlayer(direction.dx, direction.dy);
            }
        }, { passive: false });

        touchCircle.addEventListener('touchend', () => {
            isTouching = false;
            resetKnobPosition();
        });
    }



    updateTrains() {
        // 简单实现：随机移动火车
        if (Math.random() < 0.1) { // 10% 概率移动
            const trainCells = document.querySelectorAll('.maze-cell.train');
            if (trainCells.length > 0) {
                const randomCell = trainCells[Math.floor(Math.random() * trainCells.length)];
                randomCell.classList.add('collect');
                setTimeout(() => {
                    randomCell.classList.remove('collect');
                }, 300);
            }
        }
    }

    updatePacmen() {
        // 移动所有食人鬼
        const directions = [{dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}];
        
        // 遍历所有迷宫单元格，寻找pacman
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                if (this.maze.grid[y][x] === 'pacman') {
                    // 随机选择一个方向
                    const dir = directions[Math.floor(Math.random() * directions.length)];
                    const newX = x + dir.dx;
                    const newY = y + dir.dy;
                    
                    // 检查是否可以移动（目标单元格为空或玩家）
                    if (newX >= 0 && newX < this.maze.width && newY >= 0 && newY < this.maze.height) {
                        const targetCell = this.maze.grid[newY][newX];
                        if (targetCell === '' || targetCell === 'player') {
                            // 移动食人鬼
                            this.maze.grid[y][x] = '';
                            this.maze.grid[newY][newX] = 'pacman';
                            
                            // 如果移动到玩家位置，触发碰撞
                            if (targetCell === 'player') {
                                this.checkCollisions();
                            }
                            break;
                        }
                    }
                }
            }
        }
        
        // 更新迷宫显示
        this.updateMazeDisplay();
    }

    checkCollisions() {
        // 检查玩家是否与陷阱碰撞
        const cell = this.maze.grid[this.player.y][this.player.x];
        if (this.isTrap(cell)) {
            this.triggerTrap(cell);
        }
    }

    pauseGame() {
        this.gameState = 'paused';
        this.showScreen('pause-screen');
    }

    resumeGame() {
        this.gameState = 'playing';
        this.showScreen('game-screen');
    }

    restartLevel() {
        this.loadLevel(this.currentLevel);
    }

    winLevel() {
        this.gameState = 'won';
        
        // 显示胜利界面
        document.getElementById('result-title').textContent = '恭喜你！';
        document.getElementById('result-message').textContent = '你成功通过了关卡！';
        
        // 隐藏下一关按钮
        document.getElementById('next-level-button').style.display = 'none';
        
        this.showScreen('result-screen');
    }

    showMessage(text) {
        // 创建游戏消息元素
        const message = document.createElement('div');
        message.className = 'game-message';
        message.textContent = text;
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        message.style.color = 'white';
        message.style.padding = '20px';
        message.style.borderRadius = '10px';
        message.style.zIndex = '1000';
        message.style.fontSize = '18px';
        message.style.textAlign = 'center';
        
        // 添加到游戏容器
        document.getElementById('maze-container').appendChild(message);
        
        // 3秒后自动隐藏消息
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    showItemMessage(text) {
        // 复用showMessage函数
        this.showMessage(text);
    }

    loseLevel() {
        this.gameState = 'lost';
        
        document.getElementById('result-title').textContent = '游戏结束';
        document.getElementById('result-message').textContent = '别灰心，再试一次吧！';
        document.getElementById('next-level-button').style.display = 'none';
        
        this.showScreen('result-screen');
    }



    loadCustomLevels() {
        // 加载默认关卡数据
        const defaultLevels = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_LEVELS));
        
        // 加载localStorage中的数据
        const saved = localStorage.getItem('mazeGameCustomLevels');
        const savedLevels = saved ? JSON.parse(saved) : {};
        
        // 合并数据：localStorage中的数据优先级更高，会覆盖默认关卡
        return { ...defaultLevels, ...savedLevels };
    }

    saveCustomLevels() {
        localStorage.setItem('mazeGameCustomLevels', JSON.stringify(this.customLevels));
    }



    updateCustomLevelButtons() {
        const customLevelsList = document.getElementById('custom-levels-list');
        customLevelsList.innerHTML = '';

        // 获取已保存的关卡ID并排序
        const savedLevelIds = Object.keys(this.customLevels).map(Number).filter(id => !isNaN(id)).sort((a, b) => a - b);
        
        // 显示已保存的关卡，最多显示20个（可以根据需要调整）
        const levelsToShow = savedLevelIds.slice(0, 20);

        // 更新关卡选择下拉框
        const levelSelect = document.getElementById('level-select');
        levelSelect.innerHTML = '<option value="">-- 选择已保存的关卡 --</option>';
        savedLevelIds.forEach(id => {
            const levelData = this.customLevels[id];
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${levelData.name} (关卡 ${id})`;
            levelSelect.appendChild(option);
        });
        
        if (levelsToShow.length === 0) {
            // 如果没有自定义关卡，显示提示信息
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-custom-levels';
            emptyMessage.textContent = '还没有自定义关卡，点击"创建自定义关卡"来创建一个！';
            customLevelsList.appendChild(emptyMessage);
        } else {
            levelsToShow.forEach(slot => {
                const levelData = this.customLevels[slot];
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'custom-level-button-container';
                
                const button = document.createElement('button');
                button.className = 'level-button custom-level-button';
                
                button.textContent = levelData.name || `自定义关卡 ${slot}`;
                button.disabled = false;
                button.addEventListener('click', () => {
                    this.loadCustomLevel(slot);
                });
                
                // 添加编辑按钮
                const editButton = document.createElement('button');
                editButton.className = 'edit-level-button-small';
                editButton.textContent = '编辑';
                editButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const levelData = this.customLevels[slot];
                    if (levelData) {
                        this.showScreen('edit-screen');
                        this.loadLevelForEditing(levelData);
                    }
                });
                
                buttonContainer.appendChild(button);
                buttonContainer.appendChild(editButton);
                customLevelsList.appendChild(buttonContainer);
            });
            
            // 如果有更多关卡，显示"显示更多"按钮
            if (savedLevelIds.length > 20) {
                const moreButton = document.createElement('button');
                moreButton.className = 'more-levels-button';
                moreButton.textContent = `显示更多关卡 (还有 ${savedLevelIds.length - 20} 个)`;
                moreButton.addEventListener('click', () => {
                    this.showAllCustomLevels();
                });
                customLevelsList.appendChild(moreButton);
            }
        }
    }
    
    showAllCustomLevels() {
        const customLevelsList = document.getElementById('custom-levels-list');
        customLevelsList.innerHTML = '';

        // 获取已保存的关卡ID并排序
        const savedLevelIds = Object.keys(this.customLevels).map(Number).filter(id => !isNaN(id)).sort((a, b) => a - b);
        
        savedLevelIds.forEach(slot => {
            const levelData = this.customLevels[slot];
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'custom-level-button-container';
            
            const button = document.createElement('button');
            button.className = 'level-button custom-level-button';
            
            button.textContent = levelData.name || `自定义关卡 ${slot}`;
            button.disabled = false;
            button.addEventListener('click', () => {
                this.loadCustomLevel(slot);
            });
            
            // 添加分享按钮
            const shareButton = document.createElement('button');
            shareButton.className = 'share-level-button';
            shareButton.textContent = '分享';
            shareButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareLevel(slot);
            });
            
            buttonContainer.appendChild(button);
            buttonContainer.appendChild(shareButton);
            customLevelsList.appendChild(buttonContainer);
        });
        
        // 添加"显示更少"按钮
        const lessButton = document.createElement('button');
        lessButton.className = 'less-levels-button';
        lessButton.textContent = '显示更少关卡';
        lessButton.addEventListener('click', () => {
            this.updateCustomLevelButtons();
        });
        customLevelsList.appendChild(lessButton);
    }
    
    updateLevelSlotSelect() {
        const levelSlotSelect = document.getElementById('level-slot-select');
        const newLevelNumberSpan = document.getElementById('next-level-number');
        const newLevelNumberElement = document.getElementById('new-level-number');
        
        // 清空现有选项（保留"创建新关卡"选项）
        while (levelSlotSelect.children.length > 1) {
            levelSlotSelect.removeChild(levelSlotSelect.lastChild);
        }
        
        // 获取已保存的关卡ID并排序
        const savedLevelIds = Object.keys(this.customLevels).map(Number).filter(id => !isNaN(id)).sort((a, b) => a - b);
        
        // 找到下一个可用的关卡编号
        let nextLevelNumber = 1;
        if (savedLevelIds.length > 0) {
            nextLevelNumber = Math.max(...savedLevelIds) + 1;
        }
        
        // 更新新关卡编号显示
        newLevelNumberSpan.textContent = nextLevelNumber;
        
        // 添加已保存的关卡选项
        savedLevelIds.forEach(slot => {
            const levelData = this.customLevels[slot];
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = `覆盖: ${levelData.name || `自定义关卡 ${slot}`}`;
            levelSlotSelect.appendChild(option);
        });
        
        // 添加事件监听器来显示/隐藏新关卡编号
        levelSlotSelect.addEventListener('change', () => {
            if (levelSlotSelect.value === 'new') {
                newLevelNumberElement.style.display = 'inline';
            } else {
                newLevelNumberElement.style.display = 'none';
            }
        });
        
        // 默认选择"创建新关卡"
        levelSlotSelect.value = 'new';
        newLevelNumberElement.style.display = 'inline';
    }

    loadCustomLevel(slot) {
        const levelData = this.customLevels[slot];
        if (!levelData) return;

        this.currentLevel = `custom-${slot}`;
        this.maze = JSON.parse(JSON.stringify(levelData.maze));
        
        this.resetPlayer();
        this.createMazeDisplay();
        this.updateGameDisplay();
        this.startGameLoop();
        this.showScreen('game-screen');
        this.gameState = 'playing';
    }

    shareLevel(slot) {
        const levelData = this.customLevels[slot];
        if (!levelData) return;

        // 创建分享数据
        const shareData = {
            name: levelData.name,
            maze: levelData.maze,
            version: '1.0'
        };

        // 压缩数据
        const compressedData = this.compressLevelData(shareData);
        
        // 生成分享链接
        const shareUrl = `${window.location.origin}${window.location.pathname}?level=${compressedData}`;
        
        // 显示分享模态框
        document.getElementById('share-link').value = shareUrl;
        document.getElementById('share-modal').style.display = 'block';
        document.getElementById('copy-success').style.display = 'none';
    }

    compressLevelData(data) {
        // 将数据转换为JSON字符串
        const jsonString = JSON.stringify(data);
        
        // 使用Base64编码
        try {
            // 对于包含中文字符的字符串，需要先进行UTF-8编码
            const utf8Bytes = new TextEncoder().encode(jsonString);
            const base64String = btoa(String.fromCharCode.apply(null, utf8Bytes));
            return base64String;
        } catch (e) {
            // 降级处理：直接使用btoa（可能不支持中文字符）
            return btoa(encodeURIComponent(jsonString));
        }
    }

    decompressLevelData(compressedData) {
        try {
            // 尝试解码Base64
            const utf8Bytes = new Uint8Array(
                atob(compressedData)
                    .split('')
                    .map(char => char.charCodeAt(0))
            );
            const jsonString = new TextDecoder().decode(utf8Bytes);
            return JSON.parse(jsonString);
        } catch (e) {
            // 降级处理
            try {
                return JSON.parse(decodeURIComponent(atob(compressedData)));
            } catch (e2) {
                console.error('Failed to decompress level data:', e2);
                return null;
            }
        }
    }

    checkSharedLevel() {
        const urlParams = new URLSearchParams(window.location.search);
        const levelData = urlParams.get('level');
        
        if (levelData) {
            try {
                const decompressedData = this.decompressLevelData(levelData);
                
                if (decompressedData && decompressedData.maze) {
                    // 验证数据完整性
                    if (this.validateSharedLevel(decompressedData)) {
                        // 加载分享的关卡
                        this.loadSharedLevel(decompressedData);
                        return true;
                    }
                }
            } catch (e) {
                console.error('Failed to load shared level:', e);
            }
        }
        return false;
    }

    validateSharedLevel(data) {
        // 检查必要的字段
        if (!data.maze || !data.maze.grid || !data.maze.start || !data.maze.end) {
            return false;
        }
        
        // 检查网格是否为二维数组
        if (!Array.isArray(data.maze.grid) || !Array.isArray(data.maze.grid[0])) {
            return false;
        }
        
        // 检查起点和终点是否存在
        const { start, end } = data.maze;
        if (!start.x || !start.y || !end.x || !end.y) {
            return false;
        }
        
        return true;
    }

    loadSharedLevel(levelData) {
        this.currentLevel = `shared-${Date.now()}`;
        this.maze = JSON.parse(JSON.stringify(levelData.maze));
        
        this.resetPlayer();
        this.createMazeDisplay();
        this.updateGameDisplay();
        this.startGameLoop();
        this.showScreen('game-screen');
        this.gameState = 'playing';

        // 显示欢迎消息
        const message = document.createElement('div');
        message.className = 'game-message';
        message.textContent = `欢迎来到${levelData.name || '分享关卡'}！`;
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        message.style.color = 'white';
        message.style.padding = '20px';
        message.style.borderRadius = '10px';
        message.style.zIndex = '1000';
        message.style.fontSize = '18px';
        message.style.textAlign = 'center';
        
        document.getElementById('maze-container').appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    enterEditMode() {
        this.editMode = true;
        this.currentTool = 'wall';
        
        // 初始化空迷宫
        this.maze.width = 10;
        this.maze.height = 10;
        this.maze.grid = [];
        this.maze.start = { x: 1, y: 1 };
        this.maze.end = { x: 8, y: 8 };
        
        for (let y = 0; y < this.maze.height; y++) {
            this.maze.grid[y] = [];
            for (let x = 0; x < this.maze.width; x++) {
                if (y === 0 || y === this.maze.height - 1 || x === 0 || x === this.maze.width - 1) {
                    this.maze.grid[y][x] = 'wall';
                } else {
                    this.maze.grid[y][x] = '';
                }
            }
        }
        
        this.maze.grid[this.maze.start.y][this.maze.start.x] = 'start';
        this.maze.grid[this.maze.end.y][this.maze.end.x] = 'end';
        
        // 清空历史记录
        this.mazeHistory = [];
        this.historyIndex = -1;
        this.saveToHistory();

        // 渲染编辑网格
        this.createEditMazeDisplay();
        this.updateLevelSlotSelect();
        
        // 保存初始状态到历史记录
        this.saveToHistory();
        
        this.createEditMazeDisplay();
        this.updateLevelSlotSelect(); // 初始化关卡选择下拉框
        this.showScreen('edit-screen');
    }

    // 显示加载状态
    showLoadingState() {
        const container = document.getElementById('edit-maze-container');
        container.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <p>正在加载地图...</p>
            </div>
        `;
    }

    // 隐藏加载状态
    hideLoadingState() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // 显示错误信息
    showErrorState(message) {
        const container = document.getElementById('edit-maze-container');
        if (!container) {
            console.error('无法显示错误信息：编辑容器不存在');
            return;
        }
        
        container.innerHTML = `
            <div class="error-message">
                <p>加载失败: ${message}</p>
                <button id="retry-button">重试</button>
            </div>
        `;
        
        // 添加重试按钮事件
        document.getElementById('retry-button').addEventListener('click', () => {
            // 重新加载当前关卡
            console.log('用户点击重试按钮');
            // 尝试重新加载最近的关卡数据
            if (this.currentEditingLevelData) {
                this.loadLevelForEditing(this.currentEditingLevelData);
            } else {
                console.error('没有可重试的关卡数据');
                this.showErrorState('没有可重试的关卡数据');
            }
        });
    }

    // 显示成功提示
    showSuccessMessage(message) {
        const container = document.getElementById('edit-maze-container');
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        container.appendChild(successDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (successDiv.parentNode === container) {
                container.removeChild(successDiv);
            }
        }, 3000);
    }

    // 异步加载关卡数据
    async loadLevelDataAsync(levelData) {
        return new Promise((resolve, reject) => {
            try {
                // 模拟异步加载过程
                setTimeout(() => {
                    // 深拷贝关卡数据，避免直接修改原始数据
                    const parsedData = {
                        name: levelData.name,
                        gridSize: levelData.maze?.width || 10,
                        grid: JSON.parse(JSON.stringify(levelData.maze?.grid)),
                        start: { ...levelData.maze?.start },
                        end: { ...levelData.maze?.end }
                    };
                    resolve(parsedData);
                }, 300); // 模拟网络延迟
            } catch (error) {
                reject(new Error('解析关卡数据失败: ' + error.message));
            }
        });
    }

    // 加载关卡进行编辑
    async loadLevelForEditing(levelData) {
        console.log('开始加载关卡进行编辑:', levelData);
        
        // 保存当前编辑的关卡数据
        this.currentEditingLevelData = levelData;
        
        // 显示加载状态
        this.showLoadingState();
        
        try {
            // 异步加载关卡数据
            const parsedData = await this.loadLevelDataAsync(levelData);
            
            // 隐藏加载状态
            this.hideLoadingState();
            
            // 设置编辑模式
            this.editMode = true;
            this.currentTool = 'wall';
            
            // 设置编辑模式的网格数据
            this.maze.width = parsedData.gridSize;
            this.maze.height = parsedData.gridSize;
            this.maze.grid = parsedData.grid;
            
            // 设置起点和终点
            this.maze.start = { ...parsedData.start };
            this.maze.end = { ...parsedData.end };

            console.log('关卡数据加载完成:', {
                width: this.maze.width,
                height: this.maze.height,
                start: this.maze.start,
                end: this.maze.end,
                grid: this.maze.grid
            });

            // 设置关卡名称
            const levelNameInput = document.getElementById('level-name-input');
            levelNameInput.value = parsedData.name;

            // 清空历史记录
            this.mazeHistory = [];
            this.historyIndex = -1;
            this.saveToHistory();

            // 确保编辑界面可见
            this.showScreen('edit-screen');
            
            // 渲染编辑网格
            this.createEditMazeDisplay();
            this.updateLevelSlotSelect();
            
            // 显示成功提示
            this.showSuccessMessage('地图加载成功！');
            
        } catch (error) {
            console.error('加载关卡失败:', error);
            // 隐藏加载状态，显示错误信息
            this.hideLoadingState();
            this.showErrorState(error.message);
        }
    }

    createEditMazeDisplay() {
        console.log('开始创建编辑迷宫显示');
        
        // 确保DOM元素存在
        const container = document.getElementById('edit-maze-container');
        if (!container) {
            console.error('编辑迷宫容器元素不存在');
            return;
        }

        // 检查迷宫数据是否有效
        if (!this.maze || !this.maze.grid || !this.maze.width || !this.maze.height) {
            console.error('迷宫数据无效:', {
                maze: this.maze,
                width: this.maze?.width,
                height: this.maze?.height,
                grid: this.maze?.grid
            });
            this.showErrorState('迷宫数据无效，无法渲染地图');
            return;
        }

        try {
            // 清空容器内容（移除加载状态）
            container.innerHTML = '';

            // 创建网格容器
            const grid = document.createElement('div');
            grid.className = 'maze-grid';
            grid.style.gridTemplateColumns = `repeat(${this.maze.width}, 1fr)`;
            grid.style.gridTemplateRows = `repeat(${this.maze.height}, 1fr)`;

            // 使用DocumentFragment优化DOM操作
            const fragment = document.createDocumentFragment();

            // 创建所有单元格
            for (let y = 0; y < this.maze.height; y++) {
                for (let x = 0; x < this.maze.width; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'maze-cell';
                    
                    // 添加单元格类型
                    const cellType = this.maze.grid[y][x];
                    if (cellType) {
                        cell.classList.add(cellType);
                    }
                    
                    // 添加坐标数据属性
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    
                    // 添加点击事件
                    cell.addEventListener('click', () => {
                        this.editCell(x, y);
                    });
                    
                    fragment.appendChild(cell);
                }
            }

            // 一次性添加所有单元格到网格
            grid.appendChild(fragment);
            
            // 将网格添加到容器
            container.appendChild(grid);
            
            console.log('编辑迷宫显示创建完成');
            
        } catch (error) {
            console.error('创建编辑迷宫显示时发生错误:', error);
            this.showErrorState('渲染地图时发生错误: ' + error.message);
        }
    }

    editCell(x, y) {
        // 不能编辑边界墙
        if (y === 0 || y === this.maze.height - 1 || x === 0 || x === this.maze.width - 1) {
            return;
        }

        // 保存当前状态到历史记录
        this.saveToHistory();
        
        // 处理特殊工具
        if (this.currentTool === 'start') {
            // 移除旧起点
            const oldStartY = this.maze.start.y;
            const oldStartX = this.maze.start.x;
            if (this.maze.grid[oldStartY][oldStartX] === 'start') {
                this.maze.grid[oldStartY][oldStartX] = '';
            }
            
            // 设置新起点
            this.maze.start = { x, y };
            if (this.maze.grid[y][x] === 'end') {
                // 如果点击了终点，交换起点和终点
                this.maze.end = { x: oldStartX, y: oldStartY };
                this.maze.grid[oldStartY][oldStartX] = 'end';
            }
            this.maze.grid[y][x] = 'start';
        } else if (this.currentTool === 'end') {
            // 移除旧终点
            const oldEndY = this.maze.end.y;
            const oldEndX = this.maze.end.x;
            if (this.maze.grid[oldEndY][oldEndX] === 'end') {
                this.maze.grid[oldEndY][oldEndX] = '';
            }
            
            // 设置新终点
            this.maze.end = { x, y };
            if (this.maze.grid[y][x] === 'start') {
                // 如果点击了起点，交换起点和终点
                this.maze.start = { x: oldEndX, y: oldEndY };
                this.maze.grid[oldEndY][oldEndX] = 'start';
            }
            this.maze.grid[y][x] = 'end';
        } else if (this.currentTool === 'eraser') {
            // 不能擦除起点和终点
            if (x === this.maze.start.x && y === this.maze.start.y) {
                return;
            }
            if (x === this.maze.end.x && y === this.maze.end.y) {
                return;
            }
            
            this.maze.grid[y][x] = '';
        } else {
            // 不能在起点和终点上放置物品
            if (x === this.maze.start.x && y === this.maze.start.y) {
                return;
            }
            if (x === this.maze.end.x && y === this.maze.end.y) {
                return;
            }
            
            this.maze.grid[y][x] = this.currentTool;
        }
        
        this.updateEditMazeDisplay();
    }

    updateEditMazeDisplay() {
        const cells = document.querySelectorAll('#edit-maze-container .maze-cell');
        let index = 0;
        
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                const cell = cells[index++];
                cell.className = 'maze-cell';
                if (this.maze.grid[y][x]) {
                    cell.classList.add(this.maze.grid[y][x]);
                }
            }
        }
    }

    saveToHistory() {
        // 保存当前迷宫状态到历史记录
        const currentState = {
            grid: JSON.parse(JSON.stringify(this.maze.grid)),
            start: { ...this.maze.start },
            end: { ...this.maze.end }
        };

        // 如果当前不是最新状态，删除后面的历史
        if (this.historyIndex < this.mazeHistory.length - 1) {
            this.mazeHistory = this.mazeHistory.slice(0, this.historyIndex + 1);
        }

        // 添加新状态到历史记录
        this.mazeHistory.push(currentState);
        
        // 限制历史记录长度，防止内存占用过大
        const maxHistory = 50;
        if (this.mazeHistory.length > maxHistory) {
            this.mazeHistory.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const previousState = this.mazeHistory[this.historyIndex];
            this.maze.grid = JSON.parse(JSON.stringify(previousState.grid));
            this.maze.start = { ...previousState.start };
            this.maze.end = { ...previousState.end };
            this.updateEditMazeDisplay();
        }
    }

    redo() {
        if (this.historyIndex < this.mazeHistory.length - 1) {
            this.historyIndex++;
            const nextState = this.mazeHistory[this.historyIndex];
            this.maze.grid = JSON.parse(JSON.stringify(nextState.grid));
            this.maze.start = { ...nextState.start };
            this.maze.end = { ...nextState.end };
            this.updateEditMazeDisplay();
        }
    }

    clearMaze() {
        for (let y = 1; y < this.maze.height - 1; y++) {
            for (let x = 1; x < this.maze.width - 1; x++) {
                this.maze.grid[y][x] = '';
            }
        }
        
        // 重置起点和终点
        this.maze.start = { x: 1, y: 1 };
        this.maze.end = { x: this.maze.width - 2, y: this.maze.height - 2 };
        this.maze.grid[this.maze.start.y][this.maze.start.x] = 'start';
        this.maze.grid[this.maze.end.y][this.maze.end.x] = 'end';
        
        this.updateEditMazeDisplay();
    }

    saveCustomMaze() {
        const levelNameInput = document.getElementById('level-name-input');
        const levelSlotSelect = document.getElementById('level-slot-select');
        
        let levelName = levelNameInput.value.trim();
        let levelSlot;
        
        // 检查是创建新关卡还是覆盖现有关卡
        if (levelSlotSelect.value === 'new') {
            // 创建新关卡
            // 获取下一个可用的关卡编号
            const savedLevelIds = Object.keys(this.customLevels).map(Number).filter(id => !isNaN(id));
            levelSlot = savedLevelIds.length > 0 ? Math.max(...savedLevelIds) + 1 : 1;
            
            // 如果没有输入名称，使用默认名称
            if (!levelName) {
                levelName = `自定义关卡 ${levelSlot}`;
            }
        } else {
            // 覆盖现有关卡
            levelSlot = parseInt(levelSlotSelect.value);
            
            // 如果没有输入名称，使用现有名称
            if (!levelName) {
                levelName = this.customLevels[levelSlot].name || `自定义关卡 ${levelSlot}`;
            }
        }
        
        // 确保终点位置保持为出口
        this.maze.grid[this.maze.end.y][this.maze.end.x] = 'end';
        
        // 如果没有宝箱，在合适的位置添加一个
        let hasChest = false;
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                if (this.maze.grid[y][x] === 'chest') {
                    hasChest = true;
                    break;
                }
            }
            if (hasChest) break;
        }
        
        // 如果没有宝箱，在终点附近添加一个
        if (!hasChest) {
            const directions = [{dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}];
            for (const dir of directions) {
                const x = this.maze.end.x + dir.dx;
                const y = this.maze.end.y + dir.dy;
                if (x >= 0 && x < this.maze.width && y >= 0 && y < this.maze.height && this.maze.grid[y][x] === '') {
                    this.maze.grid[y][x] = 'chest';
                    break;
                }
            }
        }
        
        // 保存关卡数据
        this.customLevels[levelSlot] = {
            name: levelName,
            maze: JSON.parse(JSON.stringify(this.maze)),
            date: new Date().toISOString()
        };
        
        // 保存到本地存储
        this.saveCustomLevels();
        
        // 更新自定义关卡按钮和关卡选择下拉框
        this.updateCustomLevelButtons();
        this.updateLevelSlotSelect();
        
        alert(`迷宫已保存到${levelName}！`);
        
        // 重置输入框
        levelNameInput.value = '';
        
        this.showScreen('level-select-screen');
    }
}

// 默认自定义关卡数据
const DEFAULT_CUSTOM_LEVELS = {
    1: {
        name: "初学者迷宫",
        maze: {
            width: 8,
            height: 8,
            start: { x: 1, y: 1 },
            end: { x: 6, y: 6 },
            grid: [
                ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
                ["wall", "start", "", "", "", "", "", "wall"],
                ["wall", "", "wall", "", "wall", "", "", "wall"],
                ["wall", "", "", "", "", "", "", "wall"],
                ["wall", "", "wall", "", "wall", "", "", "wall"],
                ["wall", "", "", "", "", "", "", "wall"],
                ["wall", "", "", "", "", "end", "", "wall"],
                ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"]
            ]
        },
        date: new Date().toISOString()
    },
    2: {
        name: "进阶迷宫",
        maze: {
            width: 10,
            height: 10,
            start: { x: 1, y: 1 },
            end: { x: 8, y: 8 },
            grid: [
                ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
                ["wall", "start", "", "", "", "", "", "", "", "wall"],
                ["wall", "", "wall", "", "wall", "", "wall", "", "", "wall"],
                ["wall", "", "", "", "", "", "", "", "", "wall"],
                ["wall", "", "wall", "", "wall", "", "wall", "", "", "wall"],
                ["wall", "", "", "", "", "", "", "", "", "wall"],
                ["wall", "", "wall", "", "wall", "", "wall", "", "", "wall"],
                ["wall", "", "", "", "", "", "", "", "", "wall"],
                ["wall", "", "", "", "", "", "end", "", "", "wall"],
                ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"]
            ]
        },
        date: new Date().toISOString()
    }
};

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new MazeGame();
});