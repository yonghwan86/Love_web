// 세션·영속 상태. 서버 없음 — 1차 시연은 전부 기기 로컬(localStorage)이다.
// 아이 실명·성별은 어디에도 저장하지 않는다 (제품 불변 원칙).

export type Adult = "엄마" | "아빠" | "할머니" | "할아버지";
export type GameId = "mugunghwa" | "bodytalk" | "wordchain" | "hospital" | "police";
export type GameKind = "몸놀이" | "말놀이" | "되어 보는 놀이";

export const GAME_META: Record<GameId, { emoji: string; title: string; kind: GameKind }> = {
  mugunghwa: { emoji: "🌺", title: "무궁화꽃이 피었습니다", kind: "몸놀이" },
  bodytalk: { emoji: "🕺", title: "몸으로 말해요", kind: "몸놀이" },
  wordchain: { emoji: "🔤", title: "끝말잇기", kind: "말놀이" },
  hospital: { emoji: "🩺", title: "병원놀이", kind: "되어 보는 놀이" },
  police: { emoji: "🚓", title: "경찰놀이", kind: "되어 보는 놀이" },
};

export type Flower = { name: string; bornAt: string };
export type PlayRecord = {
  at: string;
  game: GameId;
  adults: Adult[];
  quote: string;
  stamped: boolean;
  photo?: string;
  /** 이 기록이 속한 꽃(기록 캡슐). 세션 시작 시점의 flowers.length — 개화 전 기록은 그 꽃에 담긴다. */
  flowerIndex?: number;
};

type PlantStore = {
  drops: number;
  flowers: Flower[];
  lastWaterDate: string;
  playedGames: GameId[];
};

const PLANT_KEY = "love.plant.v1";
const RECORD_KEY = "love.records.v1";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadPlant(): PlantStore {
  return readJson<PlantStore>(PLANT_KEY, { drops: 0, flowers: [], lastWaterDate: "", playedGames: [] });
}

function savePlant(p: PlantStore) {
  localStorage.setItem(PLANT_KEY, JSON.stringify(p));
}

/** 오늘 물을 줄 수 있는가 — 하루 한 방울 원칙 */
export function canWaterToday(): boolean {
  return loadPlant().lastWaterDate !== todayStr();
}

export function isNewGame(game: GameId): boolean {
  return !loadPlant().playedGames.includes(game);
}

/** 물 주기. 반환: 이번에 받은 방울 수와 누적 방울. 하루 1회는 호출측이 canWaterToday로 지킨다. */
export function water(game: GameId): { gained: number; drops: number } {
  const p = loadPlant();
  const gained = p.playedGames.includes(game) ? 1 : 2;
  p.drops += gained;
  p.lastWaterDate = todayStr();
  if (!p.playedGames.includes(game)) p.playedGames.push(game);
  savePlant(p);
  return { gained, drops: p.drops };
}

/** 개화: 방울 10개를 꽃 하나로 바꾼다. 아이가 지은 이름 그대로 저장(맞춤법 교정 금지). */
export function bloom(name: string): Flower {
  const p = loadPlant();
  const flower: Flower = { name, bornAt: todayStr() };
  p.flowers.push(flower);
  p.drops = Math.max(0, p.drops - 10);
  savePlant(p);
  return flower;
}

export type PlantStage = { emoji: string; label: string };
export function plantStage(drops: number): PlantStage {
  if (drops >= 8) return { emoji: "🌿", label: "봉오리" };
  if (drops >= 5) return { emoji: "🪴", label: "줄기와 잎" };
  if (drops >= 2) return { emoji: "🌱", label: "새싹" };
  return { emoji: "🌰", label: "씨앗" };
}

export function loadRecords(): PlayRecord[] {
  return readJson<PlayRecord[]>(RECORD_KEY, []);
}

export function saveRecord(r: PlayRecord) {
  const all = loadRecords();
  all.push(r);
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(all));
  } catch {
    // 사진이 커서 용량 초과면 사진만 빼고 저장한다 — 기록 자체를 잃지 않는 것이 우선.
    all[all.length - 1] = { ...r, photo: undefined };
    localStorage.setItem(RECORD_KEY, JSON.stringify(all));
  }
}
