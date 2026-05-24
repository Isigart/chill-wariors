import { BALANCE } from "@/lib/balance";
import type { World } from "./types";

/**
 * Rend le monde sur le contexte 2D.
 * - Le clear est franc (pas de motion trail pour v0.1).
 * - Le screen shake est appliqué via un translate global aléatoire.
 */
export function renderWorld(ctx: CanvasRenderingContext2D, world: World) {
  const { w, h } = world.viewport;

  // Fond sombre uniforme.
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, w, h);

  ctx.save();

  // Screen shake.
  if (world.screenShake > 0) {
    const sx = (Math.random() * 2 - 1) * world.screenShake;
    const sy = (Math.random() * 2 - 1) * world.screenShake;
    ctx.translate(sx, sy);
  }

  // Perso.
  const { x: px, y: py } = world.player.pos;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, BALANCE.player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Épée : segment épais avec une tête.
  const tipX = px + Math.cos(world.sword.angle) * BALANCE.sword.length;
  const tipY = py + Math.sin(world.sword.angle) * BALANCE.sword.length;
  ctx.lineWidth = BALANCE.sword.width;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#e0e6ff";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  // Petite tête lumineuse au bout pour souligner la pointe.
  ctx.fillStyle = "#fff8c4";
  ctx.beginPath();
  ctx.arc(tipX, tipY, BALANCE.sword.width * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Mobs.
  ctx.fillStyle = "#ff5a5a";
  for (const mob of world.mobs) {
    ctx.beginPath();
    ctx.arc(mob.pos.x, mob.pos.y, mob.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particules.
  for (const p of world.particles) {
    const t = p.ageMs / p.lifeMs;
    const alpha = 1 - t;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, 3 * (1 - t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Popups : texte qui monte et fade.
  ctx.font = "bold 20px ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const pop of world.popups) {
    const t = pop.ageMs / pop.lifeMs;
    const yOffset = -BALANCE.juice.popupRise * t;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = "#ffe18a";
    ctx.fillText(pop.text, pop.pos.x, pop.pos.y + yOffset);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}
