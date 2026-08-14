// 말로 넣기 버튼 — 부모가 타이핑 대신 말하게 한다 (음성 우선 규약).
// STT가 없거나(iOS 구버전) 실패하면 옆의 타이핑 폴백이 받는다. 이 버튼은 절대 흐름을 막지 않는다.
import { useEffect, useRef, useState } from "react";
import { listenOnce, sttAvailable } from "../lib/stt";

type Props = {
  label: string;
  /** 주 행동이면 big, 보조면 ghost */
  big?: boolean;
  onText: (text: string) => void;
};

export function VoiceButton({ label, big, onText }: Props) {
  const [state, setState] = useState<"idle" | "listening" | "missed">("idle");
  const missTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (missTimer.current !== null) window.clearTimeout(missTimer.current);
    };
  }, []);

  if (!sttAvailable()) return null;

  async function tap() {
    if (state === "listening") return;
    if (missTimer.current !== null) window.clearTimeout(missTimer.current);
    setState("listening");
    const heard = await listenOnce();
    if (heard) {
      setState("idle");
      onText(heard);
    } else {
      setState("missed");
      missTimer.current = window.setTimeout(() => setState("idle"), 1800);
    }
  }

  return (
    <button className={big ? "big" : "ghost"} onClick={tap} disabled={state === "listening"}>
      {state === "listening" ? "👂 듣고 있어요…" : state === "missed" ? "🙉 잘 못 들었어요 — 한 번 더?" : label}
    </button>
  );
}
