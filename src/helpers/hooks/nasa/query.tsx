import { useQuery } from '@tanstack/react-query';
import { HorizonsResponse } from '../api/nasa/types';
import { getHorizonsRoute } from '../api/nasa/utils';
import { Loadable, loadDataFromQuery, mapLoadable, QueryOptions } from '../api/query';

export function useHorizonsRouteQuery(options: QueryOptions): Loadable<HorizonsResponse | null> {
  const horizonsQuery = useQuery({
    queryKey: ['horizonsRouteQuery'],
    queryFn: async () => getHorizonsRoute(),
    ...options,
    enabled: options.enabled,
    // Poll the server every ~10s so positions stay live. The server serves a
    // stale-while-revalidate cache, so this only hits JPL at most once per TTL.
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 10,
    refetchOnWindowFocus: false,
  });

  const horizonsRoute = loadDataFromQuery(horizonsQuery);

  return mapLoadable(horizonsRoute)((data): HorizonsResponse | null => data);
}
