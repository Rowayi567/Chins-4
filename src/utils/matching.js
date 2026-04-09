export function matchScore(userA, userB) {
  if(!userA || !userB) return 0;
  let score = 0;
  const reasons = [];

  // Energy compatibility (25 points)
  const energyMap = { calm:0, balanced:1, high:2 };
  const eA = energyMap[userA.energy] ?? 1;
  const eB = energyMap[userB.energy] ?? 1;
  const energyDiff = Math.abs(eA - eB);
  if(energyDiff === 0) { score += 25; reasons.push("same energy"); }
  else if(energyDiff === 1) { score += 15; }
  else { score += 5; }

  // Depth compatibility (20 points)
  const depthMap = { surface:0, medium:1, deep:2 };
  const dA = depthMap[userA.depth] ?? 1;
  const dB = depthMap[userB.depth] ?? 1;
  const depthDiff = Math.abs(dA - dB);
  if(depthDiff === 0) { score += 20; reasons.push("connect on the same level"); }
  else if(depthDiff === 1) { score += 10; }
  else { score += 0; }

  // Social goal alignment (20 points)
  const goalCompat = {
    "activity-partner": ["activity-partner", "social-circle", "open"],
    "confidant": ["confidant", "ride-or-die", "open"],
    "social-circle": ["social-circle", "activity-partner", "open"],
    "ride-or-die": ["ride-or-die", "confidant", "open"],
    "open": ["activity-partner","confidant","social-circle","ride-or-die","open"],
  };
  const gA = userA.socialGoal || "open";
  const gB = userB.socialGoal || "open";
  if(gA === gB) { score += 20; reasons.push("looking for the same thing"); }
  else if(goalCompat[gA]?.includes(gB)) { score += 12; }
  else { score += 3; }

  // Life stage (15 points)
  if(userA.lifeStage && userB.lifeStage && userA.lifeStage === userB.lifeStage) {
    score += 15;
    reasons.push("at a similar point in life");
  } else { score += 5; }

  // Communication style (10 points)
  const commCompat = {
    "constant-texter": ["constant-texter", "banter", "mixed"],
    "slow-burner": ["slow-burner", "real-talk", "mixed"],
    "banter": ["banter", "constant-texter", "playful", "mixed"],
    "real-talk": ["real-talk", "slow-burner", "mixed"],
    "mixed": ["constant-texter","slow-burner","banter","real-talk","mixed"],
  };
  const cA = userA.commStyle || "mixed";
  const cB = userB.commStyle || "mixed";
  if(cA === cB) { score += 10; }
  else if(commCompat[cA]?.includes(cB)) { score += 6; }

  // Humour compatibility (10 points)
  const humourCompat = {
    "dry": ["dry", "dark", "mixed"],
    "warm": ["warm", "playful", "earnest", "mixed"],
    "playful": ["playful", "warm", "mixed"],
    "dark": ["dark", "dry", "mixed"],
    "earnest": ["earnest", "warm", "mixed"],
    "mixed": ["dry","warm","playful","dark","earnest","mixed"],
  };
  const hA = userA.humour || "mixed";
  const hB = userB.humour || "mixed";
  if(hA === hB) { score += 10; reasons.push("same sense of humour"); }
  else if(humourCompat[hA]?.includes(hB)) { score += 6; }

  return { score, reasons };
}

export function matchReason(userA, userB) {
  const { score, reasons } = matchScore(userA, userB);
  if(score >= 70) return `Reed thinks you'd just click — ${reasons.slice(0,2).join(" and ")}.`;
  if(score >= 50) return `Something about ${userB.display_name||"this person"} feels right for you — ${reasons[0] || "Reed has a feeling about this one"}.`;
  return `Outside your usual — Reed thinks you'd surprise each other.`;
}
