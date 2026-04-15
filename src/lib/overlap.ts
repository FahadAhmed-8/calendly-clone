/**
 * Overlap detection used by the transactional slot-lock checks in
 * POST /api/public/bookings and POST /api/public/bookings/[id]/reschedule.
 *
 * Two bookings overlap when either of their start/end intervals touch AFTER
 * expanding both by the event type's bufferBefore / bufferAfter. Both sides
 * are expanded symmetrically so that back-to-back meetings with a 15m buffer
 * correctly reject any new booking inside that buffer window.
 */

export interface Interval {
  startUtc: Date;
  endUtc: Date;
}

export interface BufferConfig {
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}

export function expandWithBuffers(i: Interval, cfg: BufferConfig): Interval {
  return {
    startUtc: new Date(i.startUtc.getTime() - cfg.bufferBeforeMinutes * 60 * 1000),
    endUtc: new Date(i.endUtc.getTime() + cfg.bufferAfterMinutes * 60 * 1000),
  };
}

export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.startUtc < b.endUtc && a.endUtc > b.startUtc;
}

/** True iff `candidate` collides with ANY of `existing` once both sides are buffered. */
export function overlapsAnyWithBuffers(
  candidate: Interval,
  existing: Interval[],
  cfg: BufferConfig,
): boolean {
  const cand = expandWithBuffers(candidate, cfg);
  return existing.some((ex) => intervalsOverlap(cand, expandWithBuffers(ex, cfg)));
}
