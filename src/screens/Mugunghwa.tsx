// 무궁화꽃이 피었습니다 — 사랑이는 사회자(구호)와 심판(판정)만 맡는다.
// 술래는 반드시 사람이다 (제품 불변 원칙: 놀이 안의 사람 역할을 뺏지 않는다).
import { useEffect, useRef, useState } from "react";
import { ADULT_THRESHOLD, CHILD_THRESHOLD, MotionJudge, SAMPLE_MS, SETTLE_MS, WATCH_MS } from "../lib/motion";
import { speak, stopSpeak } from "../lib/tts";
import type { Adult } from "../lib/state";

// 실기기 튜닝용 실측 오버레이 — URL에 ?debug 를 붙였을 때만 보인다
const DEBUG = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

type Props = {
  adults: Adult[];
  startedAt: number;
  onFinish: (photo: string | null) => void;
};

type Phase = "taggerpick" | "setup" | "play";
type Tagger = Adult | "아이";
type Shout = { text: string; tone: "plain" | "alert" | "safe" } | null;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function Mugunghwa({ adults, startedAt, onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>("taggerpick");
  const [tagger, setTagger] = useState<Tagger>(adults[0] ?? "아이");
  const [manual, setManual] = useState(false);
  const [shout, setShout] = useState<Shout>(null);
  const [win, setWin] = useState(false);
  const [debugStat, setDebugStat] = useState<{ live: number; max: number } | null>(null);

  const judgeRef = useRef<MotionJudge | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const genRef = useRef(0);
  const photoRef = useRef<string | null>(null);

  const adultLabel = adults.length === 1 ? adults[0] : "어른들";
  const challengerLabel = tagger === "아이" ? adultLabel : "아이";

  useEffect(() => {
    return () => {
      genRef.current++;
      stopSpeak();
      judgeRef.current?.stop();
    };
  }, []);

  // 세팅 단계 진입 시 카메라 시작 — 실패하면 수동 판정 모드로 계속 간다
  useEffect(() => {
    if (phase !== "setup") return;
    const judge = new MotionJudge();
    judgeRef.current = judge;
    judge
      .start(previewRef.current ?? undefined)
      .catch(() => setManual(true));
  }, [phase]);

  function dead(gen: number) {
    return gen !== genRef.current;
  }

  async function runRound(gen: number): Promise<void> {
    if (dead(gen)) return;
    const judge = judgeRef.current;
    setShout(null);
    await sleep(700);
    if (dead(gen)) return;

    // ① 구호 — 속도를 매번 다르게 (놀이의 긴장 그 자체)
    const rate = 0.65 + Math.random() * 0.85;
    setShout({ text: "무궁화꽃이\n피었습니다!", tone: "plain" });
    await speak("무궁화꽃이 피었습니다!", { rate });
    if (dead(gen)) return;

    // ② 정지 감시 창
    setShout({ text: "멈춰!", tone: "plain" });
    let max = 0;
    if (judge?.active && !manual) {
      // 구호가 끝나고 완전히 멈추기까지 한 박자(사람 반응 시간)는 봐준다 —
      // 이 유예 없이 기준을 찍으면 멈추는 동작 자체가 차분으로 남아 계속 "들켰다"가 난다.
      await sleep(SETTLE_MS);
      if (dead(gen)) return;
      judge.setBaseline();
      let prev = 0;
      const until = Date.now() + WATCH_MS;
      while (Date.now() < until) {
        await sleep(SAMPLE_MS);
        if (dead(gen)) return;
        const r = judge.movementRatio();
        // 초점·노출이 튄 한 프레임으로 잡지 않는다 — 연속 2샘플이 같이 넘어야 인정
        max = Math.max(max, Math.min(prev, r));
        prev = r;
        if (DEBUG) setDebugStat({ live: r, max });
      }
    } else {
      await sleep(1300);
    }
    if (dead(gen)) return;

    // ③ 판정 — 도전자가 아이면 관대, 어른이면 엄격 (의도된 편애)
    const childIsChallenger = tagger !== "아이";
    if (judge?.active && !manual) {
      const threshold = childIsChallenger ? CHILD_THRESHOLD : ADULT_THRESHOLD;
      if (max > threshold) {
        if (childIsChallenger && Math.random() < 0.5) {
          setShout({ text: "음…\n바람인 걸로!", tone: "safe" });
          await speak("음… 방금 건 바람인 걸로 할게. 통과!");
        } else if (childIsChallenger) {
          setShout({ text: "들켰다!", tone: "alert" });
          await speak("들켰다! 처음부터 다시 출발!");
        } else {
          setShout({ text: "움직였다!\n처음부터!", tone: "alert" });
          await speak(`${challengerLabel} 방금 움직였죠? 처음부터 다시!`);
        }
      } else {
        setShout({ text: "통과!", tone: "safe" });
      }
    } else {
      // 수동 모드 — 판정은 술래의 눈이 한다
      setShout({ text: "술래가\n돌아본다!", tone: "plain" });
      await speak("술래가 돌아본다!");
    }
    if (dead(gen)) return;
    await sleep(900);
    void runRound(gen);
  }

  function startPlay() {
    setPhase("play");
    const gen = ++genRef.current;
    void runRound(gen);
  }

  function handleWin() {
    genRef.current++;
    stopSpeak();
    photoRef.current = judgeRef.current?.snapshot() ?? null;
    setWin(true);
    void speak("와, 진짜 빨랐어!");
  }

  function playAgainSwapped() {
    setTagger(tagger === "아이" ? (adults[0] ?? "아이") : "아이");
    setWin(false);
    const gen = ++genRef.current;
    void runRound(gen);
  }

  function finish() {
    genRef.current++;
    stopSpeak();
    judgeRef.current?.stop();
    onFinish(photoRef.current);
  }

  if (phase === "taggerpick") {
    return (
      <main className="screen">
        <div className="topline"><span>🌺 무궁화꽃이 피었습니다</span></div>
        <h1 className="title center">술래는 누가 할까?</h1>
        <p className="sub center">사랑이는 술래를 하지 않아요</p>
        <div className="grow" style={{ display: "grid", alignContent: "center", gap: 14 }}>
          <div className="chips" style={{ gridTemplateColumns: `repeat(${Math.min(adults.length + 1, 3)}, 1fr)` }}>
            {adults.map((a) => (
              <button key={a} className={`chip${tagger === a ? " on" : ""}`} onClick={() => setTagger(a)}>
                <i>{a === "엄마" ? "👩" : a === "아빠" ? "🧑‍🦱" : a === "할머니" ? "👵" : "👴"}</i>
                {a}
              </button>
            ))}
            <button className={`chip${tagger === "아이" ? " on" : ""}`} onClick={() => setTagger("아이")}>
              <i>🧒</i>아이
            </button>
          </div>
          <button className="chip" disabled>
            <i>💗</i>사랑이<small>술래는 못 해요</small>
          </button>
          <p className="notebox">술래가 구호를 듣는 동안, 반대편이 살금살금 다가가서 <b>등을 치면 승리</b>예요.</p>
        </div>
        <button className="big" onClick={() => setPhase("setup")}>{tagger}가 술래!</button>
      </main>
    );
  }

  if (phase === "setup") {
    return (
      <main className="screen">
        <div className="topline"><span>세팅 10초</span></div>
        <h1 className="title">폰을 세워서<br />도전자가 보이게</h1>
        <div className="grow stack" style={{ alignContent: "center" }}>
          <div className="camwrap" style={{ minHeight: 220, flex: "none", height: 220 }}>
            <video ref={previewRef} playsInline muted />
            {manual && (
              <div className="shout" style={{ fontSize: 17 }}>
                카메라를 쓸 수 없어요{"\n"}술래가 눈으로 판정해요!
              </div>
            )}
          </div>
          <p className="notebox">
            📱 폰은 벽이나 컵에 기대 세워요 · 🏃 도전자는 방 반대쪽 · 🙈 술래({tagger})는 폰 옆에 서서 눈을 감아요
          </p>
          <p className="notebox privacy">📸 사랑이는 <b>움직임만</b> 봐요 — 영상은 저장하지도, 보내지도 않아요</p>
        </div>
        <button className="big" onClick={startPlay}>준비 끝, 시작!</button>
      </main>
    );
  }

  const elapsedMin = Math.floor((Date.now() - startedAt) / 60000);

  return (
    <main className="screen dark" style={{ paddingLeft: 12, paddingRight: 12 }}>
      <div className="topline">
        <span>🎤 사회자 · 🔔 심판 — 사랑이</span>
        <span>술래: {tagger}</span>
      </div>
      <div className="camwrap">
        <video ref={previewRef} playsInline muted />
        {!manual && <span className="camnote">● 움직임만 봄 · 저장 안 함</span>}
        {DEBUG && debugStat && (
          <span className="camnote" style={{ top: "auto", bottom: 10, textShadow: "0 1px 3px #000" }}>
            지금 {debugStat.live.toFixed(3)} · 최대 {debugStat.max.toFixed(3)} · 기준{" "}
            {(tagger !== "아이" ? CHILD_THRESHOLD : ADULT_THRESHOLD).toFixed(3)}
          </span>
        )}
        <span className="camtag">도전자: {challengerLabel}</span>
        {shout && (
          <div className={`shout${shout.tone === "alert" ? " alert" : shout.tone === "safe" ? " safe" : ""}`}>
            {shout.text.split("\n").map((l) => <div key={l}>{l}</div>)}
          </div>
        )}
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="big love" onClick={handleWin}>🖐 등 쳤다!</button>
        <button className="ghost" onClick={finish}>다 놀았어</button>
      </div>

      {win && (
        <div className="winwrap">
          <div className="boom">🎉</div>
          <b>{challengerLabel}가 {tagger} 등을 쳤다!</b>
          <small>
            사랑이: “와, 진짜 빨랐어!”
            {elapsedMin >= 10 && <><br />약속한 10분이 지났어요 — 더 노는 건 자유!</>}
          </small>
          <div className="stack" style={{ marginTop: 14 }}>
            <button className="big" onClick={playAgainSwapped}>한 판 더 — 역할 바꾸기</button>
            <button className="big calm" onClick={finish}>다 놀았어, 물 주러 가자</button>
          </div>
        </div>
      )}
    </main>
  );
}
