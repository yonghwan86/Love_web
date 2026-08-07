// 우리 정원 — 핀 꽃(기록 캡슐)과 지금 자라는 화분.
import { loadPlant, loadRecords, plantStage } from "../lib/state";

export function Garden({ onBack }: { onBack: () => void }) {
  const plant = loadPlant();
  const records = loadRecords();
  const stage = plantStage(plant.drops);
  const cells = [...plant.flowers];
  const emptyCount = Math.max(0, 6 - cells.length - 1);
  const flowerEmojis = ["🌸", "🌻", "🌷", "🌼", "🌺", "💐"];

  return (
    <main className="screen">
      <div className="topline"><span>🌸 우리 정원</span><button onClick={onBack}>처음으로</button></div>
      <h1 className="title">
        꽃 {plant.flowers.length}송이<br />
        <span style={{ fontSize: 16, color: "var(--secondary)" }}>같이 논 날 {records.length}번</span>
      </h1>
      <div className="grow stack" style={{ alignContent: "start", marginTop: 8 }}>
        <div className="garden">
          {cells.map((f, i) => (
            <div className="gcell" key={`${f.name}-${i}`}>
              {flowerEmojis[i % flowerEmojis.length]}
              <em>{f.name}</em>
            </div>
          ))}
          <div className="gcell">
            {stage.emoji}
            <em>{stage.label} · {Math.min(plant.drops, 10)}/10</em>
          </div>
          {Array.from({ length: emptyCount }, (_, i) => (
            <div className="gcell empty" key={`e${i}`}>＋</div>
          ))}
        </div>
        {records.length > 0 && (
          <div className="stack">
            {records.slice(-5).reverse().map((r, i) => (
              <div className="notebox" key={i}>
                {/* toISOString은 UTC라 한국 시간과 하루 어긋난다 — 표시할 때 로컬로 변환 */}
                <b>{new Date(r.at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</b> · {r.adults.join("·")}랑
                {r.quote && <> — “{r.quote}”</>}
                {r.stamped && <> 🏅</>}
              </div>
            ))}
          </div>
        )}
        {records.length === 0 && (
          <p className="notebox">아직 기록이 없어요 — 첫 놀이를 하면 여기 쌓여요.</p>
        )}
      </div>
      <button className="ghost" onClick={onBack}>돌아가기</button>
    </main>
  );
}
