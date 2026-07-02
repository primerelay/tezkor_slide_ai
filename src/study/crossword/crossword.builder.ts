import { CrosswordData, CrosswordClue } from '../../database/entities/crossword-set.entity';
import { CrosswordWord } from './crossword-generator.agent';

type Dir = 'across' | 'down';
interface Placement {
  word: string;
  clue: string;
  row: number;
  col: number;
  dir: Dir;
}

/**
 * Greedy interlocking crossword generator. Places words one by one so each new
 * word crosses an already-placed word at a shared letter, rejecting placements
 * that would make letters run together illegally. Words that can't interlock
 * are dropped. Returns null if fewer than 3 words could be placed.
 */
export function buildCrossword(
  words: CrosswordWord[],
  maxWords: number,
): { data: CrosswordData; placedCount: number; dropped: number } | null {
  const pool = [...words].sort((a, b) => b.word.length - a.word.length).slice(0, maxWords);
  if (pool.length < 3) return null;

  // Sparse grid keyed by "r,c".
  const cells = new Map<string, string>();
  const placements: Placement[] = [];
  const key = (r: number, c: number) => `${r},${c}`;
  const at = (r: number, c: number) => cells.get(key(r, c));

  // Place the first (longest) word horizontally at the origin.
  const first = pool[0];
  for (let i = 0; i < first.word.length; i++) cells.set(key(0, i), first.word[i]);
  placements.push({ word: first.word, clue: first.clue, row: 0, col: 0, dir: 'across' });

  const fits = (word: string, row: number, col: number, dir: Dir): number => {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    let crossings = 0;

    // Cell just before the start and just after the end must be empty.
    if (at(row - dr, col - dc) !== undefined) return -1;
    if (at(row + dr * word.length, col + dc * word.length) !== undefined) return -1;

    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const existing = at(r, c);
      if (existing !== undefined) {
        if (existing !== word[i]) return -1; // conflict
        crossings++;
        continue;
      }
      // Empty cell we will fill — its perpendicular neighbours must be empty,
      // otherwise we'd glue two separate words together.
      if (dir === 'across') {
        if (at(r - 1, c) !== undefined || at(r + 1, c) !== undefined) return -1;
      } else {
        if (at(r, c - 1) !== undefined || at(r, c + 1) !== undefined) return -1;
      }
    }
    return crossings;
  };

  // Try to place each remaining word at its best-scoring interlock.
  for (let w = 1; w < pool.length; w++) {
    const { word, clue } = pool[w];
    let best: { row: number; col: number; dir: Dir; score: number } | null = null;

    for (let i = 0; i < word.length; i++) {
      for (const [ck, letter] of cells) {
        if (letter !== word[i]) continue;
        const [r, c] = ck.split(',').map(Number);
        // Cross an across letter with a down word and vice-versa.
        for (const dir of ['across', 'down'] as Dir[]) {
          const dr = dir === 'down' ? 1 : 0;
          const dc = dir === 'across' ? 1 : 0;
          const row = r - dr * i;
          const col = c - dc * i;
          const score = fits(word, row, col, dir);
          if (score > 0 && (!best || score > best.score)) {
            best = { row, col, dir, score };
          }
        }
      }
    }

    if (best) {
      const dr = best.dir === 'down' ? 1 : 0;
      const dc = best.dir === 'across' ? 1 : 0;
      for (let i = 0; i < word.length; i++) {
        cells.set(key(best.row + dr * i, best.col + dc * i), word[i]);
      }
      placements.push({ word, clue, row: best.row, col: best.col, dir: best.dir });
    }
  }

  if (placements.length < 3) return null;

  // Normalise coordinates to a 0-based grid.
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const ck of cells.keys()) {
    const [r, c] = ck.split(',').map(Number);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const grid: (string | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null as string | null),
  );
  for (const [ck, letter] of cells) {
    const [r, c] = ck.split(',').map(Number);
    grid[r - minR][c - minC] = letter;
  }

  // Number the word-start cells (row-major), then match placements to numbers.
  const numbers: Record<string, number> = {};
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const startsAcross = (c === 0 || !grid[r][c - 1]) && c + 1 < cols && !!grid[r][c + 1];
      const startsDown = (r === 0 || !grid[r - 1][c]) && r + 1 < rows && !!grid[r + 1][c];
      if (startsAcross || startsDown) {
        n++;
        numbers[`${r},${c}`] = n;
      }
    }
  }

  const clues: CrosswordClue[] = placements
    .map((p) => {
      const r = p.row - minR;
      const c = p.col - minC;
      return {
        number: numbers[`${r},${c}`] || 0,
        direction: p.dir,
        clue: p.clue,
        answer: p.word,
        row: r,
        col: c,
      };
    })
    .filter((cl) => cl.number > 0)
    .sort((a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1));

  return {
    data: { size: { rows, cols }, grid, numbers, clues },
    placedCount: placements.length,
    dropped: Math.min(words.length, maxWords) - placements.length,
  };
}
