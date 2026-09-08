class ChessGame {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = this.createInitialBoard();
        this.turn = 'w';
        this.history = [];
        this.castling = { w: { k: true, q: true }, b: { k: true, q: true } };
        this.enPassant = null;
        this.halfMoveClock = 0;
        this.gameOver = false;
    }

    createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        const layout = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: layout[i], color: 'b' };
            board[1][i] = { type: 'p', color: 'b' };
            board[6][i] = { type: 'p', color: 'w' };
            board[7][i] = { type: layout[i], color: 'w' };
        }
        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    movePiece(from, to, promotion = 'q') {
        const piece = this.board[from.row][from.col];
        const target = this.board[to.row][to.col];

        // Record move for history
        this.history.push({
            from, to, piece: { ...piece }, captured: target ? { ...target } : null,
            castling: JSON.parse(JSON.stringify(this.castling)),
            enPassant: this.enPassant
        });

        // Handle En Passant Capture
        if (piece.type === 'p' && to.row === this.enPassant?.row && to.col === this.enPassant?.col) {
            this.board[from.row][to.col] = null;
        }

        // Update Board
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;

        // Promotion
        if (piece.type === 'p' && (to.row === 0 || to.row === 7)) {
            this.board[to.row][to.col].type = promotion;
        }

        // Handle Castling Move
        if (piece.type === 'k' && Math.abs(from.col - to.col) === 2) {
            const isKingside = to.col > from.col;
            const rookCol = isKingside ? 7 : 0;
            const newRookCol = isKingside ? 5 : 3;
            this.board[to.row][newRookCol] = this.board[to.row][rookCol];
            this.board[to.row][rookCol] = null;
        }

        // Update Castling Rights
        if (piece.type === 'k') this.castling[piece.color] = { k: false, q: false };
        if (piece.type === 'r') {
            if (from.col === 0) this.castling[piece.color].q = false;
            if (from.col === 7) this.castling[piece.color].k = false;
        }

        // Update En Passant target
        this.enPassant = (piece.type === 'p' && Math.abs(from.row - to.row) === 2) 
            ? { row: (from.row + to.row) / 2, col: from.col } : null;

        this.turn = this.turn === 'w' ? 'b' : 'w';
        return true;
    }

    getLegalMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece) return [];

        const pseudoMoves = this.getPseudoLegalMoves(row, col);
        return pseudoMoves.filter(move => !this.leavesKingInCheck(row, col, move.row, move.col));
    }

    getPseudoLegalMoves(row, col) {
        const piece = this.board[row][col];
        const moves = [];
        const directions = {
            n: [[-1, -2], [-1, 2], [1, -2], [1, 2], [-2, -1], [-2, 1], [2, -1], [2, 1]],
            b: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
            r: [[-1, 0], [1, 0], [0, -1], [0, 1]],
            q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
            k: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
        };

        if (piece.type === 'p') {
            const dir = piece.color === 'w' ? -1 : 1;
            // Forward
            if (!this.getPiece(row + dir, col)) {
                moves.push({ row: row + dir, col });
                if ((piece.color === 'w' && row === 6 || piece.color === 'b' && row === 1) && !this.getPiece(row + 2 * dir, col)) {
                    moves.push({ row: row + 2 * dir, col });
                }
            }
            // Captures
            for (let side of [-1, 1]) {
                const target = this.getPiece(row + dir, col + side);
                if (target && target.color !== piece.color) moves.push({ row: row + dir, col: col + side });
                // En Passant
                if (this.enPassant && this.enPassant.row === row + dir && this.enPassant.col === col + side) {
                    moves.push({ row: row + dir, col: col + side });
                }
            }
        } else if (['b', 'r', 'q'].includes(piece.type)) {
            directions[piece.type].forEach(([dr, dc]) => {
                let r = row + dr, c = col + dc;
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const target = this.getPiece(r, c);
                    if (!target) moves.push({ row: r, col: c });
                    else {
                        if (target.color !== piece.color) moves.push({ row: r, col: c });
                        break;
                    }
                    r += dr; c += dc;
                }
            });
        } else {
            directions[piece.type].forEach(([dr, dc]) => {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const target = this.getPiece(r, c);
                    if (!target || target.color !== piece.color) moves.push({ row: r, col: c });
                }
            });
            // Castling
            if (piece.type === 'k') {
                if (this.castling[piece.color].k && !this.getPiece(row, col+1) && !this.getPiece(row, col+2)) moves.push({row, col: col+2});
                if (this.castling[piece.color].q && !this.getPiece(row, col-1) && !this.getPiece(row, col-2) && !this.getPiece(row, col-3)) moves.push({row, col: col-2});
            }
        }

        return moves;
    }

    leavesKingInCheck(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const target = this.board[toRow][toCol];
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        const inCheck = this.isInCheck(piece.color);
        
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = target;
        return inCheck;
    }

    isInCheck(color) {
        let kingPos = null;
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            const p = this.board[r][c];
            if (p && p.type === 'k' && p.color === color) kingPos = {r, c};
        }
        if (!kingPos) return false;

        const oppColor = color === 'w' ? 'b' : 'w';
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            const p = this.board[r][c];
            if (p && p.color === oppColor) {
                const moves = this.getPseudoLegalMoves(r, c);
                if (moves.some(m => m.row === kingPos.r && m.col === kingPos.c)) return true;
            }
        }
        return false;
    }

    isCheckmate() {
        if (!this.isInCheck(this.turn)) return false;
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            const p = this.board[r][c];
            if (p && p.color === this.turn) {
                if (this.getLegalMoves(r, c).length > 0) return false;
            }
        }
        return true;
    }

    isStalemate() {
        if (this.isInCheck(this.turn)) return false;
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            const p = this.board[r][c];
            if (p && p.color === this.turn) {
                if (this.getLegalMoves(r, c).length > 0) return false;
            }
        }
        return true;
    }
}