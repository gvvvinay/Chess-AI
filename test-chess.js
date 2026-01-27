import { Chess } from 'chess.js';

try {
    const game = new Chess();
    console.log("Initial FEN:", game.fen());

    // Try a move
    const result = game.move({ from: 'e2', to: 'e4' });
    console.log("Move e2-e4 result:", result);
    console.log("New FEN:", game.fen());

    // Try an invalid move
    try {
        game.move({ from: 'e2', to: 'e5' });
    } catch (e) {
        console.log("Invalid move threw error as expected/unexpected:", e);
    }

    // Check AI logic
    const moves = game.moves();
    console.log("Available moves:", moves.length);

} catch (e) {
    console.error("Chess.js Test Failed:", e);
}
