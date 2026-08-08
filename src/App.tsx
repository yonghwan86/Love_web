// 사랑이 — 화면 상태 기계.
// 원칙(스펙 5절): 사랑이는 놀이가 정해진 뒤에만 등장한다. 놀이 선택 화면까지는 캐릭터가 없다.
import { useState } from "react";
import { GAME_META, isNewGame, type Adult, type GameId, type GameKind } from "./lib/state";
import { speak, stopSpeak } from "./lib/tts";
import { Mugunghwa } from "./screens/Mugunghwa";
import { BodyTalk } from "./screens/BodyTalk";
import { WordChain } from "./screens/WordChain";
import { RolePlay } from "./screens/RolePlay";
import { AfterPlay } from "./screens/AfterPlay";
import { Garden } from "./screens/Garden";

type Screen = "gate" | "participants" | "gamepick" | "intro" | "play" | "after" | "garden";

type Session = {
  adults: Adult[];
  game: GameId;
  startedAt: number;
};

const ADULTS: Array<{ id: Adult; emoji: string }> = [
  { id: "엄마", emoji: "👩" },
  { id: "아빠", emoji: "🧑‍🦱" },
  { id: "할머니", emoji: "👵" },
  { id: "할아버지", emoji: "👴" },
];

export function App() {
  const [screen, setScreen] = useState<Screen>("gate");
  const [adults, setAdults] = useState<Adult[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  function goHome() {
    stopSpeak();
    setSession(null);
    setPhoto(null);
    setScreen("gate");
  }

  // 사랑이의 등장 대사·역할 — 놀이가 정해진 뒤에야 정해진다
  function introFor(game: GameId, adultCount: number) {
    if (game === "mugunghwa") {
      return { face: "host", prop: "🎤", chip: "🎤 오늘 사랑이는 사회자", jsx: <>“무궁화꽃이 피었습니다!<br />구호는 내가 외칠게.<br /><b>술래는 누가 할래?</b>”</>, tts: "무궁화꽃이 피었습니다, 하자! 구호는 내가 외칠게. 술래는 누가 할래?" };
    }
    if (game === "bodytalk") {
      return { face: "host", prop: "🎤", chip: "🎤 오늘 사랑이는 사회자", jsx: <>“몸으로 말해요!<br />문제는 내가 낼게.<br /><b>입으로 말하면 반칙이야!</b>”</>, tts: "몸으로 말해요, 하자! 문제는 내가 낼게. 입으로 말하면 반칙이야!" };
    }
    // 끝말잇기 — 사람이 셋 이상이면 사랑이는 놀이 친구 자리를 비운다 (사람이 먼저)
    if (adultCount >= 2) {
      return { face: "host", prop: "🎤", chip: "🎤 오늘 사랑이는 사회자", jsx: <>“어른이 두 명이네!<br />그럼 나는 구경할게.<br /><b>셋이서 돌아가면서 해요!</b>”</>, tts: "어른이 두 명이네! 그럼 나는 구경할게. 셋이서 돌아가면서 해요!" };
    }
    return { face: "", prop: "🙋", chip: "🙋 오늘 사랑이는 놀이 친구", jsx: <>“끝말잇기!<br />나도 껴 줘.<br /><b>아이부터 시작하자!</b>”</>, tts: "끝말잇기, 하자! 나도 껴 줘. 아이부터 시작하자!" };
  }

  function pickGame(game: GameId) {
    setSession({ adults, game, startedAt: Date.now() });
    if (game === "hospital" || game === "police") {
      // 역할놀이의 사랑이는 가이드 — 아이 앞에 나타나지 않으므로 소개 화면 없이 어른 전용 게이트로 간다
      setScreen("play");
    } else {
      setScreen("intro");
      void speak(introFor(game, adults.length).tts);
    }
  }

  if (screen === "gate") {
    return (
      <main className="screen">
        <div className="topline"><span>사랑이</span><span>같이 논 시간이 꽃이 돼요</span></div>
        <div className="grow" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          <div className="keyring">🔑</div>
          <div>
            <h1 className="title center">키링을 폰 뒤에<br />톡, 하고 왔나요?</h1>
            <p className="sub center">아이가 열쇠를 가져오면 놀이 시간이에요</p>
          </div>
        </div>
        <div className="stack">
          <button className="big love" onClick={() => setScreen("participants")}>놀이 열기</button>
          <button className="ghost" onClick={() => setScreen("garden")}>🌸 우리 정원 보기</button>
        </div>
      </main>
    );
  }

  if (screen === "participants") {
    return (
      <main className="screen">
        <div className="topline"><span>1 / 2</span><button onClick={goHome}>처음으로</button></div>
        <h1 className="title">오늘 누가<br />같이 놀아요?</h1>
        <p className="sub">여러 명 골라도 돼요</p>
        <div className="grow" style={{ display: "grid", alignContent: "center" }}>
          <div className="chips">
            {ADULTS.map((a) => {
              const on = adults.includes(a.id);
              return (
                <button
                  key={a.id}
                  className={`chip${on ? " on" : ""}`}
                  onClick={() => setAdults(on ? adults.filter((x) => x !== a.id) : [...adults, a.id])}
                >
                  <i>{a.emoji}</i>
                  {a.id}
                </button>
              );
            })}
          </div>
        </div>
        <button className="big" disabled={adults.length === 0} onClick={() => setScreen("gamepick")}>
          {adults.length > 0 ? `${adults.join("랑 ")}랑 놀기` : "같이 놀 사람을 골라요"}
        </button>
      </main>
    );
  }

  if (screen === "gamepick") {
    const games: GameId[] = ["mugunghwa", "bodytalk", "wordchain", "hospital", "police"];
    return (
      <main className="screen">
        <div className="topline"><span>2 / 2</span><button onClick={() => setScreen("participants")}>뒤로</button></div>
        <h1 className="title">뭐 하고 놀까?</h1>
        <p className="sub">아이가 고르게 해 주세요</p>
        <div className="grow">
          {(["몸놀이", "말놀이", "되어 보는 놀이"] as GameKind[]).map((kind) => (
            <div key={kind}>
              <div className="cat">{kind}</div>
              <div className="stack">
                {games.filter((g) => GAME_META[g].kind === kind).map((g) => (
                  <button key={g} className="gamerow" onClick={() => pickGame(g)}>
                    <span style={{ fontSize: 16, color: "inherit", fontWeight: 900 }}>
                      {GAME_META[g].emoji} {GAME_META[g].title}
                    </span>
                    {isNewGame(g) ? <span className="new">💧2 처음 하는 놀이</span> : <span>{GAME_META[g].kind}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="notebox" style={{ textAlign: "center" }}>여기까지 사랑이는 나오지 않아요 — 놀이가 정해져야 등장해요</p>
      </main>
    );
  }

  if (screen === "intro" && session) {
    const intro = introFor(session.game, session.adults.length);
    return (
      <main className="screen">
        <div className="topline"><span>사랑이 등장</span><button onClick={goHome}>처음으로</button></div>
        <div className="grow" style={{ display: "grid", alignContent: "center" }}>
          <div className={`loveface ${intro.face}`}>💗<span className="prop">{intro.prop}</span></div>
          <span className="rolechip">{intro.chip}</span>
          <div className="bubble">{intro.jsx}</div>
        </div>
        <button className="big love" onClick={() => { stopSpeak(); setScreen("play"); }}>좋아!</button>
      </main>
    );
  }

  if (screen === "play" && session) {
    const done = (shot: string | null = null) => { setPhoto(shot); setScreen("after"); };
    if (session.game === "mugunghwa") {
      return <Mugunghwa adults={session.adults} startedAt={session.startedAt} onFinish={done} />;
    }
    if (session.game === "bodytalk") {
      return <BodyTalk adults={session.adults} onFinish={() => done()} />;
    }
    if (session.game === "wordchain") {
      return <WordChain adults={session.adults} onFinish={() => done()} />;
    }
    return <RolePlay game={session.game} onFinish={() => done()} onQuit={goHome} />;
  }

  if (screen === "after" && session) {
    return <AfterPlay game={session.game} adults={session.adults} photo={photo} onDone={goHome} />;
  }

  if (screen === "garden") {
    return <Garden onBack={() => setScreen("gate")} />;
  }

  return null;
}
