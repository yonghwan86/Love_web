// 첫 화면의 가족사진 — 카카오톡 프로필처럼 우리 가족이 직접 고른다.
// 사진은 이 폰(localStorage)에만 저장한다. 서버로 보내지 않는다 (제품 불변 원칙).

const KEY = "love.familyphoto.v1";

export function loadFamilyPhoto(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** 고른 사진을 줄여 저장하고 데이터 URL을 돌려준다. 실패(디코드 불가·용량 초과)하면 null. */
export async function saveFamilyPhoto(file: File): Promise<string | null> {
  // 원본(수 MB)을 그대로 넣으면 놀이 기록이 쓸 localStorage 자리를 잡아먹는다 — 줄여서 저장.
  // 용량 초과면 한 단계 더 줄여 재시도한다.
  for (const [maxSide, quality] of [
    [1000, 0.82],
    [640, 0.7],
  ] as const) {
    const url = await shrink(file, maxSide, quality);
    if (!url) return null;
    try {
      localStorage.setItem(KEY, url);
      return url;
    } catch {
      // quota 초과 — 다음 단계로
    }
  }
  return null;
}

function shrink(file: File, maxSide: number, quality: number): Promise<string | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.fillStyle = "#fff"; // 투명 PNG가 와도 JPEG에서 검게 되지 않게
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      try {
        resolve(c.toDataURL("image/jpeg", quality));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}
