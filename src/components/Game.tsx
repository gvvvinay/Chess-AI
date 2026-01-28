import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from '../engine/engine';

export default function Game() {
    const [game, setGame] = useState(new Chess());
    const [status, setStatus] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [autoPlayIntervalSeconds, setAutoPlayIntervalSeconds] = useState(5);

    // Update status check
    useEffect(() => {
        if (game.isGameOver()) {
            setIsThinking(false);
            setIsAutoPlay(false); // Stop auto-play on game over
            if (game.isCheckmate()) setStatus('Checkmate!');
            else if (game.isDraw()) setStatus('Draw!');
            else setStatus('Game Over!');
        } else {
            setStatus('');
        }
    }, [game]);

    // Auto-Play Effect
    useEffect(() => {
        if (!isAutoPlay || game.isGameOver()) return;

        // Visual feedback
        setIsThinking(true);

        const timer = setTimeout(() => {
            const gameCopy = new Chess(game.fen());

            // Calculate best move for CURRENT turn (works for both white and black)
            const bestMove = getBestMove(gameCopy);

            if (bestMove) {
                gameCopy.move(bestMove);
                setGame(gameCopy);
            }

            setIsThinking(false);
        }, autoPlayIntervalSeconds * 1000);

        return () => clearTimeout(timer);
    }, [game, isAutoPlay, autoPlayIntervalSeconds]);

    const makeAMove = useCallback((move: any) => {
        try {
            const gameCopy = new Chess(game.fen());
            const result = gameCopy.move(move);
            setGame(gameCopy);
            return result;
        } catch (e) {
            return null;
        }
    }, [game]);

    function onDrop(sourceSquare: string, targetSquare: string) {
        if (isThinking || isAutoPlay) return false;

        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        });

        if (move === null) return false;

        // AI Turn (only if not auto-playing)
        setIsThinking(true);
        setTimeout(makeAiMove, 200);
        return true;
    }

    function makeAiMove() {
        const gameCopy = new Chess(game.fen());
        if (gameCopy.isGameOver()) {
            setIsThinking(false);
            return;
        }

        // Use setTimeout again to allow UI to render "Thinking" state if getting best move blocks slightly
        // actually getBestMove is sync, so it blocks. 
        // We are already in a setTimeout from onDrop, so that's fine.

        try {
            const bestMove = getBestMove(gameCopy);
            if (bestMove) {
                gameCopy.move(bestMove);
                setGame(gameCopy);
            }
        } finally {
            setIsThinking(false);
        }
    }

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 2;
        // Clamp between 2 seconds and 5 minutes (300 seconds)
        // We allow the user to type, but maybe clamp on blur? 
        // For simplicity, let's just update state but use min/max attributes in input.
        setAutoPlayIntervalSeconds(val);
    };

    const history = game.history();

    return (
        <div className="flex flex-col lg:flex-row items-start gap-8 p-4">
            <div className="flex flex-col items-center gap-4">
                <div className="w-[350px] md:w-[500px] h-[350px] md:h-[500px] shadow-2xl">
                    <Chessboard position={game.fen()} onPieceDrop={onDrop} boardWidth={500} />
                </div>

                {status && (
                    <div className="px-4 py-2 bg-red-600 rounded-lg animate-pulse font-bold w-full text-center">
                        {status}
                    </div>
                )}

                {isThinking && !status && (
                    <div className="text-violet-400 font-mono text-sm animate-pulse w-full text-center">
                        {isAutoPlay ? `Auto-playing (every ${autoPlayIntervalSeconds}s)...` : 'AI is thinking...'}
                    </div>
                )}

                <div className="flex flex-col gap-3 w-full max-w-md items-center bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                    <div className="flex gap-2 w-full justify-center">
                        <button
                            onClick={() => {
                                setGame(new Chess());
                                setIsAutoPlay(false);
                                setIsThinking(false);
                            }}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors flex-1"
                        >
                            Reset Game
                        </button>
                        <button
                            onClick={() => setIsAutoPlay(!isAutoPlay)}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex-1 ${isAutoPlay
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                        >
                            {isAutoPlay ? 'Stop Auto-Play' : 'Start Auto-Play'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full justify-center text-sm text-neutral-400">
                        <label htmlFor="speed">Move Speed:</label>
                        <input
                            id="speed"
                            type="number"
                            min="2"
                            max="300"
                            value={autoPlayIntervalSeconds}
                            onChange={handleIntervalChange}
                            className="bg-neutral-900 border border-neutral-600 rounded px-2 py-1 w-20 text-center text-white focus:outline-none focus:border-violet-500"
                        />
                        <span>seconds</span>
                    </div>
                </div>
            </div>

            {/* Move History Panel */}
            <div className="w-full lg:w-80 h-[500px] bg-neutral-800 rounded-xl border border-neutral-700 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-neutral-700 bg-neutral-800/50">
                    <h2 className="font-bold text-neutral-300">Move History</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-600">
                    {history.length === 0 ? (
                        <div className="text-neutral-500 text-sm text-center mt-10 italic">
                            No moves yet
                        </div>
                    ) : (
                        <div className="grid grid-cols-[3rem_1fr_1fr] gap-x-2 gap-y-1 text-sm">
                            <div className="contents text-neutral-500 font-mono text-xs border-b border-neutral-700/50 pb-1 mb-1">
                                <span>#</span>
                                <span>White</span>
                                <span>Black</span>
                            </div>

                            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                                <div key={i} className="contents group hover:bg-neutral-700/30">
                                    <span className="text-neutral-500 font-mono py-1 px-1">{i + 1}.</span>
                                    <span className="py-1 px-1 text-neutral-200 bg-neutral-700/10 rounded">{history[i * 2]}</span>
                                    <span className="py-1 px-1 text-neutral-200 bg-neutral-700/10 rounded">{history[i * 2 + 1] || ''}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
