import { BALANCE, BRANCH_TINT, type SwordTierVisual } from "@/lib/balance";
import type { World } from "./types";

const TWO_PI = Math.PI * 2;

/** Convertit un hex #RRGGBB en rgba(..., a) — pour les gradients de trempage. */
function hexAlpha(hex: string, a: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return `rgba(255,255,255,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function renderWorld(ctx: CanvasRenderingContext2D, world: World) {
  const { w, h } = world.viewport;

  // 1. Fond — différencié selon le mode (idle vs instance).
  const isInstance = world.ctx.mode === "instance";
  // Charbon chaud (médiéval) au lieu du charbon froid (tech).
  const bgColor = isInstance ? "#1f1310" : "#1a1410";
  const a = BALANCE.juice.clearAlpha;
  if (a >= 1) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = isInstance
      ? `rgba(31, 19, 16, ${a})`
      : `rgba(26, 20, 16, ${a})`;
    ctx.fillRect(0, 0, w, h);
  }

  // 1b. Décor d'ambiance pour l'instance (vignette + filaments rougeâtres).
  if (isInstance) {
    ctx.save();
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, "rgba(60, 20, 14, 0)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  ctx.save();

  // 2. Screen shake.
  if (world.shakeEnabled && world.screenShake > 0) {
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

  // 2b. Ground fires (patches au sol).
  for (const g of world.groundFires) {
    const t = g.ageMs / g.lifeMs;
    const baseAlpha = 0.5 * (1 - t * 0.4);
    // Anneau extérieur orange.
    ctx.globalAlpha = baseAlpha * 0.4;
    ctx.fillStyle = "#ff5a3d";
    ctx.beginPath();
    ctx.arc(g.pos.x, g.pos.y, g.radius, 0, TWO_PI);
    ctx.fill();
    // Cœur plus chaud.
    ctx.globalAlpha = baseAlpha;
    ctx.fillStyle = "#ffd24d";
    ctx.beginPath();
    ctx.arc(g.pos.x, g.pos.y, g.radius * 0.55, 0, TWO_PI);
    ctx.fill();
    // Particules occasionnelles montantes.
    if (Math.random() < 0.4) {
      const ra = Math.random() * TWO_PI;
      const rd = Math.random() * g.radius;
      world.particles.push({
        pos: { x: g.pos.x + Math.cos(ra) * rd, y: g.pos.y + Math.sin(ra) * rd },
        vel: { x: (Math.random() - 0.5) * 30, y: -60 - Math.random() * 60 },
        lifeMs: 350,
        ageMs: 0,
        color: Math.random() < 0.5 ? "#ffd24d" : "#ff8a3d",
      });
    }
  }
  ctx.globalAlpha = 1;

  // 3. Shockwaves (ondes au sol).
  for (const sw of world.shockwaves) {
    const k = sw.ageMs / sw.lifeMs;
    const r = 30 + k * 200;
    ctx.globalAlpha = (1 - k) * 0.6;
    ctx.strokeStyle = "#e8c878";
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
    ctx.strokeStyle = dense ? "rgba(216, 212, 192, 0.65)" : "rgba(216, 212, 192, 0.4)";
    if (dense) {
      ctx.shadowColor = "#d8d4c0";
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
      ctx.fillStyle = "#f0e2c0";
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
    const trailColor = eff.visual.trailColor ?? "#d8d4c0";
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

  // 7.5 Trempage : halo (T50+) — bloom large pulsant autour du joueur.
  //                 glow (T10+) — petite aura serrée autour du joueur/arme.
  // Une branche à T50+ déclenche les DEUX (halo + glow). Stack par branche éligible.
  const trempage = world.equippedTrempage;
  const tints = BRANCH_TINT[world.equipped] as Record<string, string> | undefined;
  if (tints) {
    const pulse = 0.5 + 0.5 * Math.sin(world.nowMs / 420);
    // Halos d'abord (couche la plus large, dessous).
    for (const branch of Object.keys(trempage)) {
      const lvl = trempage[branch];
      if (lvl < 50) continue;
      const tint = tints[branch];
      if (!tint) continue;
      const r = 90 + 18 * pulse;
      const grad = ctx.createRadialGradient(px, py, BALANCE.player.radius, px, py, r);
      grad.addColorStop(0, hexAlpha(tint, 0.13));
      grad.addColorStop(0.55, hexAlpha(tint, 0.07));
      grad.addColorStop(1, hexAlpha(tint, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, TWO_PI);
      ctx.fill();
    }
    // Glows ensuite (couche plus serrée, au-dessus).
    for (const branch of Object.keys(trempage)) {
      const lvl = trempage[branch];
      if (lvl < 10) continue;
      const tint = tints[branch];
      if (!tint) continue;
      const r = 40;
      const grad = ctx.createRadialGradient(px, py, BALANCE.player.radius * 0.4, px, py, r);
      grad.addColorStop(0, hexAlpha(tint, 0.22));
      grad.addColorStop(1, hexAlpha(tint, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, TWO_PI);
      ctx.fill();
    }
  }

  // 8. Perso. Ivoire chaud (médiéval) au lieu de blanc pur (tech).
  ctx.fillStyle = "#f0e2c0";
  ctx.beginPath();
  ctx.arc(px, py, BALANCE.player.radius, 0, TWO_PI);
  ctx.fill();
  // Liseré bronze pour donner du poids au perso.
  ctx.strokeStyle = "rgba(184, 146, 74, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

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

  // 10. Mobs (avec halo si en feu, halo doré si golem majeur).
  for (const mob of world.mobs) {
    const k = mob.hp / Math.max(1, mob.maxHp);
    const burning = world.nowMs < mob.burnUntilMs && mob.burnDps > 0;
    if (mob.isMajor) {
      // Halo doré autour des golems majeurs.
      ctx.save();
      ctx.shadowColor = "#ffe18a";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "rgba(255,225,138,0.18)";
      ctx.beginPath();
      ctx.arc(mob.pos.x, mob.pos.y, mob.radius + 6, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }
    if (burning) {
      // Halo orange autour du mob en feu.
      ctx.save();
      ctx.shadowColor = "#ff8a3d";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "rgba(255,138,61,0.35)";
      ctx.beginPath();
      ctx.arc(mob.pos.x, mob.pos.y, mob.radius + 4, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
      // Petite flamme aléatoire au-dessus.
      if (Math.random() < 0.5) {
        world.particles.push({
          pos: { x: mob.pos.x + (Math.random() - 0.5) * mob.radius, y: mob.pos.y - mob.radius },
          vel: { x: (Math.random() - 0.5) * 30, y: -90 - Math.random() * 50 },
          lifeMs: 250,
          ageMs: 0,
          color: Math.random() < 0.5 ? "#ffd24d" : "#ff8a3d",
        });
      }
    }
    if (mob.isGolem) {
      // Golem : couleur ardoise + texture pierre simplifiée.
      ctx.fillStyle = mob.isMajor ? `hsl(35 28% ${30 + k * 15}%)` : `hsl(220 8% ${28 + k * 18}%)`;
    } else {
      ctx.fillStyle = `hsl(0 75% ${40 + k * 20}%)`;
    }
    ctx.beginPath();
    ctx.arc(mob.pos.x, mob.pos.y, mob.radius, 0, TWO_PI);
    ctx.fill();
    if (mob.maxHp > 1) {
      const bw = mob.radius * 2;
      const bh = mob.isMajor ? 5 : 3;
      const bx = mob.pos.x - bw / 2;
      const by = mob.pos.y - mob.radius - 8;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = mob.isMajor ? "#e8c878" : "#a83020";
      ctx.fillRect(bx, by, bw * k, bh);
    }
  }

  // 10 ter. Projectiles de feu (baguette).
  for (const p of world.fireProjectiles) {
    if (p.isMeteor && p.meteorElevation > 0) {
      // Ombre au sol qui rétrécit selon l'altitude (target = pos courante).
      const shadowR = 18 + (p.meteorElevation / 480) * 30;
      ctx.globalAlpha = 0.35 * (1 - p.meteorElevation / 480);
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, shadowR, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Météore lui-même : disque flamboyant à altitude visuelle (offset Y négatif).
      const visY = p.pos.y - p.meteorElevation;
      ctx.save();
      ctx.shadowColor = "#ff5a3d";
      ctx.shadowBlur = 28;
      ctx.fillStyle = "#ff8a3d";
      ctx.beginPath();
      ctx.arc(p.pos.x, visY, 20, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = "#ffd24d";
      ctx.beginPath();
      ctx.arc(p.pos.x, visY, 10, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
      // Trail vertical de braises.
      if (Math.random() < 0.7) {
        world.particles.push({
          pos: { x: p.pos.x + (Math.random() - 0.5) * 14, y: visY + 12 },
          vel: { x: (Math.random() - 0.5) * 40, y: 40 + Math.random() * 60 },
          lifeMs: 300,
          ageMs: 0,
          color: Math.random() < 0.5 ? "#ffd24d" : "#ff8a3d",
        });
      }
    } else {
      // Projectile normal : boule de feu + trail.
      ctx.save();
      ctx.shadowColor = "#ff8a3d";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#ff8a3d";
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 7, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = "#ffe18a";
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 3.5, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
      // Étincelle traînante.
      if (Math.random() < 0.6) {
        world.particles.push({
          pos: { x: p.pos.x, y: p.pos.y },
          vel: { x: -p.vel.x * 0.1 + (Math.random() - 0.5) * 40, y: -p.vel.y * 0.1 + (Math.random() - 0.5) * 40 },
          lifeMs: 220,
          ageMs: 0,
          color: Math.random() < 0.5 ? "#ffd24d" : "#ff5a3d",
        });
      }
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

  // 12 bis. Submersion : overlay stun (gris) + halo immunité (or).
  const subState = world.submersion;
  const isStun = subState.stunUntilMs > world.nowMs;
  const isImmunity = !isStun && subState.immunityUntilMs > world.nowMs;
  if (isStun) {
    // Overlay gris bleuté translucide.
    ctx.fillStyle = "rgba(40, 40, 50, 0.35)";
    ctx.fillRect(0, 0, w, h);
    // Étoiles confuses tournantes au-dessus du joueur.
    const cx = world.player.pos.x;
    const cy = world.player.pos.y - BALANCE.player.radius - 18;
    const t = world.nowMs / 250;
    for (let i = 0; i < 3; i++) {
      const a = t + (i * Math.PI * 2) / 3;
      const sx = cx + Math.cos(a) * 12;
      const sy = cy + Math.sin(a) * 6;
      ctx.fillStyle = "#e8c878";
      ctx.font = "bold 14px ui-monospace, Menlo, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✦", sx, sy);
    }
  } else if (isImmunity) {
    // Halo doré pulsant autour du joueur.
    const px = world.player.pos.x;
    const py = world.player.pos.y;
    const pulse = 0.5 + 0.5 * Math.sin(world.nowMs / 350);
    const r = 38 + 4 * pulse;
    const grad = ctx.createRadialGradient(px, py, BALANCE.player.radius * 0.6, px, py, r);
    grad.addColorStop(0, "rgba(232, 200, 120, 0.4)");
    grad.addColorStop(1, "rgba(232, 200, 120, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, TWO_PI);
    ctx.fill();
  }

  // 13. Flash overlay (level up, crit).
  if (world.flashMs > 0) {
    const fa = Math.min(0.4, world.flashMs / 200);
    ctx.fillStyle = `rgba(232, 200, 120, ${fa})`;
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
    ? lerpColor("#d8d4c0", "#c8401a", tint)
    : "#d8d4c0";
  const outerColor = isGolden
    ? "#ffd76b"
    : isFire
    ? "#ff8a3d"
    : tint > 0
    ? lerpColor("#b8b4a0", "#a83020", tint)
    : "#b8b4a0";

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
