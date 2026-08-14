// 역할놀이 — 가온이는 가이드. 어른 이어폰에만 들리고 아이 앞에는 나타나지 않는다.
// 대본은 주되 말은 어른이 한다 (제품 불변 원칙).
import { useEffect, useState } from "react";
import { ROLE_SCRIPTS } from "../lib/scripts";
import { speak, stopSpeak } from "../lib/tts";
import type { GameId } from "../lib/state";

type Props = {
  game: GameId;
  onFinish: () => void;
  onQuit: () => void;
};

export function RolePlay({ game, onFinish, onQuit }: Props) {
  const script = ROLE_SCRIPTS[game];
  const [step, setStep] = useState<"gate" | number | "closing">("gate");

  useEffect(() => stopSpeak, []);

  // 각 대사에 들어올 때 귀에 읽어준다 — 낮고 차분한 속삭임 톤
  useEffect(() => {
    if (typeof step === "number" && script) {
      stopSpeak();
      void speak(script.beats[step].text, { rate: 1.02, pitch: 0.95 });
    }
    if (step === "closing" && script) {
      stopSpeak();
      void speak(script.closing, { rate: 1.0, pitch: 0.95 });
    }
  }, [step, script]);

  if (!script) {
    onQuit();
    return null;
  }

  if (step === "gate") {
    return (
      <main className="screen dark">
        <div className="topline"><span>🎧 어른만 보세요</span><button onClick={onQuit}>그만하기</button></div>
        <div className="grow" style={{ display: "grid", alignContent: "center", gap: 6 }}>
          <div className="loveface guide">💗<span className="prop">🎧</span></div>
          <span className="rolechip guide">🎧 오늘 가온이는 가이드 — 아이에게는 안 보여요</span>
          <div className="beatcard" style={{ minHeight: 0, marginTop: 14 }}>
            <span className="whisper">시작 전 준비</span>
            <span className="line" style={{ fontSize: 16 }}>
              ① 이어폰 <b>한 짝만</b> 끼세요<br />
              ② 아이는 {script.childRole}, 어른은 {script.adultRole}<br />
              ③ {script.setup}
            </span>
          </div>
          <button
            className="ghost"
            style={{ marginTop: 10 }}
            onClick={() => void speak("잘 들리면 준비 끝!", { pitch: 0.95 })}
          >
            🔊 가온이 목소리 확인
          </button>
        </div>
        <button className="big love" onClick={() => setStep(0)}>귀에만 들려줘 — 시작</button>
      </main>
    );
  }

  if (step === "closing") {
    return (
      <main className="screen dark">
        <div className="topline"><span>🎧 {script.title}</span></div>
        <div className="grow" style={{ display: "grid", alignContent: "center" }}>
          <div className="beatcard">
            <span className="whisper">마지막 한 마디</span>
            <span className="line">{script.closing}</span>
          </div>
        </div>
        <button className="big leaf" onClick={() => { stopSpeak(); onFinish(); }}>놀이 끝 — 물 주러 가기</button>
      </main>
    );
  }

  const beat = script.beats[step];
  const last = step === script.beats.length - 1;

  return (
    <main className="screen dark">
      <div className="topline">
        <span>🎧 {script.title} · {step + 1} / {script.beats.length}</span>
        <button onClick={() => { stopSpeak(); onFinish(); }}>그만하기</button>
      </div>
      <div className="grow" style={{ display: "grid", alignContent: "center" }}>
        <div className="beatcard">
          <span className="whisper">어른 귀에만 — 그대로 하면 돼요</span>
          <span className="line">{beat.text}</span>
          {beat.hint && <span className="hint">💡 {beat.hint}</span>}
        </div>
        <div className="beatdots">
          {script.beats.map((_, i) => <i key={i} className={i <= step ? "on" : ""} />)}
        </div>
      </div>
      <div className="stack">
        <button className="big" onClick={() => setStep(last ? "closing" : step + 1)}>
          {last ? "마지막 한 마디" : "다음 한 마디"}
        </button>
        <button className="ghost" onClick={() => void speak(beat.text, { rate: 1.02, pitch: 0.95 })}>🔊 다시 듣기</button>
      </div>
    </main>
  );
}
