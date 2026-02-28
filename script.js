const gridElement = document.getElementById('grid');
const piecesContainer = document.getElementById('pieces-container');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const gameOverElement = document.getElementById('game-over');

let score = 0;
let highScore = localStorage.getItem('valoBest') || 0;
bestScoreElement.innerText = highScore;
let grid = Array(8).fill().map(() => Array(8).fill(-1));
let availablePieces = [];

// SES MOTORU
const bgMusic = new Audio('oyun_muzik.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.1;
let isInteracted = false;

// Blok Blast Şekilleri
const SHAPES = [
    { map: [[1,1],[1,1]], color: 'cyan' },
    { map: [[1,1,1],[1,1,1],[1,1,1]], color: 'red' },
    { map: [[1,1,1,1]], color: 'white' },
    { map: [[1],[1],[1],[1]], color: 'white' },
    { map: [[1,1,1,1,1]], color: 'dark' },
    { map: [[1,0],[1,0],[1,1]], color: 'red' },
    { map: [[0,1],[0,1],[1,1]], color: 'red' },
    { map: [[1,1,1],[0,1,0]], color: 'white' },
    { map: [[0,1,1],[1,1,0]], color: 'dark' }
];

function drawGrid() {
    gridElement.innerHTML = '';
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell' + (grid[r][c] !== -1 ? ' color-' + grid[r][c] : '');
            gridElement.appendChild(cell);
        }
    }
}

function generatePieces() {
    piecesContainer.innerHTML = '';
    availablePieces = [];
    for(let i=0; i<3; i++) {
        const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
        const p = {...shape, id: i, used: false};
        availablePieces.push(p);
        renderPiece(p);
    }
}

function renderPiece(p) {
    const div = document.createElement('div');
    div.className = 'piece'; div.id = 'p-'+p.id;
    
    p.map.forEach(row => {
        const rDiv = document.createElement('div'); rDiv.className='piece-row';
        row.forEach(v => {
            const cDiv = document.createElement('div'); cDiv.className='piece-cell';
            if(v) cDiv.classList.add('color-'+p.color); else cDiv.style.visibility='hidden';
            rDiv.appendChild(cDiv);
        });
        div.appendChild(rDiv);
    });
    piecesContainer.appendChild(div);

    // MOBİL VE PC SÜRÜKLEME (Gelişmiş)
    const handleStart = (e) => {
        if(p.used) return;
        // SES AKTİFLEŞTİRME (İlk dokunuşta)
        if(!isInteracted) {
            bgMusic.play().catch(err => console.log("Müzik bekleniyor..."));
            isInteracted = true;
        }

        window.activeP = p;
        window.activeEl = div;
        div.style.position = 'fixed';
        div.style.zIndex = '9999';
        div.style.transform = 'scale(1.2)'; // Telefonda daha rahat görmek için hafif büyüt
        updatePosition(e);
    };

    const handleMove = (e) => {
        if(!window.activeP || window.activeEl !== div) return;
        updatePosition(e);
    };

    const handleEnd = (e) => {
        if(!window.activeP || window.activeEl !== div) return;
        const clientX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.changedTouches[0].clientY : e.clientY;

        div.style.position = 'static';
        div.style.transform = 'scale(1)';
        div.style.pointerEvents = 'auto';

        // Parmağın olduğu yerdeki hücreyi bul
        const target = document.elementFromPoint(clientX, clientY);
        if(target && target.classList.contains('cell')) {
            const idx = Array.from(gridElement.children).indexOf(target);
            tryPlace(p, Math.floor(idx/8), idx%8);
        }
        
        window.activeP = null;
        window.activeEl = null;
        drawGrid();
    };

    function updatePosition(e) {
        const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        // OFSET AYARI: Bloğu parmağın 60px yukarısına koy ki parmağın bloğu kapatmasın!
        div.style.left = (x - div.offsetWidth / 2) + 'px';
        div.style.top = (y - 100) + 'px'; 
        div.style.pointerEvents = 'none'; // Altındaki hücreyi ıskalamamak için şart
    }

    div.onmousedown = handleStart;
    div.ontouchstart = (e) => { e.preventDefault(); handleStart(e); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, {passive: false});
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
}

function tryPlace(p, r, c) {
    if(canPlace(p, r, c)) {
        p.map.forEach((row, pr) => row.forEach((v, pc) => {
            if(v) grid[r+pr][c+pc] = p.color;
        }));
        p.used = true;
        document.getElementById('p-'+p.id).style.visibility = 'hidden';
        score += 20; scoreElement.innerText = score;
        checkLines();
        if(availablePieces.every(x=>x.used)) generatePieces();
        if(checkGameOver()) gameOverElement.style.display='block';
        
        // Yerleştirme Sesi
        const sfx = new Audio('yerlestir.mp3');
        sfx.volume = 0.5;
        sfx.play().catch(()=>{});
    }
}

function canPlace(p, r, c) {
    return p.map.every((row, pr) => row.every((v, pc) => {
        if(!v) return true;
        let tr = r+pr, tc = c+pc;
        return tr>=0 && tr<8 && tc>=0 && tc<8 && grid[tr][tc] === -1;
    }));
}

function checkLines() {
    let rCl = [], cCl = [];
    for(let i=0; i<8; i++) {
        if(grid[i].every(x=>x!==-1)) rCl.push(i);
        if(grid.every(row=>row[i]!==-1)) cCl.push(i);
    }
    if(rCl.length > 0 || cCl.length > 0) {
        const sfx = new Audio('patla1.mp3');
        sfx.play().catch(()=>{});
        rCl.forEach(r => { grid[r].fill(-1); score += 100; });
        cCl.forEach(c => { grid.forEach(row => row[c] = -1); score += 100; });
    }
    if(score > highScore) { 
        highScore = score; 
        localStorage.setItem('valoBest', score); 
        bestScoreElement.innerText = score; 
    }
}

function checkGameOver() {
    return availablePieces.filter(x=>!x.used).every(p => {
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) if(canPlace(p,r,c)) return false;
        return true;
    });
}

function resetGame() {
    grid = Array(8).fill().map(() => Array(8).fill(-1));
    score = 0; scoreElement.innerText = "0";
    gameOverElement.style.display = 'none';
    drawGrid(); generatePieces();
}

drawGrid(); generatePieces();
