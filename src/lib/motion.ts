// 무궁화꽃 움직임 판정 — 전부 기기 안에서 끝난다.
// 영상은 서버로 보내지 않고, 저장하지 않는다 (제품 불변 원칙).
// 판정 원리: 구호가 끝난 순간의 프레임을 기준으로, 감시 창 동안 달라진 픽셀 비율을 잰다.

const W = 96;
const H = 72;
const NOISE_FLOOR = 16; // 픽셀 밝기 차이가 이보다 작으면 카메라 노이즈로 본다

// 도전자가 어른이면 엄격, 아이면 관대 — 의도된 편애 (스펙 9절)
export const ADULT_THRESHOLD = 0.035;
export const CHILD_THRESHOLD = 0.12;

export class MotionJudge {
  private video = document.createElement("video");
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;
  private stream: MediaStream | null = null;
  private baseline: Float32Array | null = null;

  constructor() {
    this.canvas.width = W;
    this.canvas.height = H;
    const c = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!c) throw new Error("canvas 2d 미지원");
    this.ctx = c;
  }

  /** 카메라 시작. preview를 주면 같은 스트림을 화면에도 비춘다. 실패 시 throw — 호출측이 수동 모드로 전환. */
  async start(preview?: HTMLVideoElement): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    this.video.srcObject = this.stream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();
    if (preview) {
      preview.srcObject = this.stream;
      preview.muted = true;
      preview.playsInline = true;
      void preview.play();
    }
  }

  get active(): boolean {
    return this.stream !== null;
  }

  private frame(): Float32Array {
    this.ctx.drawImage(this.video, 0, 0, W, H);
    const d = this.ctx.getImageData(0, 0, W, H).data;
    const g = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const j = i * 4;
      g[i] = (d[j] + d[j + 1] + d[j + 2]) / 3;
    }
    return g;
  }

  /** 구호 종료 시점에 호출 — 이 순간이 "멈춰야 하는 순간"의 기준이 된다. */
  setBaseline() {
    this.baseline = this.frame();
  }

  /** 기준 대비 달라진 픽셀 비율(0..1). */
  movementRatio(): number {
    if (!this.baseline) return 0;
    const cur = this.frame();
    let moved = 0;
    for (let i = 0; i < W * H; i++) {
      if (Math.abs(cur[i] - this.baseline[i]) >= NOISE_FLOOR) moved++;
    }
    return moved / (W * H);
  }

  /** 기록용 스냅샷 1장 (다운스케일 JPEG). 실패하면 null. */
  snapshot(width = 320): string | null {
    if (!this.stream || this.video.videoWidth === 0) return null;
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    const c = document.createElement("canvas");
    c.width = width;
    c.height = Math.round((vh / vw) * width);
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(this.video, 0, 0, c.width, c.height);
    try {
      return c.toDataURL("image/jpeg", 0.7);
    } catch {
      return null;
    }
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.baseline = null;
  }
}
