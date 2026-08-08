// 우리 정원 — 꽃 하나가 기록 캡슐이다. 꽃을 누르면 그 시절의 기록이 펼쳐진다.
import { useState } from "react";
import { GAME_META, loadPlant, loadRecords, plantStage, type PlayRecord } from "../lib/state";

const FLOWER_EMOJIS = ["🌸", "🌻", "🌷", "🌼", "🌺", "💐"];

function recordDate(r: PlayRecord): string {
  // toISOString은 UTC라 한국 시간과 하루 어긋난다 — 표시할 때 로컬로 변환
  return new Date(r.at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export function Garden({ onBack }: { onBack: () => void }) {
  const plant = loadPlant();
  const records = loadRecords();
  const stage = plantStage(plant.drops);
  const [open, setOpen] = useState<number | null>(null); // 열어 본 캡슐 (flowers.length = 지금 자라는 화분)
  const emptyCount = Math.max(0, 6 - plant.flowers.length - 1);

  if (open !== null) {
    const isCurrent = open >= plant.flowers.length;
    const capsule = records.filter((r) => (r.flowerIndex ?? 0) === open);
    const title = isCurrent ? `지금 자라는 ${stage.label}` : `${FLOWER_EMOJIS[open % FLOWER_EMOJIS.length]} ${plant.flowers[open].name}`;
    return (
      <main className="screen">
        <div className="topline"><span>🌸 기록 캡슐</span><button onClick={() => setOpen(null)}>정원으로</button></div>
        <h1 className="title">{title}</h1>
        <p className="sub">{isCurrent ? "꽃이 피면 이 기록들이 캡슐에 담겨요" : `${plant.flowers[open].bornAt}에 핀 꽃 — 그때의 ${capsule.length}번`}</p>
        <div className="grow stack" style={{ alignContent: "start", marginTop: 12 }}>
          {capsule.length === 0 && <p className="notebox">아직 이 캡슐에 담긴 기록이 없어요.</p>}
          {capsule.slice().reverse().map((r, i) => (
            <div className="memo" key={i}>
              {r.photo ? <img src={r.photo} alt="놀이 순간" /> : <div className="noshot">{GAME_META[r.game].emoji}</div>}
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.55 }}>
                <b>{recordDate(r)}</b> · {GAME_META[r.game].title} · {r.adults.join("·")}랑
                {r.stamped && <> 🏅</>}
                {r.quote && <div style={{ color: "var(--secondary)", marginTop: 3 }}>“{r.quote}”</div>}
              </div>
            </div>
          ))}
        </div>
        <button className="ghost" onClick={() => setOpen(null)}>정원으로 돌아가기</button>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="topline"><span>🌸 우리 정원</span><button onClick={onBack}>처음으로</button></div>
      <h1 className="title">
        꽃 {plant.flowers.length}송이<br />
        <span style={{ fontSize: 16, color: "var(--secondary)" }}>같이 논 날 {records.length}번 — 꽃을 누르면 그때가 열려요</span>
      </h1>
      <div className="grow stack" style={{ alignContent: "start", marginTop: 8 }}>
        <div className="garden">
          {plant.flowers.map((f, i) => (
            <button className="gcell" key={`${f.name}-${i}`} onClick={() => setOpen(i)}>
              {FLOWER_EMOJIS[i % FLOWER_EMOJIS.length]}
              <em>{f.name}</em>
            </button>
          ))}
          <button className="gcell" onClick={() => setOpen(plant.flowers.length)}>
            {stage.emoji}
            <em>{stage.label} · {Math.min(plant.drops, 10)}/10</em>
          </button>
          {Array.from({ length: emptyCount }, (_, i) => (
            <div className="gcell empty" key={`e${i}`}>＋</div>
          ))}
        </div>
        {records.length === 0 && (
          <p className="notebox">아직 기록이 없어요 — 첫 놀이를 하면 여기 쌓여요.</p>
        )}
      </div>
      <button className="ghost" onClick={onBack}>돌아가기</button>
    </main>
  );
}
