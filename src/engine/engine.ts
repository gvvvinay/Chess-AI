import { Chess } from 'chess.js';

// Piece values
const PIECE_VALUES: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
};

function evaluateBoard(game: Chess): number {
    let totalEvaluation = 0;
    const board = game.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const value = PIECE_VALUES[piece.type];
                totalEvaluation += piece.color === 'w' ? value : -value;
            }
        }
    }
    return totalEvaluation;
}

function minimax(
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean
): number {
    if (depth === 0 || game.isGameOver()) {
        return evaluateBoard(game);
    }

    const moves = game.moves();

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evalValue = minimax(game, depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, evalValue);
            alpha = Math.max(alpha, evalValue);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evalValue = minimax(game, depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, evalValue);
            beta = Math.min(beta, evalValue);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

export function getRandomMove(game: Chess): string | null {
    const moves = game.moves();
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
}

export function getBestMove(game: Chess, depth: number = 3): string | null {
    const moves = game.moves();
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestValue = game.turn() === 'w' ? -Infinity : Infinity;

    // Randomize moves to avoid deterministic play in equal positions
    moves.sort(() => Math.random() - 0.5);

    for (const move of moves) {
        game.move(move);
        // Turn has switched
        const boardValue = minimax(
            game,
            depth - 1,
            -Infinity,
            Infinity,
            game.turn() === 'w'
        );
        game.undo();

        if (game.turn() === 'w') {
            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMove = move;
            }
        } else {
            if (boardValue < bestValue) {
                bestValue = boardValue;
                bestMove = move;
            }
        }
    }

    return bestMove || moves[0];
}
