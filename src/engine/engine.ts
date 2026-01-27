import { Chess } from 'chess.js';

// Piece values
const PIECE_VALUES: Record<string, number> = {
    p: 10,
    n: 30,
    b: 30,
    r: 50,
    q: 90,
    k: 900,
};

// Evaluate board from the perspective of the player currently moving
// Positive score -> Good for current turn player
// However, standard minimax usually evaluates for White. 
// Let's stick to: Positive = White advantage, Negative = Black advantage.
const evaluateBoard = (game: Chess): number => {
    let totalEvaluation = 0;
    const board = game.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const value = PIECE_VALUES[piece.type] || 0;
                totalEvaluation += piece.color === 'w' ? value : -value;
            }
        }
    }
    return totalEvaluation;
};

// Minimax with Alpha-Beta Pruning
const minimax = (
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean // True = White, False = Black
): number => {
    if (depth === 0 || game.isGameOver()) {
        return evaluateBoard(game);
    }

    const moves = game.moves();

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evalScore = minimax(game, depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evalScore = minimax(game, depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

export const getBestMove = (game: Chess): string | null => {
    const moves = game.moves();
    if (moves.length === 0) return null;

    let bestMove: string | null = null;
    let bestValue = game.turn() === 'w' ? -Infinity : Infinity;
    const isMaximizing = game.turn() === 'w';

    // Randomize order to add variety if scores are equal
    moves.sort(() => Math.random() - 0.5);

    // Iterative deepening or just fixed depth? Fixed depth 3 is safe for JS.
    const DEPTH = 3;

    for (const move of moves) {
        game.move(move);
        const boardValue = minimax(game, DEPTH - 1, -Infinity, Infinity, !isMaximizing);
        game.undo();

        if (isMaximizing) {
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
};
