import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getRandomMove, getBestMove } from '../engine/engine';

type PlayerType = 'human' | 'random' | 'minimax-1' | 'minimax-2' | 'minimax-3';

export default function Game() {
    const [game, setGame] = useState(new Chess());
    const [status, setStatus] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [autoPlayIntervalSeconds, setAutoPlayIntervalSeconds] = useState(2); // Default faster for AI vs AI
    const [history, setHistory] = useState<string[]>([]);

    // Player Configuration
    const [whitePlayer, setWhitePlayer] = useState<PlayerType>('human');
    const [blackPlayer, setBlackPlayer] = useState<PlayerType>('minimax-3');

    // Update status check
    useEffect(() => {
        if (game.isGameOver()) {
            setIsThinking(false);
            if (game.isCheckmate()) {
                const winner = game.turn() === 'w' ? 'Black' : 'White';
                const winnerType = game.turn() === 'w' ? blackPlayer : whitePlayer;
                const winnerName = winnerType === 'human' ? winner : `${winner} (${winnerType})`;
                setStatus(`Checkmate! ${winnerName} wins!`);
            }
            else if (game.isDraw()) setStatus('Draw!');
            else setStatus('Game Over!');
        } else {
            setStatus('');
        }
    }, [game, whitePlayer, blackPlayer]);

    // Game Loop Effect
    useEffect(() => {
        if (game.isGameOver()) return;

        const turn = game.turn();
        const currentPlayerType = turn === 'w' ? whitePlayer : blackPlayer;

        // Visual feedback if it's AI's turn
        if (currentPlayerType !== 'human') {
            setIsThinking(true);

            // Determine delay: fast if it's AI vs AI (AutoPlay usually not needed explicitly if we just have a "Start Match" button, 
            // but let's keep AutoPlay concept as "Run AI Loop").
            // Actually, simpler: Always run if it's AI turn. 
            // BUT we want to pause if user wants to.
            // Let's use `isAutoPlay` as a "System Active" toggle if BOTH are AI? 
            // OR just run automatically if it's AI turn? 
            // Let's stick to: If AI turn, run.

            const delay = autoPlayIntervalSeconds * 1000;

            const timer = setTimeout(() => {
                const gameCopy = new Chess(game.fen());
                let move = null;

                switch (currentPlayerType) {
                    case 'random':
                        move = getRandomMove(gameCopy);
                        break;
                    case 'minimax-1':
                        move = getBestMove(gameCopy, 1);
                        break;
                    case 'minimax-2':
                        move = getBestMove(gameCopy, 2);
                        break;
                    case 'minimax-3':
                        move = getBestMove(gameCopy, 3);
                        break;
                }

                if (move) {
                    const result = gameCopy.move(move);
                    setGame(gameCopy);
                    setHistory(prev => [...prev, result.san]);
                }

                setIsThinking(false);
            }, delay);

            return () => clearTimeout(timer);
        } else {
            setIsThinking(false);
        }
    }, [game, whitePlayer, blackPlayer, autoPlayIntervalSeconds]);

    const makeAMove = useCallback((move: any) => {
        try {
            const gameCopy = new Chess(game.fen());
            const result = gameCopy.move(move);
            setGame(gameCopy);
            setHistory(prev => [...prev, result.san]);
            return result;
        } catch (e) {
            return null;
        }
    }, [game]);

    function onDrop(sourceSquare: string, targetSquare: string) {
        // Only allow move if it is Human's turn
        const turn = game.turn();
        const currentPlayerType = turn === 'w' ? whitePlayer : blackPlayer;

        if (currentPlayerType !== 'human') return false;

        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        });

        if (move === null) return false;

        return true;
    }

    // makeAiMove function is no longer needed separately


    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 2;
        // Clamp between 2 seconds and 5 minutes (300 seconds)
        // We allow the user to type, but maybe clamp on blur? 
        // For simplicity, let's just update state but use min/max attributes in input.
        setAutoPlayIntervalSeconds(val);
    };



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
                        AI is thinking...
                    </div>
                )}

                <div className="flex flex-col gap-3 w-full max-w-md items-center bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                    {/* Player Configuration */}
                    <div className="flex w-full gap-2 justify-between text-sm">
                        <div className="flex flex-col gap-1 w-1/2">
                            <label className="text-neutral-400 font-medium">White</label>
                            <select
                                value={whitePlayer}
                                onChange={(e) => setWhitePlayer(e.target.value as PlayerType)}
                                className="bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:border-violet-500"
                            >
                                <option value="human">Human</option>
                                <option value="random">Random</option>
                                <option value="minimax-1">Minimax (Lv 1)</option>
                                <option value="minimax-2">Minimax (Lv 2)</option>
                                <option value="minimax-3">Minimax (Lv 3)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1 w-1/2">
                            <label className="text-neutral-400 font-medium">Black</label>
                            <select
                                value={blackPlayer}
                                onChange={(e) => setBlackPlayer(e.target.value as PlayerType)}
                                className="bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:border-violet-500"
                            >
                                <option value="human">Human</option>
                                <option value="random">Random</option>
                                <option value="minimax-1">Minimax (Lv 1)</option>
                                <option value="minimax-2">Minimax (Lv 2)</option>
                                <option value="minimax-3">Minimax (Lv 3)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full justify-center mt-2">
                        <button
                            onClick={() => {
                                setGame(new Chess());
                                setHistory([]);
                                setIsThinking(false);
                            }}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors flex-1"
                        >
                            Reset Game
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full justify-center text-sm text-neutral-400">
                        <label htmlFor="speed">AI Speed:</label>
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
