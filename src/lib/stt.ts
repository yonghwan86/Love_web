// 음성으로 단어 받기 — 끝말잇기 보조 입력.
// Web Speech 인식은 iOS Safari에 없으므로 항상 타이핑 폴백과 함께 쓴다.

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function ctor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function sttAvailable(): boolean {
  return ctor() !== null;
}

/** 한 번 듣고 첫 인식 결과를 돌려준다. 실패·침묵이면 null. */
export function listenOnce(timeoutMs = 6000): Promise<string | null> {
  return new Promise((resolve) => {
    const C = ctor();
    if (!C) {
      resolve(null);
      return;
    }
    const r = new C();
    r.lang = "ko-KR";
    r.interimResults = false;
    r.maxAlternatives = 1;
    let done = false;
    const finish = (v: string | null) => {
      if (done) return;
      done = true;
      try {
        r.stop();
      } catch {
        /* 이미 종료됨 */
      }
      resolve(v);
    };
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim() ?? "";
      finish(text || null);
    };
    r.onerror = () => finish(null);
    r.onend = () => finish(null);
    setTimeout(() => finish(null), timeoutMs);
    r.start();
  });
}
