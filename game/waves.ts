import { BALANCE, waveSpawnRate } from "@/lib/balance";
import { initWave } from "./world";
import { spawnOneMob } from "./spawn";
import type { World, TickHooks } from "./types";

/**
 * Avance le cycle de la vague courante :
 *  - 'spawning' : on dépense le budget de spawn, jusqu'à épuisement.
 *  - 'cleaning' : on attend que tous les mobs soient morts.
 *  - 'rest'     : pause entre vagues, puis on passe à la suivante.
 */
export function tickWave(world: World, dtMs: number, hooks: TickHooks) {
  const w = world.wave;

  switch (w.phase) {
    case "spawning": {
      const rate = waveSpawnRate(w.index);
      w.spawnAccum += (dtMs / 1000) * rate;
      while (w.spawnAccum >= 1 && w.remainingToSpawn > 0) {
        w.spawnAccum -= 1;
        w.remainingToSpawn -= 1;
        spawnOneMob(world);
      }
      if (w.remainingToSpawn <= 0) {
        w.phase = "cleaning";
      }
      break;
    }
    case "cleaning": {
      if (world.mobs.length === 0) {
        hooks.onWaveCleared(w.index);
        w.phase = "rest";
        w.restMs = BALANCE.wave.restMs;
      }
      break;
    }
    case "rest": {
      w.restMs -= dtMs;
      if (w.restMs <= 0) {
        const next = initWave(w.index + 1);
        world.wave = next;
      }
      break;
    }
  }
}
