const gridElement = document.getElementById('grid');
const piecesContainer = document.getElementById('pieces-container');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const gameOverElement = document.getElementById('game-over');

// --- OYUN VERİLERİ ---
let score = 0;
let highScore = localStorage.getItem('valoBest') || 0;
bestScoreElement.innerText = highScore;
let grid = Array(8).fill().map(() => Array(8).fill(-1));
let availablePieces = [];

// SESLER
const bgMusic = new Audio('oyun_muzik.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.01;
let isMusicStarted = false;

// --- ŞEKİL HAVUZU (BLOCK BLAST STİLİ) ---
const SHAPES = [
    { map: [[1, 1], [1, 1]], color: 'cyan' }, // 2x2
    { map: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'red' }, // 3x3
    { map: [[1, 1, 1, 1]], color: 'white' }, // Yatay 4
    { map: [[1], [1], [1], [1]], color: 'white' }, // Dikey 4
    { map: [[1, 1, 1, 1, 1]], color: 'dark' }, // Yatay 5
    { map: [[1], [1], [1], [1], [1]], color: 'dark' }, // Dikey 5
    { map: [[1, 0], [1, 0], [1, 1]], color: 'cyan' }, // L
    { map: [[0, 1], [0, 1], [1, 1]], color: 'red' }, // J
    { map: [[1, 1, 1], [0, 1, 0]], color: 'white' }, // T
    { map: [[0, 1, 1], [1, 1, 0]], color: 'dark' }, // S
    { map: [[1, 1, 0], [0, 1, 1]], color: 'dark' }  // Z
];

// --- IZGARAYI ÇİZ ---
function drawGrid() {
    gridElement.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (grid[r][c] !== -1) cell.classList.add('color-' + grid[r][c]);
            gridElement.appendChild(cell);
        }
    }
}

// --- PARÇALARI ÜRET ---
function generatePieces() {
    piecesContainer.innerHTML = '';
    availablePieces = [];
    for (let i = 0; i < 3; i++) {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const p = { ...shape, id: i, used: false };
        availablePieces.push(p);
        renderPiece(p);
    }
}

function renderPiece(p) {
    const div = document.createElement('div');
    div.className = 'piece';
    div.id = 'p-' + p.id;

    p.map.forEach((row, r) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'piece-row';
        row.forEach((v, c) => {
            const cDiv = document.createElement('div');
            cDiv.className = 'piece-cell';
            if (v) cDiv.classList.add('color-' + p.color);
            else cDiv.style.visibility = 'hidden';
            rowDiv.appendChild(cDiv);
        });
        div.appendChild(rowDiv);
    });

    piecesContainer.appendChild(div);

    // --- HEM MOUSE HEM TOUCH KONTROLLERİ ---
    const startDrag = (e) => {
        if (p.used) return;
        if (!isMusicStarted) { bgMusic.play(); isMusicStarted = true; }
        
        window.activeP = p;
        window.activeEl = div;
        div.style.position = 'fixed';
        div.style.zIndex = '1000';
        div.style.pointerEvents = 'none'; // Altındaki hücreyi algılayabilmek için
        
        moveHandler(e);
    };

    const moveHandler = (e) => {
        if (!window.activeP || window.activeEl !== div) return;
        const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        div.style.left = (x - 40) + 'px';
        div.style.top = (y - 80) + 'px'; // Parmak/Mouse üstünde kalsın
    };

    const endDrag = (e) => {
        if (!window.activeP || window.activeEl !== div) return;
        const x = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
        const y = e.type.includes('touch') ? e.changedTouches[0].clientY : e.clientY;

        div.style.position = 'static';
        div.style.pointerEvents = 'auto';
        
        const target = document.elementFromPoint(x, y);
        if (target && target.classList.contains('cell')) {
            const idx = Array.from(gridElement.children).indexOf(target);
            tryPlace(p, Math.floor(idx / 8), idx % 8);
        }

        window.activeP = null;
        window.activeEl = null;
        drawGrid();
    };

    // Event Dinleyicileri
    div.onmousedown = startDrag;
    div.ontouchstart = (e) => { e.preventDefault(); startDrag(e); };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('touchmove', (e) => { if(window.activeP) e.preventDefault(); moveHandler(e); }, {passive: false});

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
}

function tryPlace(p, r, c) {
    if (canPlace(p, r, c)) {
        p.map.forEach((row, pr) => row.forEach((v, pc) => {
            if (v) grid[r + pr][c + pc] = p.color;
        }));
        p.used = true;
        document.getElementById('p-' + p.id).style.visibility = 'hidden';
        score += p.map.flat().filter(v => v).length * 10;
        scoreElement.innerText = score;
        checkLines();
        if (availablePieces.every(x => x.used)) generatePieces();
        if (checkGameOver()) gameOverElement.style.display = 'block';
    }
}

function canPlace(p, r, c) {
    return p.map.every((row, pr) => row.every((v, pc) => {
        if (!v) return true;
        let tr = r + pr, tc = c + pc;
        return tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && grid[tr][tc] === -1;
    }));
}

function checkLines() {
    let rCl = [], cCl = [];
    for (let i = 0; i < 8; i++) {
        if (grid[i].every(x => x !== -1)) rCl.push(i);
        let colFull = true;
        for (let j = 0; j < 8; j++) if (grid[j][i] === -1) colFull = false;
        if (colFull) cCl.push(i);
    }
    rCl.forEach(r => { grid[r].fill(-1); score += 100; });
    cCl.forEach(c => { grid.forEach(row => row[c] = -1); score += 100; });
    if (score > highScore) { 
        highScore = score; 
        localStorage.setItem('valoBest', score); 
        bestScoreElement.innerText = score; 
    }
}

function checkGameOver() {
    const active = availablePieces.filter(x => !x.used);
    if(active.length === 0) return false;
    return active.every(p => {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (canPlace(p, r, c)) return false;
            }
        }
        return true;
    });
}

function resetGame() {
    grid = Array(8).fill().map(() => Array(8).fill(-1));
    score = 0; scoreElement.innerText = "0";
    gameOverElement.style.display = 'none';
    drawGrid(); generatePieces();
}

function toggleSettings() {
    const s = document.getElementById('settings-panel');
    s.style.display = s.style.display === 'block' ? 'none' : 'block';
}

function updateMusicVolume() {
    bgMusic.volume = document.getElementById('music-vol').value;
}

// BAŞLAT
drawGrid();
generatePieces();