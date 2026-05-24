import { BALANCE } from "@/lib/balance";
import type { World } from "./types";

const TWO_PI = Math.PI * 2;

/**
 * Rend le monde sur le contexte 2D.
 * Pipeline :
 *  1. Fond (clear net ou trail léger selon balance.juice.clearAlpha).
 *  2. Shake (translate global).
 *  3. Ondes "windWaves" (portée T8) — derrière le perso.
 *  4. Trail d'épée (vitesse T2).
 *  5. Echoes phantomBlade / tripleEcho.
 *  6. Perso, épée principale, mobs.
 *  7. Particules, popups.
 *  8. Flash level up + indicateur de phase de vague.
 */
export function renderWorld(ctx: CanvasRenderingContext2D, world: World) {
  const { w, h } = world.viewport;

  // 1. Fond.
  const alpha = BALANCE.juice.clearAlpha;
  if (alpha >= 1) {
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = `rgba(10, 10, 15, ${alpha})`;
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

  // 3. windWaves : ondes concentriques pulsantes autour du perso.
  if (eff.visuals.windWaves) {
    const t = (world.nowMs / 1000) % 1.5;
    for (let i = 0; i < 3; i++) {
      const phase = (t + i * 0.5) % 1.5;
      const ringR = eff.length * (0.4 + phase * 0.7);
      ctx.globalAlpha = (1 - phase / 1.5) * 0.18;
      ctx.strokeStyle = "#b0e0a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, ringR, 0, TWO_PI);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 4. Trail (échantillons stockés dans world.trail).
  if (eff.visuals.trail && world.trail.length > 1) {
    ctx.lineCap = "round";
    for (const t of world.trail) {
      const k = 1 - t.ageMs / 180;
      if (k <= 0) continue;
      ctx.globalAlpha = k * 0.35;
      ctx.strokeStyle = eff.visuals.plasma
        ? "#6cc6ff"
        : eff.visuals.fire || eff.visuals.biggerFire
        ? "#ff8a3d"
        : "#7fd0ff";
      ctx.lineWidth = eff.width * (0.5 + k * 0.5);
      ctx.beginPath();
      ctx.moveTo(t.pivot.x, t.pivot.y);
      ctx.lineTo(t.tip.x, t.tip.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 5. Echoes : phantomBlade (180° derrière) et tripleEcho (3 lames 120°).
  const echoAngles: number[] = [];
  if (eff.visuals.tripleEcho) {
    echoAngles.push(a1 + (TWO_PI / 3), a1 + (2 * TWO_PI / 3));
  } else if (eff.visuals.phantomBlade) {
    echoAngles.push(a1 + Math.PI);
  }
  for (const a of echoAngles) {
    const ex = px + Math.cos(a) * eff.length;
    const ey = py + Math.sin(a) * eff.length;
    ctx.globalAlpha = 0.35;
    ctx.lineCap = "round";
    ctx.lineWidth = eff.width;
    ctx.strokeStyle = "#cfd9ff";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // Petite tête.
    ctx.fillStyle = "#e8ecff";
    ctx.beginPath();
    ctx.arc(ex, ey, eff.width * 0.5, 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 6. Perso.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, BALANCE.player.radius, 0, TWO_PI);
  ctx.fill();

  // 6 bis. titanBlade : aura large derrière la lame.
  if (eff.visuals.titanBlade) {
    ctx.save();
    ctx.shadowColor = "#9be4a3";
    ctx.shadowBlur = 18;
    ctx.lineCap = "round";
    ctx.lineWidth = eff.width * 2.2;
    ctx.strokeStyle = "rgba(155, 228, 163, 0.25)";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.restore();
  }

  // 6 ter. Lame principale.
  const isFire = eff.visuals.fire || eff.visuals.biggerFire;
  const isPlasma = eff.visuals.plasma;
  if (isPlasma) {
    ctx.save();
    ctx.shadowColor = "#6cc6ff";
    ctx.shadowBlur = eff.visuals.biggerFire ? 22 : 18;
    ctx.lineCap = "round";
    ctx.lineWidth = eff.width;
    ctx.strokeStyle = "#6cc6ff";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.restore();
    // Cœur.
    ctx.lineWidth = eff.width * 0.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#cef0ff";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  } else if (isFire) {
    ctx.save();
    ctx.shadowColor = "#ff7a1a";
    ctx.shadowBlur = eff.visuals.biggerFire ? 22 : 14;
    ctx.lineCap = "round";
    ctx.lineWidth = eff.width;
    ctx.strokeStyle = "#ff8a3d";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.restore();
    ctx.lineWidth = eff.width * 0.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffe6a8";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  } else {
    ctx.lineWidth = eff.width;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#e0e6ff";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  }

  // Pointe lumineuse.
  ctx.fillStyle = isPlasma ? "#dff2ff" : isFire ? "#fff1cc" : "#fff8c4";
  ctx.beginPath();
  ctx.arc(tipX, tipY, eff.width * 0.7, 0, TWO_PI);
  ctx.fill();

  // Étincelles à la pointe (fire/biggerFire/plasma).
  if (isFire || isPlasma) {
    const rate = eff.visuals.biggerFire ? 0.8 : 0.5;
    if (Math.random() < rate) {
      for (let i = 0; i < 2; i++) {
        world.particles.push({
          pos: { x: tipX, y: tipY },
          vel: { x: (Math.random() - 0.5) * 90, y: (Math.random() - 0.5) * 90 - 40 },
          lifeMs: 200,
          ageMs: 0,
          color: isPlasma
            ? (i === 0 ? "#6cc6ff" : "#cef0ff")
            : (i === 0 ? "#ffd24d" : "#ff8a3d"),
        });
      }
    }
  }

  // 7. Mobs.
  for (const mob of world.mobs) {
    const k = mob.hp / mob.maxHp;
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

  // Particules.
  for (const p of world.particles) {
    const t = p.ageMs / p.lifeMs;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, 3 * (1 - t * 0.5), 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Popups.
  ctx.font = "bold 20px ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const pop of world.popups) {
    const t = pop.ageMs / pop.lifeMs;
    const yOffset = -BALANCE.juice.popupRise * t;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.pos.x, pop.pos.y + yOffset);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // 8. Flash level up.
  if (world.flashMs > 0) {
    const a = (world.flashMs / BALANCE.juice.levelUpFlashMs) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(0, 0, w, h);
  }

  // 9. Indicateur de phase de vague.
  if (world.wave.phase === "rest") {
    const t = 1 - world.wave.restMs / BALANCE.wave.restMs;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 14px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      `VAGUE ${world.wave.index + 1} DANS ${Math.ceil(world.wave.restMs / 1000)}s`,
      w / 2,
      16,
    );
    const bw = 200;
    const bh = 4;
    const bx = (w - bw) / 2;
    const by = 40;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#9ce5ff";
    ctx.fillRect(bx, by, bw * t, bh);
  }
}
