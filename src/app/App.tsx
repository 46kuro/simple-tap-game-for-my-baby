import { useState, useEffect, useRef } from 'react';

type GameObject = {
  id: number;
  type: 'normal' | 'golden' | 'apple' | 'star' | 'heart' | 'candy';
  x: number;
  y: number;
  points: number;
  emoji: string;
};

type GameState = 'start' | 'playing' | 'ended';

type Particle = {
  id: number;
  x: number;
  y: number;
  emoji: string;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const objectIdCounter = useRef(0);
  const particleIdCounter = useRef(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const objectTypes = [
    { type: 'normal' as const, emoji: '💩', points: 1, probability: 0.70 },
    { type: 'golden' as const, emoji: '✨', points: 5, probability: 0.05 },
    { type: 'apple' as const, emoji: '🍎', points: 2, probability: 0.08 },
    { type: 'star' as const, emoji: '⭐', points: 2, probability: 0.08 },
    { type: 'heart' as const, emoji: '❤️', points: 2, probability: 0.05 },
    { type: 'candy' as const, emoji: '🍬', points: 2, probability: 0.04 },
  ];

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    setObjects([]);
    setParticles([]);
    objectIdCounter.current = 0;
    particleIdCounter.current = 0;
  };

  const endGame = () => {
    setGameState('ended');
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    setObjects([]);
    setParticles([]);
  };

  const handleTap = (id: number, points: number, x: number, y: number, emoji: string) => {
    setScore(prev => prev + points);
    setObjects(prev => prev.filter(obj => obj.id !== id));
    
    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdCounter.current++,
        x,
        y,
        emoji: points === 5 ? '✨' : points === 2 ? '⭐' : '💫',
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    // Game timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawn objects - slower for young children
    const spawnObject = () => {
      setObjects(prev => {
        if (prev.length >= 6) return prev;

        const rand = Math.random();
        let cumulative = 0;
        let selectedType = objectTypes[0];

        for (const type of objectTypes) {
          cumulative += type.probability;
          if (rand < cumulative) {
            selectedType = type;
            break;
          }
        }

        const newObject: GameObject = {
          id: objectIdCounter.current++,
          type: selectedType.type,
          emoji: selectedType.emoji,
          points: selectedType.points,
          x: Math.random() * 80 + 10, // 10% to 90%
          y: Math.random() * 70 + 15, // 15% to 85%
        };

        return [...prev, newObject];
      });
    };

    // Slower spawn rate: 1500-2000ms
    spawnTimerRef.current = setInterval(() => {
      spawnObject();
    }, 1500 + Math.random() * 500);

    // Auto-remove objects after 3 seconds (longer display time)
    const removeTimer = setInterval(() => {
      setObjects(prev => {
        if (prev.length > 0) {
          return prev.slice(1);
        }
        return prev;
      });
    }, 3000);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      clearInterval(removeTimer);
    };
  }, [gameState]);

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center bg-white/80 backdrop-blur rounded-3xl px-6 py-4 shadow-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">スコア</div>
            <div className="text-4xl font-bold text-purple-600">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">のこり</div>
            <div className="text-4xl font-bold text-blue-600">{timeLeft}秒</div>
          </div>
        </div>

        {/* Play Area */}
        <div className="relative bg-white/60 backdrop-blur rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] border-4 border-white">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-blue-50 opacity-60" />
          <div className="absolute top-4 left-4 text-4xl opacity-20">���️</div>
          <div className="absolute top-8 right-8 text-4xl opacity-20">☁️</div>
          <div className="absolute bottom-8 left-12 text-4xl opacity-20">☁️</div>

          {/* Start Screen */}
          {gameState === 'start' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/40 backdrop-blur-sm">
              <div className="text-6xl mb-8 animate-bounce">💩✨</div>
              <h1 className="text-4xl sm:text-5xl font-bold text-purple-600 mb-8">うんちタップ!</h1>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-6 rounded-full text-3xl font-bold shadow-xl hover:scale-110 transition-transform active:scale-95"
              >
                スタート！
              </button>
            </div>
          )}

          {/* Game Objects */}
          {gameState === 'playing' && objects.map(obj => (
            <button
              key={obj.id}
              onClick={() => handleTap(obj.id, obj.points, obj.x, obj.y, obj.emoji)}
              className="absolute transition-all duration-500 hover:scale-125 active:scale-90 cursor-pointer animate-[wiggle_1s_ease-in-out_infinite]"
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                fontSize: obj.type === 'golden' ? '5rem' : '4rem',
                filter: obj.type === 'golden' ? 'drop-shadow(0 0 15px gold)' : 'none',
                animation: 'wiggle 1s ease-in-out infinite',
              }}
            >
              {obj.emoji}
              {obj.type === 'golden' && <span className="absolute -top-2 -right-2 text-3xl animate-pulse">✨</span>}
            </button>
          ))}

          {/* Particles */}
          {particles.map((particle, idx) => (
            <div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                fontSize: '2.5rem',
                animation: `particle-${idx % 8} 0.6s ease-out forwards`,
              }}
            >
              {particle.emoji}
            </div>
          ))}

          {/* End Screen */}
          {gameState === 'ended' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/90 backdrop-blur-sm">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-4xl sm:text-5xl font-bold text-purple-600 mb-4">おしまい！</h2>
              <div className="text-2xl text-gray-700 mb-8">
                スコア: <span className="text-5xl font-bold text-purple-600">{score}</span>
              </div>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-12 py-6 rounded-full text-3xl font-bold shadow-xl hover:scale-110 transition-transform active:scale-95"
              >
                もういっかい！
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {gameState === 'start' && (
          <div className="mt-4 text-center text-gray-600">
            <p className="text-lg">でてくるものをタップしてね！</p>
          </div>
        )}
      </div>
    </div>
  );
}