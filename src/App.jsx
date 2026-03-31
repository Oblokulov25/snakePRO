import { useEffect, useState, useCallback, useRef, useMemo } from "react";

const GRID_SIZE = 30;
const INITIAL_SNAKE = [[15, 15], [15, 16], [15, 17]];
const INITIAL_FOOD = [10, 10];
const SPEEDS = { EASY: 160, NORMAL: 100, HARD: 65 };

// 🛠 OPTIMIZATSIYA: Intervalni to'g'ri boshqarish uchun Hook
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function SnakePro() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState("UP");
  const [nextDir, setNextDir] = useState("UP");
  const [status, setStatus] = useState("START"); // START, PLAYING, PAUSED, GAMEOVER
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState("NORMAL");
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("snake_hs")) || 0);

  // 🎮 Yo'nalishni boshqarish va Pauzadan chiqarish
  const changeDirection = useCallback((newDir) => {
    const opposites = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (newDir !== opposites[direction]) {
      setNextDir(newDir);
      if (status === "PAUSED") setStatus("PLAYING");
    }
  }, [direction, status]);

  // 🐍 O'yin harakati
  const moveSnake = useCallback(() => {
    if (status !== "PLAYING") return;

    setSnake((prev) => {
      const head = [...prev[0]];
      setDirection(nextDir);

      if (nextDir === "UP") head[1] -= 1;
      if (nextDir === "DOWN") head[1] += 1;
      if (nextDir === "LEFT") head[0] -= 1;
      if (nextDir === "RIGHT") head[0] += 1;

      // To'qnashuv: Devor yoki O'ziga
      if (head[0] < 0 || head[1] < 0 || head[0] >= GRID_SIZE || head[1] >= GRID_SIZE || 
          prev.some(p => p[0] === head[0] && p[1] === head[1])) {
        setStatus("GAMEOVER");
        return prev;
      }

      const newSnake = [head, ...prev];

      // Ovqat yeyish
      if (head[0] === food[0] && head[1] === food[1]) {
        const points = difficulty === "HARD" ? 15 : 10;
        const newScore = score + points;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("snake_hs", newScore);
        }
        setFood([Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)]);
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [nextDir, food, status, score, difficulty, highScore]);

  useInterval(moveSnake, status === "PLAYING" ? SPEEDS[difficulty] : null);

  // ⌨️ Klaviatura boshqaruvi
  useEffect(() => {
    const handleKey = (e) => {
      const keys = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT" };
      if (keys[e.key]) changeDirection(keys[e.key]);
      if (e.key === " ") setStatus(s => s === "PLAYING" ? "PAUSED" : "PLAYING");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [changeDirection]);

  const reset = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection("UP");
    setNextDir("UP");
    setScore(0);
    setStatus("PLAYING");
  };

  // 🟦 Optimallashtirilgan Grid (useMemo)
  const renderedGrid = useMemo(() => {
    return Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
      const x = i % GRID_SIZE;
      const y = Math.floor(i / GRID_SIZE);
      const snakeIdx = snake.findIndex(p => p[0] === x && p[1] === y);
      const isHead = snakeIdx === 0;
      const isSnake = snakeIdx !== -1;
      const isFood = food[0] === x && food[1] === y;

      return (
        <div key={i} className="aspect-square border-[0.5px] border-white/[0.02] flex items-center justify-center relative">
          {isSnake && (
            <div className={`w-full h-full rounded-sm transition-all duration-150 ${isHead ? "bg-emerald-400 shadow-[0_0_15px_#10b981] z-10 scale-110" : "bg-emerald-600/60"}`}
                 style={{ opacity: isHead ? 1 : 1 - (snakeIdx / snake.length) * 0.7 }} />
          )}
          {isFood && (
            <div className="w-[95%] h-[95%] bg-rose-500 rounded-full shadow-[0_0_25px_#f43f5e] animate-pulse z-20 flex items-center justify-center">
              <div className="w-1/2 h-1/2 bg-white/20 rounded-full blur-[2px]" />
            </div>
          )}
        </div>
      );
    });
  }, [snake, food]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-white p-4 font-sans select-none">
      
      {/* HEADER */}
      <div className="w-full max-w-[480px] flex justify-between items-center mb-6 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent italic leading-none">SNAKE PRO</h1>
          <div className="flex gap-2">
            {["EASY", "NORMAL", "HARD"].map(lvl => (
              <button key={lvl} onClick={() => { setDifficulty(lvl); reset(); }}
                className={`text-[9px] font-black px-3 py-1 rounded-full border transition-all ${difficulty === lvl ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20" : "border-white/10 text-white/30"}`}>
                {lvl}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <StatDisplay label="BEST" value={highScore} color="text-white/20" />
          <StatDisplay label="SCORE" value={score} color="text-emerald-400" />
        </div>
      </div>

      {/* ARENA */}
      <div className="relative p-1.5 bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden ring-1 ring-white/10">
        <div className="grid bg-black/60 rounded-2xl overflow-hidden" 
             style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, clamp(8px, 2.5vw, 15px))` }}>
          {renderedGrid}
        </div>

        {/* OVERLAYS */}
        {status !== "PLAYING" && (
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl z-30 transition-all duration-500">
            <h2 className={`text-5xl font-black mb-10 italic tracking-tighter uppercase ${status === "GAMEOVER" ? "text-rose-500" : "text-emerald-400"}`}>
              {status === "GAMEOVER" ? "Crashed" : status === "PAUSED" ? "Paused" : "Ready?"}
            </h2>
            <button onClick={reset} className="px-14 py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-sm">
              {status === "GAMEOVER" ? "Re-Initialize" : "Execute Mission"}
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div /> <JoyBtn icon="▲" active={nextDir === "UP"} onClick={() => changeDirection("UP")} /> <div />
        <JoyBtn icon="◀" active={nextDir === "LEFT"} onClick={() => changeDirection("LEFT")} />
        <JoyBtn icon="▼" active={nextDir === "DOWN"} onClick={() => changeDirection("DOWN")} />
        <JoyBtn icon="▶" active={nextDir === "RIGHT"} onClick={() => changeDirection("RIGHT")} />
      </div>

      <div className="mt-8 flex gap-4 w-full max-w-[400px]">
          <button onClick={() => setStatus(s => s === "PLAYING" ? "PAUSED" : "PLAYING")} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all active:scale-95">
            {status === "PLAYING" ? "‖ Pause System" : "▶ Resume Engine"}
          </button>
      </div>
    </div>
  );
}

// 🧩 Helper Components
function StatDisplay({ label, value, color }) {
  return (
    <div className="text-right leading-none">
      <p className="text-[9px] font-black opacity-40 tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-mono font-black ${color}`}>{value.toString().padStart(3, '0')}</p>
    </div>
  );
}

function JoyBtn({ icon, onClick, active }) {
  return (
    <button onClick={onClick} className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-[2rem] text-2xl transition-all shadow-xl border-b-4 
      ${active ? "bg-emerald-500 border-emerald-700 text-slate-950 scale-95 border-b-0 translate-y-1" : "bg-white/5 border-white/10 text-white/30 active:border-b-0 active:translate-y-1"}`}>
      {icon}
    </button>
  );
}
