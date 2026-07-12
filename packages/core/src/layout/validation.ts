// Shared helpers for the fail-fast referential-integrity checks that every
// node/edge-style adapter runs before handing geometry to a layout engine.
// The goal is that when a diagram references an id that doesn't exist, the
// error tells the caller exactly what went wrong AND what would have been
// valid — an LLM (the primary consumer) can then self-correct in one shot.

const MAX_KNOWN_IDS = 10;
const MAX_SUGGESTION_DISTANCE = 2;

/** Classic iterative Levenshtein distance. No dependency, ids are short. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Finds the known id closest to `badId`: a case-insensitive exact match wins
 * outright, otherwise the smallest Levenshtein distance within a threshold.
 * Returns `undefined` when nothing is close enough to be worth suggesting.
 */
export function closestId(badId: string, knownIds: Iterable<string>): string | undefined {
  const ids = [...knownIds];
  const lowerBad = badId.toLowerCase();

  const caseMatch = ids.find((id) => id.toLowerCase() === lowerBad);
  if (caseMatch && caseMatch !== badId) return caseMatch;

  let best: string | undefined;
  let bestDistance = MAX_SUGGESTION_DISTANCE + 1;
  for (const id of ids) {
    const distance = levenshtein(lowerBad, id.toLowerCase());
    if (distance < bestDistance) {
      best = id;
      bestDistance = distance;
    }
  }
  return bestDistance <= MAX_SUGGESTION_DISTANCE ? best : undefined;
}

/** Renders a capped, human-readable list of the valid ids. */
function knownIdList(knownIds: Iterable<string>): string {
  const ids = [...knownIds];
  if (ids.length === 0) return "(none defined)";
  const shown = ids.slice(0, MAX_KNOWN_IDS).map((id) => `"${id}"`).join(", ");
  const overflow = ids.length - MAX_KNOWN_IDS;
  return overflow > 0 ? `${shown}, … and ${overflow} more` : shown;
}

export interface UnknownIdErrorParams {
  /** What the referencing item is, capitalized: "Edge", "Link", "Sequence message". */
  kind: string;
  /** The item's index in its collection. */
  index: number;
  /** Which endpoint is broken: "source", "target". */
  field: string;
  /** The id that wasn't found. */
  badId: string;
  /** The full set of valid ids. */
  knownIds: Iterable<string>;
  /** The referenced thing's noun: "node" (default) or "participant". */
  noun?: string;
}

/**
 * Builds the standard "references unknown …" error, e.g.:
 *   Edge #1 references unknown source node "webb". Did you mean "web"? Known node ids: "web", "api", "db".
 */
export function unknownIdError(params: UnknownIdErrorParams): Error {
  const { kind, index, field, badId, knownIds, noun = "node" } = params;
  const ids = [...knownIds];
  const suggestion = closestId(badId, ids);
  const didYouMean = suggestion ? ` Did you mean "${suggestion}"?` : "";
  return new Error(
    `${kind} #${index} references unknown ${field} ${noun} "${badId}".${didYouMean} Known ${noun} ids: ${knownIdList(ids)}.`
  );
}
