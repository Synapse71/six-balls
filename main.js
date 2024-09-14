const gameContainer = document.getElementById('game-container');
const currentPieceDisplay = document.getElementById('current-piece');
const nextPieceDisplay = document.getElementById('next-piece');
const controlsContainer = document.getElementById('controls');
const rows = 10;
const cols = 10;
let grid = [];

// 五种颜色
const colors = ['red', 'yellow', 'blue', 'green', 'purple'];

// 初始化棋盘
function initGrid() {
    for (let row = 0; row < rows; row++) {
        const gridRow = [];
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            gridRow.push(null); // 初始化为空
            gameContainer.appendChild(cell);
        }
        grid.push(gridRow);
    }
}

// 初始化选择列的按钮
function initControls() {
    for (let col = 0; col < cols - 1; col++) {
        const button = document.createElement('button');
        button.textContent = `列 ${col}`;
        button.addEventListener('click', () => dropPiece(currentPiece, col));
        controlsContainer.appendChild(button);
    }
}

initGrid();
initControls();

// 生成一个 2x2 随机颜色的棋子
function generateRandomPiece() {
    return {
        top_left: colors[Math.floor(Math.random() * colors.length)],
        top_right: colors[Math.floor(Math.random() * colors.length)],
        bottom_left: colors[Math.floor(Math.random() * colors.length)],
        bottom_right: colors[Math.floor(Math.random() * colors.length)]
    };
}

// 显示当前或下一个 2x2 的棋子
function displayPiece(piece, displayElement) {
    displayElement.innerHTML = `
        <div class="cell ${piece.top_left}"></div>
        <div class="cell ${piece.top_right}"></div>
        <div class="cell ${piece.bottom_left}"></div>
        <div class="cell ${piece.bottom_right}"></div>
    `;
}

// 顺时针旋转当前棋子
function rotateClockwise(piece) {
    const { top_left, top_right, bottom_left, bottom_right } = piece;
    piece.top_left = bottom_left;
    piece.top_right = top_left;
    piece.bottom_left = bottom_right;
    piece.bottom_right = top_right;
    displayPiece(piece, currentPieceDisplay);
}

// 逆时针旋转当前棋子
function rotateCounterClockwise(piece) {
    const { top_left, top_right, bottom_left, bottom_right } = piece;
    piece.top_left = top_right;
    piece.top_right = bottom_right;
    piece.bottom_left = top_left;
    piece.bottom_right = bottom_left;
    displayPiece(piece, currentPieceDisplay);
}

// 获取某列最底下可以放棋子的位置
function getAvailableRow(col) {
    for (let row = rows - 1; row >= 0; row--) {
        if (!grid[row][col]) {
            return row; // 返回可以放棋子的行
        }
    }
    return -1; // 列已满
}

// 检查并消除相邻的棋子
function checkForMatches() {
    const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0], // 上下左右
        [1, 1], [1, -1], [-1, 1], [-1, -1] // 四个对角线方向
    ];

    function dfs(row, col, color, visited) {
        if (
            row < 0 || row >= rows || col < 0 || col >= cols ||
            visited[row][col] || grid[row][col] !== color
        ) {
            return [];
        }

        visited[row][col] = true;
        let connected = [[row, col]];

        for (let [dx, dy] of directions) {
            connected = connected.concat(dfs(row + dx, col + dy, color, visited));
        }

        return connected;
    }

    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    let hasMatches = false;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid[row][col] && !visited[row][col]) {
                const connected = dfs(row, col, grid[row][col], visited);
                if (connected.length >= 6) {
                    // 消除相同颜色的棋子
                    for (let [r, c] of connected) {
                        grid[r][c] = null;
                    }
                    hasMatches = true; // 标记有消除的情况
                }
            }
        }
    }

    if (hasMatches) {
        applyGravity(); // 模拟重力，让上方的棋子掉落
    }

    updateGrid();
}

// 模拟棋盘中所有棋子的重力掉落
function applyGravity() {
    for (let col = 0; col < cols; col++) {
        for (let row = rows - 1; row >= 0; row--) {
            if (!grid[row][col]) {  // 找到空格
                // 向上找到最近的棋子
                for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
                    if (grid[aboveRow][col]) {
                        // 将上方的棋子移到当前空位
                        grid[row][col] = grid[aboveRow][col];
                        grid[aboveRow][col] = null; // 清空原来的位置
                        break;
                    }
                }
            }
        }
    }
    updateGrid(); // 更新棋盘显示
}


// 获取某个位置下方的第一个空格
function getDropRow(col) {
    for (let row = rows - 1; row >= 0; row--) {
        if (!grid[row][col]) {
            return row; // 返回该列中最底部的空格
        }
    }
    return -1; // 列已满
}

// 掉落 2x2 棋子，模拟重力
function dropPiece(piece, col) {
    // 找到每个位置下方的最低空位
    const bottomLeftRow = getDropRow(col);
    const bottomRightRow = getDropRow(col + 1);

    if (bottomLeftRow !== -1 && bottomRightRow !== -1) {
        // 如果下方有空位，就让每个棋子根据重力掉落
        grid[bottomLeftRow][col] = piece.bottom_left;      // 左下
        grid[bottomRightRow][col + 1] = piece.bottom_right; // 右下

        // 顶部棋子的重力掉落
        const topLeftRow = getDropRow(col);
        const topRightRow = getDropRow(col + 1);
        grid[topLeftRow][col] = piece.top_left;      // 左上
        grid[topRightRow][col + 1] = piece.top_right; // 右上

        updateGrid();
        checkForMatches();
    } else {
        alert('这一列已满或不适合放下2x2棋子，请选择其他列');
    }

    // 更新为下一个随机 2x2 棋子
    currentPiece = nextPiece;
    nextPiece = generateRandomPiece();
    displayPiece(currentPiece, currentPieceDisplay);
    displayPiece(nextPiece, nextPieceDisplay);
}


// 更新棋盘显示
function updateGrid() {
    const cells = document.querySelectorAll('.cell');
    let cellIndex = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = cells[cellIndex++];
            if (grid[row][col]) {
                cell.classList.add(grid[row][col]);
            } else {
                cell.className = 'cell'; // 清除颜色
            }
        }
    }
}

let currentPiece = generateRandomPiece();
let nextPiece = generateRandomPiece();

// 显示当前和下一个 2x2 棋子
displayPiece(currentPiece, currentPieceDisplay);
displayPiece(nextPiece, nextPieceDisplay);

// 绑定旋转按钮
document.getElementById('rotate-clockwise').addEventListener('click', () => {
    rotateClockwise(currentPiece);
});

document.getElementById('rotate-counterclockwise').addEventListener('click', () => {
    rotateCounterClockwise(currentPiece);
});
