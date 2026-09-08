const PIECE_VALUES = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

function evaluateBoard(game) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = game.board[r][c];
            if (p) {
                const val = PIECE_VALUES[p.type];
                score += (p.color === 'w' ? val : -val);
            }
        }
    }
    return score;
}

function minimax(game, depth, alpha, beta, isMaximizing) {
    if (depth === 0) return -evaluateBoard(game);

    const allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = game.board[r][c];
            if (p && p.color === game.turn) {
                game.getLegalMoves(r, c).forEach(m => allMoves.push({ from: { r, c }, to: m }));
            }
        }
    }

    if (allMoves.length === 0) return isMaximizing ? -9999 : 9999;

    if (isMaximizing) {
        let bestScore = -9999;
        for (let move of allMoves) {
            const gameCopy = Object.assign(Object.create(Object.getPrototypeOf(game)), game);
            // Simple move simulation for AI (doesn't need full history)
            const originalBoard = JSON.parse(JSON.stringify(game.board));
            const originalTurn = game.turn;
            game.movePiece(move.from, move.to);
            bestScore = Math.max(bestScore, minimax(game, depth - 1, alpha, beta, !isMaximizing));
            game.board = originalBoard;
            game.turn = originalTurn;
            alpha = Math.max(alpha, bestScore);
            if (beta <= alpha) break;
        }
        return bestScore;
    } else {
        let bestScore = 9999;
        for (let move of allMoves) {
            const originalBoard = JSON.parse(JSON.stringify(game.board));
            const originalTurn = game.turn;
            game.movePiece(move.from, move.to);
            bestScore = Math.min(bestScore, minimax(game, depth - 1, alpha, beta, !isMaximizing));
            game.board = originalBoard;
            game.turn = originalTurn;
            beta = Math.min(beta, bestScore);
            if (beta <= alpha) break;
        }
        return bestScore;
    }
}

function getBestMove(game, depth) {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = game.board[r][c];
            if (p && p.color === game.turn) {
                game.getLegalMoves(r, c).forEach(m => allMoves.push({ from: { r, c }, to: m }));
            }
        }
    }

    let bestMove = null;
    let bestValue = -9999;

    allMoves.sort(() => Math.random() - 0.5);

    for (let move of allMoves) {
        const originalBoard = JSON.parse(JSON.stringify(game.board));
        const originalTurn = game.turn;
        game.movePiece(move.from, move.to);
        let boardValue = minimax(game, depth - 1, -10000, 10000, false);
        game.board = originalBoard;
        game.turn = originalTurn;

        if (boardValue >= bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }
    return bestMove;
}