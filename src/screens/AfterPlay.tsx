// 놀이 끝 — 물 주기(아이 손) → (10방울이면 개화) → 기록 한 장 + 도장.
// 물은 하루 한 방울, 세션의 마침표는 아이가 찍는다 (제품 불변 원칙).
import { useEffect, useRef, useState } from "react";
import {
  bloom,
  canWaterToday,
  loadPlant,
  plantStage,
  saveRecord,
  water,
  type Adult,
  type GameId,
} from "../lib/state";
import { GAME_META } from "../lib/state";
import { speak, stopSpeak } from "../lib/tts";
import { VoiceButton } from "../components/VoiceButton";

type Props = {
  game: GameId;
  adults: Adult[];
  photo: string | null;
  onDone: () => void;
};

export function AfterPlay({ game, adults, photo, onDone }: Props) {
  const [step, setStep] = useState<"water" | "record">("water");
  const [drops, setDrops] = useState(() => loadPlant().drops);
  const [gained, setGained] = useState<number | null>(null);
  const [holdPct, setHoldPct] = useState(0);
  const [showBloom, setShowBloom] = useState(false);
  const [flowerName, setFlowerName] = useState("");
  const [quote, setQuote] = useState("");
  const [stamped, setStamped] = useState(false);
  const alreadyWatered = useRef(!canWaterToday()).current;
  // 세션 시작 시점의 꽃 개수 — 이번 세션 기록은 이 캡슐에 담긴다 (개화해도 이번 기록은 그 꽃의 마지막 장)
  const flowerIndex = useRef(loadPlant().flowers.length).current;
  const holdTimer = useRef<number | null>(null);

  useEffect(() => stopSpeak, []);

  // 꾹 눌러서 물 주기 — 아이의 손으로 900ms
  function holdStart() {
    if (gained !== null || alreadyWatered) return;
    let pct = 0;
    holdTimer.current = window.setInterval(() => {
      pct += 4;
      setHoldPct(pct);
      if (pct >= 100) {
        holdEnd();
        const result = water(game);
        setGained(result.gained);
        setDrops(result.drops);
        if (result.drops >= 10) {
          setTimeout(() => setShowBloom(true), 1100);
          void speak("꽃이 피었어요! 아이가 꽃 이름을 말해 줄래?");
        } else {
          void speak(result.gained === 2 ? "처음 하는 놀이라 두 방울!" : "물 한 방울, 쑥쑥 자라라!");
        }
      }
    }, 36);
  }
  function holdEnd() {
    if (holdTimer.current !== null) {
      window.clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setHoldPct((p) => (p >= 100 ? 100 : 0));
  }

  function plantFlower() {
    const name = flowerName.trim();
    if (!name) return;
    bloom(name);
    setDrops(loadPlant().drops);
    setShowBloom(false);
    setStep("record");
  }

  function finish() {
    saveRecord({
      at: new Date().toISOString(),
      game,
      adults,
      quote: quote.trim(),
      stamped,
      photo: photo ?? undefined,
      flowerIndex,
    });
    onDone();
  }

  if (step === "water") {
    const stage = plantStage(drops);
    return (
      <main className="screen">
        <div className="topline"><span>💧 물 주기</span></div>
        <h1 className="title center">{alreadyWatered ? "오늘 물은 벌써 줬어요" : "오늘 물 한 방울"}</h1>
        {alreadyWatered && <p className="sub center">그래도 같이 논 시간은 기록에 남아요</p>}
        <div className="grow potarea" style={{ display: "grid", alignContent: "center" }}>
          <div className="pot">
            <div className="plant">{stage.emoji}</div>
            <div className="vessel" />
          </div>
          <div className="dropline">
            {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < drops ? "on" : ""} />)}
          </div>
          <p className="sub center" style={{ marginTop: 10 }}>
            {stage.label} · {Math.min(drops, 10)} / 10
            {gained !== null && <b style={{ color: "#3583ab" }}> (+{gained})</b>}
          </p>
        </div>
        {alreadyWatered || gained !== null ? (
          <button className="big calm" onClick={() => (showBloom ? undefined : setStep("record"))}>
            기록 남기러 가기
          </button>
        ) : (
          <button
            className="waterbtn"
            onPointerDown={holdStart}
            onPointerUp={holdEnd}
            onPointerLeave={holdEnd}
          >
            💧 아이가 꾹 눌러서 물 주기
            <small>화면을 꾹 누르고 있으면 물이 나와요</small>
            <span className="fill"><i style={{ width: `${holdPct}%` }} /></span>
          </button>
        )}

        {showBloom && (
          <div className="bloomwrap">
            <div className="fl">🌸</div>
            <b>꽃이 피었어요!</b>
            <small>
              열 번 같이 놀아서 핀 꽃이에요.<br />아이가 이름을 지어 줄래요?
            </small>
            <VoiceButton big label="🎤 아이가 말한 이름 넣기" onText={(t) => setFlowerName(t.replace(/\s/g, "").slice(0, 12))} />
            <input
              className="nameinput"
              maxLength={12}
              placeholder="또는 여기에 적어요"
              value={flowerName}
              onChange={(e) => setFlowerName(e.target.value)}
            />
            <button className="big love" style={{ marginTop: 10 }} disabled={!flowerName.trim()} onClick={plantFlower}>
              🌸 정원에 심기
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="topline"><span>오늘 기록</span></div>
      <h1 className="title">한 장만 남길게요</h1>
      <div className="grow stack" style={{ alignContent: "center" }}>
        <div className="memo">
          {photo ? <img src={photo} alt="오늘 놀이 순간" /> : <div className="noshot">{GAME_META[game].emoji}</div>}
          <input
            className="quoteinput"
            maxLength={40}
            placeholder="아이가 한 말 한 줄 (안 써도 돼요)"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
        </div>
        <VoiceButton label="🎤 아이 말, 말로 남기기" onText={(t) => setQuote(t.slice(0, 40))} />
        <button className={`stampbtn${stamped ? " done" : ""}`} onClick={() => setStamped(true)}>
          <span className="st">🏅</span>
          <b>{stamped ? "도장 찍었다! 오늘 어른 참 잘했어요" : `아이가 ${adults.join("·")}에게 도장 찍어 주기`}</b>
        </button>
      </div>
      <button className="big calm" onClick={finish}>저장하고 끝내기</button>
    </main>
  );
}
