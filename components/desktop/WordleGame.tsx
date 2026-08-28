"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { all as wordleWords } from "../../node_modules/wordle-words/index.mjs";

const ANSWERS = [
  "ABOUT", "ABOVE", "ACTOR", "ACUTE", "ADORE", "AGILE", "ALERT", "ALIEN",
  "ALIGN", "AMBER", "APPLE", "ARGUE", "AUDIO", "BEACH", "BRAIN", "BRAVE",
  "BRICK", "BUILD", "CHARM", "CHESS", "CLEAN", "CLICK", "CLOUD", "CODEX",
  "COLOR", "CRANE", "CREATIVE", "DEBUG", "DESIGN", "DREAM", "EARTH", "FOCUS",
  "FRAME", "FRONT", "GHOST", "GLASS", "GRAIN", "GRAPH", "GREEN", "HOVER",
  "IDEAS", "INPUT", "LIGHT", "LOGIC", "MAKER", "MOUSE", "PIXEL", "PLANT",
  "REACT", "ROUTE", "SHAPE", "SPACE", "STACK", "STYLE", "SWIFT", "THEME",
  "TYPE", "VALUE", "WORLD", "WRITE",
].filter((word) => word.length === 5);

const ROWS = 6;
const COLS = 5;
const STORAGE_KEY = "portfolio-wordle-v3";
const DEVICE_SEED_KEY = "portfolio-wordle-device-seed";
const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const VALID_GUESSES = new Set([
  ...ANSWERS,
  ...wordleWords.map((word) => word.toUpperCase()),
]);

type TileState = "correct" | "present" | "absent";
type SavedGame = {
  day: string;
  answer: string;
  round: number;
  guesses: string[];
  status: "playing" | "won" | "lost";
};

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function deviceSeed() {
  const saved = window.localStorage.getItem(DEVICE_SEED_KEY);
  if (saved) return saved;

  const values = new Uint32Array(2);
  window.crypto.getRandomValues(values);
  const seed = Array.from(values, (value) => value.toString(36)).join("-");
  window.localStorage.setItem(DEVICE_SEED_KEY, seed);
  return seed;
}

