export interface PositionError {
  planet: string;
  error: string;
}

export interface PositionPayload {
  data: Record<string, unknown>;
  errors?: PositionError[];
}

/**
 * Merge freshly-fetched positions over the last known good ones.
 *
 * A body that failed the latest refresh is absent from `fresh.data`, so it keeps
 * its previous position instead of being wiped from the cache — it'll simply be
 * retried on the next refresh. This is what stops a partially-failed JPL pull
 * from making planets disappear on the client.
 */
export function mergePositions(previous: PositionPayload | null, fresh: PositionPayload): PositionPayload {
  const previousData = previous?.data ?? {};
  const mergedData = { ...previousData, ...fresh.data };
  const errors = fresh.errors ?? [];

  // Only surface errors for bodies we have no position for at all. A body that
  // failed now but still has a cached position isn't broken from the client's
  // point of view, so it shouldn't be reported as an error.
  const unresolvedErrors = errors.filter((e) => !mergedData[e.planet]);

  return {
    data: mergedData,
    ...(unresolvedErrors.length > 0 ? { errors: unresolvedErrors } : {}),
  };
}
