// 끝말잇기 — 사람이 둘뿐일 때만 가온이가 '놀이 친구'로 한 자리를 채운다.
// 어른이 2명 이상이면 사람 셋이서 하고 가온이는 사회자로 물러난다 (사람이 있으면 사람이 먼저).
// 순서: 아이 → 어른 → 가온이 → 아이 … 가온이의 단어는 아이가 잇기 쉬운 글자로 끝난다.
import { useEffect, useRef, useState } from "react";
import { gaonNextWord } from "../lib/words";
import { listenOnce, sttAvailable } from "../lib/stt";
import { speak, stopSpeak } from "../lib/tts";
import type { Adult } from "../lib/state";

type Props = {
  adults: Adult[];
  onFinish: () => void;
};

type Turn = "child" | "adult" | "gaon";

export function WordChain({ adults, onFinish }: Props) {
  const spectate = adults.length >= 2; // 사람 셋 이상 — 가온이는 구경(사회자)만
  const [turn, setTurn] = useState<Turn>("child");
  const [gaonWord, setGaonWord] = useState<string | null>(null);
  const [adultInput, setAdultInput] = useState("");
  const [listening, setListening] = useState(false);
  const [lost, setLost] = useState(false);
  const usedRef = useRef(new Set<string>());
  const adultLabel = adults.length === 1 ? adults[0] : "어른";

  useEffect(() => stopSpeak, []);

  // 첫 시작 단어 — 구경 모드에서는 이것만 주고 빠진다
  useEffect(() => {
    if (spectate) void speak("첫 단어는 내가 줄게. 사과! 과부터 시작이야. 아이부터!");
  }, [spectate]);

  async function micFill() {
    setListening(true);
    const heard = await listenOnce();
    setListening(false);
    if (heard) setAdultInput(heard.replace(/\s/g, ""));
  }

  function gaonTurn() {
    const prev = adultInput.trim().replace(/\s/g, "");
    if (!prev) return;
    usedRef.current.add(prev);
    setAdultInput("");
    setTurn("gaon");
    // 12%는 일부러 진다 — 가온이도 탈락할 수 있는 참가자다
    const next = Math.random() < 0.12 ? null : gaonNextWord(prev, usedRef.current);
    if (!next) {
      setLost(true);
      void speak(`${prev}… ${prev.slice(-1)}으로 시작하는 거… 으악, 생각이 안 나! 내가 졌다! 둘이 이겼어!`);
      return;
    }
    usedRef.current.add(next);
    setGaonWord(next);
    void speak(`${prev}! 그러면 나는… ${next}! ${next.slice(-1)}부터야, 아이 차례!`);
  }

  if (spectate) {
    return (
      <main className="screen">
        <div className="topline"><span>🎤 사회자 — 가온이</span></div>
        <h1 className="title center">셋이서 돌아가며!</h1>
        <p className="sub center">어른이 두 명이라 가온이는 구경할게요</p>
        <div className="grow" style={{ display: "grid", alignContent: "center", gap: 12 }}>
          <div className="bubble" style={{ marginTop: 0 }}>
            “첫 단어는 내가 줄게 — <b>사과!</b><br />‘과’부터 시작이야. 아이 → {adults.join(" → ")} 순서로!”
          </div>
          <p className="notebox">막히면 다시 ‘사과’부터 시작해도 돼요. 이긴 사람이 다음 첫 단어를 정해요.</p>
        </div>
        <button className="big calm" onClick={() => { stopSpeak(); onFinish(); }}>다 놀았어, 물 주러 가자</button>
      </main>
    );
  }

  if (lost) {
    return (
      <main className="screen">
        <div className="topline"><span>🙋 놀이 친구 — 가온이</span></div>
        <div className="grow" style={{ display: "grid", alignContent: "center", textAlign: "center", gap: 8 }}>
          <div style={{ fontSize: 84 }}>🙈</div>
          <h1 className="title center" style={{ margin: 0 }}>가온이가 졌다!</h1>
          <p className="sub center">아이랑 {adultLabel}이 이겼어요 — 가온이도 똑같이 탈락해요</p>
        </div>
        <button className="big calm" onClick={() => { stopSpeak(); onFinish(); }}>이긴 기분으로 물 주러 가기</button>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="topline">
        <span>🙋 놀이 친구 — 가온이</span>
        <button onClick={() => { stopSpeak(); onFinish(); }}>다 놀았어</button>
      </div>
      <h1 className="title center" style={{ fontSize: 23 }}>
        아이 → {adultLabel} → 가온이<br />순서로 이어요
      </h1>
      <div className="grow" style={{ display: "grid", alignContent: "center", gap: 12 }}>
        {gaonWord && (
          <div className="bubble" style={{ marginTop: 0, textAlign: "center" }}>
            가온이: “<b>{gaonWord}</b>!” → ‘{gaonWord.slice(-1)}’부터
          </div>
        )}
        {turn === "child" && (
          <>
            <div className="notebox" style={{ textAlign: "center", fontSize: 16 }}>
              🧒 <b>아이 차례</b> — 소리 내서 말해요!
            </div>
            <button className="big love" onClick={() => setTurn("adult")}>말했어! 다음은 {adultLabel}</button>
          </>
        )}
        {turn === "adult" && (
          <>
            <div className="notebox" style={{ textAlign: "center", fontSize: 16 }}>
              🧑‍🦱 <b>{adultLabel} 차례</b> — 말하고, 단어를 적어 주세요
            </div>
            <input
              className="quoteinput"
              placeholder={`${adultLabel}이 말한 단어`}
              value={adultInput}
              maxLength={10}
              onChange={(e) => setAdultInput(e.target.value)}
            />
            {sttAvailable() && (
              <button className="ghost" onClick={micFill} disabled={listening}>
                {listening ? "👂 듣는 중…" : "🎤 말로 넣기"}
              </button>
            )}
            <button className="big" disabled={!adultInput.trim()} onClick={gaonTurn}>
              가온이 차례로!
            </button>
          </>
        )}
        {turn === "gaon" && gaonWord && (
          <button className="big love" onClick={() => setTurn("child")}>들었어! 아이 차례</button>
        )}
      </div>
      <p className="notebox">가온이가 적는 걸 부탁하는 건 {adultLabel} 단어 하나뿐이에요 — 아이 단어는 귀로만 들어요.</p>
    </main>
  );
}
