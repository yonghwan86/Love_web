// 가온이 목소리 — Web Speech TTS 래퍼.
// iOS는 첫 사용자 제스처 이후에만 소리가 난다. 모든 발화는 버튼 탭 흐름 뒤에 온다.

let koVoice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  koVoice =
    voices.find((v) => v.lang.startsWith("ko") && /Yuna|유나|Google/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("ko")) ??
    null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice();
  window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 말하고 끝나면 resolve. onend가 안 오는 브라우저 대비 안전 타이머 포함. */
export function speak(text: string, opts?: { rate?: number; pitch?: number }): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsSupported()) {
      setTimeout(resolve, Math.min(3500, 350 + text.length * 90));
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    if (koVoice) u.voice = koVoice;
    u.rate = opts?.rate ?? 1;
    u.pitch = opts?.pitch ?? 1.05;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // rate가 낮을수록 길게 잡는다. onend 미발화 대비 상한.
    const safety = Math.min(12000, (600 + text.length * 130) / u.rate);
    setTimeout(finish, safety);
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeak() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