function answerForDevice(day: string, seed: string) {
  let hash = 2166136261;
  for (const character of `${day}:${seed}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ANSWERS[(hash >>> 0) % ANSWERS.length];
}

function scoreGuess(guess: string, answer: string): TileState[] {
  const result: TileState[] = Array(COLS).fill("absent");
  const remaining = new Map<string, number>();

  for (let index = 0; index < COLS; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "correct";
    } else {
      remaining.set(answer[index], (remaining.get(answer[index]) ?? 0) + 1);
    }
  }

  for (let index = 0; index < COLS; index += 1) {
    const letter = guess[index];
    if (result[index] === "correct" || !remaining.get(letter)) continue;
    result[index] = "present";
    remaining.set(letter, (remaining.get(letter) ?? 0) - 1);
  }

  return result;
}

const tileClasses: Record<TileState, string> = {
  correct: "border-emerald-500 bg-emerald-700 text-white",
  present: "border-amber-400 bg-amber-600 text-black",
  absent: "border-dim bg-dim text-background",
};

const stateRank: Record<TileState, number> = { absent: 1, present: 2, correct: 3 };

export default function WordleGame() {
  const today = useMemo(() => dayKey(), []);
  const [answer, setAnswer] = useState(ANSWERS[0]);
  const [round, setRound] = useState(1);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState<SavedGame["status"]>("playing");
  const [message, setMessage] = useState("Guess the five-letter word.");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as SavedGame | null;
        if (!saved || saved.day !== today || !ANSWERS.includes(saved.answer)) {
          const nextAnswer = answerForDevice(today, deviceSeed());
          const initialGame: SavedGame = {
            day: today,
            answer: nextAnswer,
            round: 1,
            guesses: [],
            status: "playing",
          };
          setAnswer(nextAnswer);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGame));
          return;
        }
        setAnswer(saved.answer);
        setRound(saved.round);
        setGuesses(saved.guesses);
        setStatus(saved.status);
        if (saved.status === "won") setMessage(`Solved in ${saved.guesses.length}/6.`);
        if (saved.status === "lost") setMessage(`The word was ${saved.answer}.`);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [today]);

  function startNewGame() {
    const availableAnswers = ANSWERS.filter((word) => word !== answer);
    const nextAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
    const nextRound = round + 1;
    setAnswer(nextAnswer);
    setRound(nextRound);
    setGuesses([]);
    setCurrent("");
    setStatus("playing");
    setMessage("Guess the five-letter word.");
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ day: today, answer: nextAnswer, round: nextRound, guesses: [], status: "playing" } satisfies SavedGame)
    );
  }

  const keyStates = useMemo(() => {
    const states = new Map<string, TileState>();
    guesses.forEach((guess) => {
      scoreGuess(guess, answer).forEach((tileState, index) => {
        const letter = guess[index];
        const previous = states.get(letter);
        if (!previous || stateRank[tileState] > stateRank[previous]) states.set(letter, tileState);
      });
    });
    return states;
  }, [answer, guesses]);

  const handleKey = useCallback((key: string) => {
    if (status !== "playing") return;

    if (key === "BACKSPACE") {
      setCurrent((word) => word.slice(0, -1));
      setMessage("Guess the five-letter word.");
      return;
    }

    if (key === "ENTER") {
      if (current.length !== COLS) {
        setMessage("Not enough letters.");
        return;
      }

      if (!VALID_GUESSES.has(current)) {
        setMessage("Not in word list.");
        return;
      }

      const nextGuesses = [...guesses, current];
      const nextStatus: SavedGame["status"] =
        current === answer ? "won" : nextGuesses.length === ROWS ? "lost" : "playing";
      setGuesses(nextGuesses);
      setCurrent("");
      setStatus(nextStatus);
      setMessage(
        nextStatus === "won"
          ? `Solved in ${nextGuesses.length}/6.`
          : nextStatus === "lost"
            ? `The word was ${answer}.`
            : "Keep going."
      );
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ day: today, answer, round, guesses: nextGuesses, status: nextStatus } satisfies SavedGame)
      );
      return;
    }

    if (/^[A-Z]$/.test(key) && current.length < COLS) {
      setCurrent((word) => `${word}${key}`);
      setMessage("Guess the five-letter word.");
    }
  }, [answer, current, guesses, round, status, today]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        event.preventDefault();
        handleKey(key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const rows = Array.from({ length: ROWS }, (_, rowIndex) => {
    const submitted = guesses[rowIndex];
    const word = submitted ?? (rowIndex === guesses.length ? current : "");
    const scores = submitted ? scoreGuess(submitted, answer) : null;
    return { word, scores };
  });

  return (
    <section className="flex h-full min-h-[500px] flex-col items-center px-3 py-4 sm:px-6" aria-label="Word game">
      <header className="mb-3 w-full max-w-[350px] border-b border-line pb-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-dim">Round {round}</span>
          <span className="text-dimmer">/</span>
          <time className="text-[10px] text-dim">{today}</time>
        </div>
        <p className="mt-2 min-h-5 text-xs text-foreground" role="status" aria-live="polite">
          {message}
        </p>
        {status !== "playing" && (
          <button
            type="button"
            onClick={startNewGame}
            className="mt-2 border border-accent px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent hover:text-background"
          >
            New Game →
          </button>
        )}
      </header>

      <div className="grid grid-cols-5 gap-1.5" aria-label="Guess grid">
        {rows.flatMap((row, rowIndex) =>
          Array.from({ length: COLS }, (_, columnIndex) => {
            const letter = row.word[columnIndex] ?? "";
            const tileState = row.scores?.[columnIndex];
            const label = tileState ? `${letter}, ${tileState}` : letter || "empty";
            return (
              <div
                key={`${rowIndex}-${columnIndex}`}
                aria-label={label}
                className={`flex h-11 w-11 items-center justify-center border text-lg font-bold uppercase sm:h-12 sm:w-12 ${
                  tileState ? tileClasses[tileState] : letter ? "border-foreground text-foreground" : "border-line text-foreground"
                }`}
              >
                {letter}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-auto w-full max-w-[430px] space-y-1.5 pt-4" aria-label="On-screen keyboard">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={row} className="flex justify-center gap-1">
            {rowIndex === 2 && (
              <button type="button" onClick={() => handleKey("ENTER")} className="h-10 border border-line px-2 text-[9px] font-bold hover:border-accent hover:text-accent">
                ENTER
              </button>
            )}
            {row.split("").map((letter) => {
              const keyState = keyStates.get(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleKey(letter)}
                  aria-label={keyState ? `${letter}, ${keyState}` : letter}
                  className={`h-10 min-w-7 flex-1 border px-1 text-xs font-bold transition-colors sm:min-w-8 ${
                    keyState ? tileClasses[keyState] : "border-line bg-background text-foreground hover:border-accent hover:text-accent"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
            {rowIndex === 2 && (
              <button type="button" onClick={() => handleKey("BACKSPACE")} aria-label="Backspace" className="h-10 border border-line px-2 text-sm font-bold hover:border-accent hover:text-accent">
                ←
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[9px] uppercase tracking-[0.12em] text-dim">
        Green = exact · Amber = elsewhere · Gray = absent
      </p>
    </section>
  );
}
