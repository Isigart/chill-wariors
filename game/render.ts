import { BALANCE, type SwordTierVisual } from "@/lib/balance";
import type { World } from "./types";

const TWO_PI = Math.PI * 2;

export function renderWorld(ctx: CanvasRenderingContext2D, world: World) {
  const { w, h } = world.viewport;

  // 1. Fond.
  const a = BALANCE.juice.clearAlpha;
  if (a >= 1) {
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = `rgba(10, 10, 15, ${a})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.save();

  // 2. Screen shake.
  if (world.screenShake > 0) {
    const sx = (Math.random() * 2 - 1) * world.screenShake;
    const sy = (Math.random() * 2 - 1) * world.screenShake;
    ctx.translate(sx, sy);
  }

  const eff = world.sword.effective;
  const { x: px, y: py } = world.player.pos;
  const a1 = world.sword.angle;
  const tipX = px + Math.cos(a1) * eff.length;
  const tipY = py + Math.sin(a1) * eff.length;
  const tint = eff.visual.redTint ?? 0;

  // 3. Shockwaves (ondes au sol).
  for (const sw of world.shockwaves) {
    const k = sw.ageMs / sw.lifeMs;
    const r = 30 + k * 200;
    ctx.globalAlpha = (1 - k) * 0.6;
    ctx.strokeStyle = "#9ce5ff";
    ctx.lineWidth = 3 * (1 - k);
    ctx.beginPath();
    ctx.arc(sw.pos.x, sw.pos.y, r, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const swordEquipped = world.equipped === "sword";

  // 4. Anneau (vitesse T3+).
  if (swordEquipped && eff.visual.ring && eff.visual.ring !== "none") {
    const dense = eff.visual.ring === "dense";
    ctx.save();
    ctx.lineWidth = dense ? eff.width * 1.4 : eff.width * 0.8;
    ctx.strokeStyle = dense ? "rgba(127, 208, 255, 0.6)" : "rgba(127, 208, 255, 0.35)";
    if (dense) {
      ctx.shadowColor = "#7fd0ff";
      ctx.shadowBlur = 18;
    }
    ctx.beginPath();
    ctx.arc(px, py, eff.length, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Particules orbitales (vitesse T5).
  if (swordEquipped && eff.visual.orbitalParticles) {
    const orbitR = eff.length;
    const t = world.nowMs / 200;
    for (let i = 0; i < 10; i++) {
      const oa = (i / 10) * TWO_PI + t;
      const ox = px + Math.cos(oa) * orbitR;
      const oy = py + Math.sin(oa) * orbitR;
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#cef2ff";
      ctx.beginPath();
      ctx.arc(ox, oy, 2.5, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // 6. Phantom blade (portée T4+) : rend la pointe ~50ms en arrière.
  if (swordEquipped && eff.visual.phantomDelayMs && world.phantomTrail.length > 0) {
    const targetTs = world.nowMs - eff.visual.phantomDelayMs;
    // Trouve l'échantillon le plus proche.
    let sample = world.phantomTrail[0];
    for (const s of world.phantomTrail) {
      if (s.ts <= targetTs) {
        sample = s;
        break;
      }
    }
    ctx.globalAlpha = 0.45;
    ctx.lineCap = "round";
    ctx.lineWidth = eff.width * 0.9;
    ctx.strokeStyle = eff.visual.goldenBlade ? "#ffd76b" : "#ffb84a";
    ctx.beginPath();
    ctx.moveTo(sample.pivot.x, sample.pivot.y);
    ctx.lineTo(sample.tip.x, sample.tip.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 7. Trail (vitesse T1+).
  const trailIntensity = eff.visual.trail ?? 0;
  if (swordEquipped && trailIntensity > 0 && world.trail.length > 1) {
    ctx.lineCap = "round";
    const trailColor = eff.visual.trailColor ?? "#7fd0ff";
    for (const t of world.trail) {
      const k = 1 - t.ageMs / 180;
      if (k <= 0) continue;
      ctx.globalAlpha = k * trailIntensity * 0.45;
      ctx.strokeStyle = trailColor;
      ctx.lineWidth = eff.width * (0.5 + k * 0.5);
      ctx.beginPath();
      ctx.moveTo(t.pivot.x, t.pivot.y);
      ctx.lineTo(t.tip.x, t.tip.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 8. Perso.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, BALANCE.player.radius, 0, TWO_PI);
  ctx.fill();

  // 9. Lame principale (épée équipée seulement).
  if (swordEquipped) {
    drawBlade(ctx, px, py, tipX, tipY, eff.width, eff.visual, tint);

    // Pointe lumineuse.
    ctx.fillStyle = eff.visual.permanentFire
      ? "#fff1cc"
      : tint > 0
      ? "#ffd6d6"
      : "#fff8c4";
    ctx.beginPath();
    ctx.arc(tipX, tipY, eff.width * 0.7, 0, TWO_PI);
    ctx.fill();
  }

  // Étincelles permanentes pour feu (dégâts T5).
  if (swordEquipped && eff.visual.permanentFire && Math.random() < 0.6) {
    for (let i = 0; i < 2; i++) {
      world.particles.push({
        pos: { x: tipX, y: tipY },
        vel: { x: (Math.random() - 0.5) * 90, y: (Math.random() - 0.5) * 90 - 40 },
        lifeMs: 200,
        ageMs: 0,
        color: i === 0 ? "#ffd24d" : "#ff8a3d",
      });
    }
  }

  // 10. Mobs.
  for (const mob of world.mobs) {
    const k = mob.hp / Math.max(1, mob.maxHp);
    ctx.fillStyle = `hsl(0 75% ${40 + k * 20}%)`;
    ctx.beginPath();
    ctx.arc(mob.pos.x, mob.pos.y, mob.radius, 0, TWO_PI);
    ctx.fill();
    if (mob.maxHp > 1) {
      const bw = mob.radius * 2;
      const bh = 3;
      const bx = mob.pos.x - bw / 2;
      const by = mob.pos.y - mob.radius - 6;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#ff5a5a";
      ctx.fillRect(bx, by, bw * k, bh);
    }
  }

  // 10 bis. Flèches (arc).
  for (const a of world.arrows) {
    if (a.beam) {
      // Beam : ligne épaisse depuis la position de spawn jusqu'à la position courante.
      // Spawn = derrière la flèche, calculé via vel × age.
      const ageSec = (world.nowMs - a.spawnedAt) / 1000;
      const sx = a.pos.x - a.vel.x * ageSec;
      const sy = a.pos.y - a.vel.y * ageSec;
      ctx.save();
      ctx.shadowColor = a.visualTrailColor;
      ctx.shadowBlur = 18;
      ctx.lineCap = "round";
      ctx.lineWidth = 5;
      ctx.strokeStyle = a.visualTrailColor;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(a.pos.x, a.pos.y);
      ctx.stroke();
      ctx.restore();
      // Cœur clair au centre.
      ctx.lineCap = "round";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff7e0";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(a.pos.x, a.pos.y);
      ctx.stroke();
    } else {
      // Flèche normale : trail court (~40px) + tête lumineuse.
      const len = Math.hypot(a.vel.x, a.vel.y) || 1;
      const ux = a.vel.x / len;
      const uy = a.vel.y / len;
      const tailLen = a.homing ? 32 : 22;
      const tx = a.pos.x - ux * tailLen;
      const ty = a.pos.y - uy * tailLen;

      ctx.lineCap = "round";
      ctx.lineWidth = a.homing ? 3 : 2.2;
      ctx.strokeStyle = a.visualTrailColor;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(a.pos.x, a.pos.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Tête lumineuse.
      ctx.fillStyle = a.homing ? "#ffd6d6" : "#fff8c4";
      ctx.beginPath();
      ctx.arc(a.pos.x, a.pos.y, 2.8, 0, TWO_PI);
      ctx.fill();
    }
  }

  // 11. Particules.
  for (const p of world.particles) {
    const t = p.ageMs / p.lifeMs;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, 3 * (1 - t * 0.5), 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 12. Popups.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const pop of world.popups) {
    const t = pop.ageMs / pop.lifeMs;
    const yOffset = -BALANCE.juice.popupRise * t;
    ctx.globalAlpha = 1 - t;
    const size = pop.size ?? 20;
    ctx.font = `bold ${size}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.pos.x, pop.pos.y + yOffset);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // 13. Flash overlay (level up, crit).
  if (world.flashMs > 0) {
    const fa = Math.min(0.4, world.flashMs / 200);
    ctx.fillStyle = `rgba(255,255,255,${fa})`;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Dessine la lame principale, avec ses overrides visuels (rouge / feu / courbée / dorée). */
function drawBlade(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tipX: number,
  tipY: number,
  width: number,
  visual: SwordTierVisual,
  tint: number,
) {
  const isFire = visual.permanentFire ?? false;
  const isGolden = visual.goldenBlade ?? false;
  const isCurved = visual.curved ?? false;

  const fillCore = isGolden
    ? "#fff1c0"
    : isFire
    ? "#ffe6a8"
    : tint > 0
    ? lerpColor("#e0e6ff", "#ff8080", tint)
    : "#e0e6ff";
  const outerColor = isGolden
    ? "#ffd76b"
    : isFire
    ? "#ff8a3d"
    : tint > 0
    ? lerpColor("#cdd2e8", "#c54141", tint)
    : "#cdd2e8";

  if (isFire) {
    ctx.save();
    ctx.shadowColor = "#ff7a1a";
    ctx.shadowBlur = 16;
    ctx.lineCap = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = outerColor;
    pathBlade(ctx, px, py, tipX, tipY, isCurved);
    ctx.stroke();
    ctx.restore();
    // Cœur.
    ctx.lineCap = "round";
    ctx.lineWidth = width * 0.5;
    ctx.strokeStyle = fillCore;
    pathBlade(ctx, px, py, tipX, tipY, isCurved);
    ctx.stroke();
    return;
  }

  if (isGolden) {
    ctx.save();
    ctx.shadowColor = "#ffd76b";
    ctx.shadowBlur = 12;
    ctx.lineCap = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = outerColor;
    pathBlade(ctx, px, py, tipX, tipY, isCurved);
    ctx.stroke();
    ctx.restore();
    ctx.lineCap = "round";
    ctx.lineWidth = width * 0.5;
    ctx.strokeStyle = fillCore;
    pathBlade(ctx, px, py, tipX, tipY, isCurved);
    ctx.stroke();
    return;
  }

  // Lame standard ou teintée rouge.
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = fillCore;
  pathBlade(ctx, px, py, tipX, tipY, isCurved);
  ctx.stroke();
}

/** Trace le path de la lame, droite ou faiblement courbée. */
function pathBlade(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tipX: number,
  tipY: number,
  curved: boolean,
) {
  ctx.beginPath();
  ctx.moveTo(px, py);
  if (curved) {
    // Courbure légère : control point perpendiculaire à la lame.
    const mx = (px + tipX) / 2;
    const my = (py + tipY) / 2;
    const dx = tipX - px;
    const dy = tipY - py;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bow = len * 0.18;
    ctx.quadraticCurveTo(mx + nx * bow, my + ny * bow, tipX, tipY);
  } else {
    ctx.lineTo(tipX, tipY);
  }
}

/** Lerp linéaire entre deux couleurs hex. */
function lerpColor(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function parseHex(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}
