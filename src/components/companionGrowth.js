export function companionGrowth(user, levels = []) {
  levels = levels.map((level, index) => ({
    ...level,
    number: level.number ?? index + 1,
  }));
  const parsed = Number(String(user.level).match(/^Level (\d+)$/)?.[1]);
  const earned = [...levels]
    .filter((level) => level.points <= user.points)
    .sort((a, b) => b.points - a.points)[0]?.number;
  const level = Math.max(1, user.levelNumber || parsed || earned || 1);
  const stage = Math.min(3, level);
  return {
    level,
    stage,
    name: ["Puppy", "Adolescent", "Adult"][stage - 1],
    next: levels.find((entry) => entry.number === stage + 1)?.points,
  };
}
