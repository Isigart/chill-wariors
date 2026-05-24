import { BALANCE } from "@/lib/balance";
import type { World } from "./types";

/**
 * Rend le monde sur le contexte 2D.
 * Pipeline :
 *  1. Fond.
 *  2. Translate par offset shake.
 *  3. Trail d'épée (si visual 'trail').
 *  4. Perso, épée (style "fire" si dispo), mobs, particules, popups.
 *  5. Flash global de level up (overlay sur tout).
 *  6. Bandeau de phase de vague (rest/preview).
 */
export function renderWorld(ctx: CanvasRenderingContext2D, world: World) {
  const { w, h } = world.viewport;

  // Fond.
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, w, h);

  ctx.save();

  if (world.screenShake > 0) {
    const sx = (Math.random() * 2 - 1) * world.screenShake;
    const sy = (Math.random() * 2 - 1) * world.screenShake;
    ctx.translate(sx, sy);
  }

  const eff = world.sword.effective;
  const { x: px, y: py } = world.player.pos;
  const tipX = px + Math.cos(world.sword.angle) * eff.length;
  const tipY = py + Math.sin(world.sword.angle) * eff.length;

  // Trail — segments fantomatiques en arrière.
  if (eff.visuals.trail && world.trail.length > 1) {
    ctx.lineCap = "round";
    for (let i = 0; i < world.trail.length; i++) {
      const t = world.trail[i];
      const k = 1 - t.ageMs / 180;
      if (k <= 0) continue;
      ctx.globalAlpha = k * 0.35;
      ctx.strokeStyle = eff.visuals.fire ? "#ff8a3d" : "#7fd0ff";
      ctx.lineWidth = eff.width * (0.5 + k * 0.5);
      ctx.beginPath();
      ctx.moveTo(t.pivot.x, t.pivot.y);
      ctx.lineTo(t.tip.x, t.tip.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Perso.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, BALANCE.player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Épée principale.
  if (eff.visuals.fire) {
    // Halo orange.
    ctx.save();
    ctx.shadowColor = "#ff7a1a";
    ctx.shadowBlur = 14;
    ctx.lineCap = "round";
    ctx.lineWidth = eff.width;
    ctx.strokeStyle = "#ff8a3d";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.restore();
    // Lame intérieure jaune.
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
  ctx.fillStyle = eff.visuals.fire ? "#fff1cc" : "#fff8c4";
  ctx.beginPath();
  ctx.arc(tipX, tipY, eff.width * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Petites étincelles à la pointe quand 'fire'.
  if (eff.visuals.fire && Math.random() < 0.5) {
    for (let i = 0; i < 2; i++) {
      world.particles.push({
        pos: { x: tipX, y: tipY },
        vel: {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80 - 40,
        },
        lifeMs: 200,
        ageMs: 0,
        color: i === 0 ? "#ffd24d" : "#ff8a3d",
      });
    }
  }

  // Mobs (couleur légèrement plus rouge si à faible HP).
  for (const mob of world.mobs) {
    const k = mob.hp / mob.maxHp;
    const hue = 0; // rouge
    ctx.fillStyle = `hsl(${hue} 75% ${40 + k * 20}%)`;
    ctx.beginPath();
    ctx.arc(mob.pos.x, mob.pos.y, mob.radius, 0, Math.PI * 2);
    ctx.fill();
    // Mini HP bar si maxHp > 1.
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
    ctx.arc(p.pos.x, p.pos.y, 3 * (1 - t * 0.5), 0, Math.PI * 2);
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

  // Flash global (par-dessus le shake).
  if (world.flashMs > 0) {
    const a = (world.flashMs / BALANCE.juice.levelUpFlashMs) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Indicateur de phase de vague.
  if (world.wave.phase === "rest") {
    const t = 1 - world.wave.restMs / BALANCE.wave.restMs;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 14px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`VAGUE ${world.wave.index + 1} DANS ${Math.ceil(world.wave.restMs / 1000)}s`, w / 2, 16);
    // Barre de progression du repos.
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
