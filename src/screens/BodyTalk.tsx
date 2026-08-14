// 몸으로 말해요 — 가온이는 사회자. 문제를 내고 정답 공개만 한다.
// 표현과 추측은 전부 사람이 한다. 점수는 없다 (1차 원칙: 개인 점수 금지).
import { useEffect, useRef, useState } from "react";
import { BODYTALK_WORDS, type BodyWord } from "../lib/words";
import { speak, stopSpeak } from "../lib/tts";
import type { Adult } from "../lib/state";

type Props = {
  adults: Adult[];
  onFinish: () => void;
};

type Performer = Adult | "아이";
type Phase = "pick" | "secret" | "acting" | "reveal";

function drawWord(used: Set<string>): BodyWord {
  const pool = BODYTALK_WORDS.filter((w) => !used.has(w.word));
  const from = pool.length > 0 ? pool : BODYTALK_WORDS;
  return from[Math.floor(Math.random() * from.length)];
}

export function BodyTalk({ adults, onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [performer, setPerformer] = useState<Performer>("아이");
  const [word, setWord] = useState<BodyWord | null>(null);
  const [left, setLeft] = useState(45);
  const [guessed, setGuessed] = useState(false);
  const [round, setRound] = useState(1);
  const usedRef = useRef(new Set<string>());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopSpeak();
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  function startSecret() {
    const w = drawWord(usedRef.current);
    usedRef.current.add(w.word);
    setWord(w);
    setPhase("secret");
  }

  function startActing() {
    setGuessed(false);
    setLeft(45);
    setPhase("acting");
    void speak("시작! 입으로 말하면 반칙이야!");
    timerRef.current = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current);
          setPhase("reveal");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function correct() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    setGuessed(true);
    setPhase("reveal");
    void speak(`딩동댕! 정답은 ${word?.word}!`);
  }

  function pass() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    setGuessed(false);
    setPhase("reveal");
    void speak(`아쉽다! 정답은 ${word?.word}이었어!`);
  }

  function nextRound() {
    stopSpeak();
    setRound((r) => r + 1);
    // 교대 제안 — 아이 ↔ 어른
    setPerformer(performer === "아이" ? (adults[0] ?? "아이") : "아이");
    setWord(null);
    setPhase("pick");
  }

  if (phase === "pick") {
    return (
      <main className="screen">
        <div className="topline"><span>🕺 몸으로 말해요 · {round}번째</span></div>
        <h1 className="title center">누가 몸으로<br />말할까?</h1>
        <p className="sub center">문제는 가온이가 내요 — 맞히는 건 나머지 사람!</p>
        <div className="grow" style={{ display: "grid", alignContent: "center", gap: 14 }}>
          <div className="chips" style={{ gridTemplateColumns: `repeat(${Math.min(adults.length + 1, 3)}, 1fr)` }}>
            {adults.map((a) => (
              <button key={a} className={`chip${performer === a ? " on" : ""}`} onClick={() => setPerformer(a)}>
                <i>{a === "엄마" ? "👩" : a === "아빠" ? "🧑‍🦱" : a === "할머니" ? "👵" : "👴"}</i>
                {a}
              </button>
            ))}
            <button className={`chip${performer === "아이" ? " on" : ""}`} onClick={() => setPerformer("아이")}>
              <i>🧒</i>아이
            </button>
          </div>
          <p className="notebox">입으로 말하면 반칙! 몸짓과 표정만으로 설명해요.</p>
        </div>
        <div className="stack">
          <button className="big" onClick={startSecret}>{performer}가 몸으로 말한다!</button>
          <button className="ghost" onClick={() => { stopSpeak(); onFinish(); }}>다 놀았어</button>
        </div>
      </main>
    );
  }

  if (phase === "secret" && word) {
    return (
      <main className="screen dark">
        <div className="topline"><span>🤫 {performer}만 보세요</span></div>
        <div className="grow" style={{ display: "grid", alignContent: "center", textAlign: "center", gap: 8 }}>
          <div style={{ fontSize: 96, lineHeight: 1.1 }}>{word.emoji}</div>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em" }}>{word.word}</div>
          <p className="sub center" style={{ color: "#a08a6e" }}>
            다른 사람이 보면 안 돼요!<br />그림을 기억했으면 시작을 눌러요
          </p>
        </div>
        <button className="big love" onClick={startActing}>봤어! 시작</button>
      </main>
    );
  }

  if (phase === "acting" && word) {
    return (
      <main className="screen">
        <div className="topline"><span>🎤 사회자 — 가온이</span><span>{performer}가 표현 중</span></div>
        <div className="grow" style={{ display: "grid", alignContent: "center", textAlign: "center", gap: 10 }}>
          <div style={{ fontSize: 74, fontWeight: 900, letterSpacing: "-0.05em", color: left <= 10 ? "var(--kill)" : "var(--ink)" }}>
            {left}
          </div>
          <p className="sub center">몸으로만! 맞히면 아래 버튼을 눌러요</p>
        </div>
        <div className="stack">
          <button className="big leaf" onClick={correct}>🙌 맞혔다!</button>
          <button className="ghost" onClick={pass}>모르겠어, 패스</button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="topline"><span>🕺 몸으로 말해요</span></div>
      <div className="grow" style={{ display: "grid", alignContent: "center", textAlign: "center", gap: 8 }}>
        <div style={{ fontSize: 90 }}>{word?.emoji}</div>
        <h1 className="title center" style={{ margin: 0 }}>
          정답은 {word?.word}!
        </h1>
        <p className="sub center">{guessed ? "찰떡같이 통했다! 이번엔 바꿔서 해볼까?" : "괜찮아, 다음 문제로 만회하자!"}</p>
      </div>
      <div className="stack">
        <button className="big" onClick={nextRound}>다음 문제 — 역할 바꾸기</button>
        <button className="big calm" onClick={() => { stopSpeak(); onFinish(); }}>다 놀았어, 물 주러 가자</button>
      </div>
    </main>
  );
}
