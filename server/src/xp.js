// XP/레벨 공식은 CLAUDE.md "결정된 사항" 섹션 참고
const DAILY_QUEST_BONUS_XP = 50;

function xpForRun({ distanceMeters, durationSec }) {
  const distanceKm = distanceMeters / 1000;
  const durationMin = durationSec / 60;
  return Math.round(distanceKm * 10 + durationMin * 1);
}

// 레벨 n에 도달하기 위해 필요한 누적 XP
function cumulativeXpForLevel(level) {
  return 100 * level * level;
}

// 누적 XP로부터 현재 레벨과 다음 레벨까지 진행률 계산
function levelFromTotalXp(totalXp) {
  let level = 0;
  while (totalXp >= cumulativeXpForLevel(level + 1)) {
    level++;
  }
  const currentLevelFloor = cumulativeXpForLevel(level);
  const nextLevelCeil = cumulativeXpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentLevelFloor;
  const xpNeededForLevel = nextLevelCeil - currentLevelFloor;
  return {
    level,
    xpIntoLevel,
    xpNeededForLevel,
    nextLevelXp: nextLevelCeil,
  };
}

module.exports = { DAILY_QUEST_BONUS_XP, xpForRun, cumulativeXpForLevel, levelFromTotalXp };
