import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

interface UseResourceQueryOptions<T> {
  initialData: T;
  queryKey: string;
  enabled?: boolean;
  intervalMs?: number;
  fetcher: () => Promise<T>;
}

interface UseResourceQueryResult<T> {
  data: T;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  setData: Dispatch<SetStateAction<T>>;
  refetch: () => Promise<void>;
}

export function useResourceQuery<T>({
  initialData,
  queryKey,
  enabled = true,
  intervalMs,
  fetcher,
}: UseResourceQueryOptions<T>): UseResourceQueryResult<T> {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  const initialDataRef = useRef(initialData);
  const runRequestRef = useRef<(isFirstLoad: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    if (!enabled) {
      setData(initialDataRef.current);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      runRequestRef.current = async () => {};
      return;
    }

    let isMounted = true;

    const runRequest = async (isFirstLoad: boolean) => {
      if (isFirstLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const nextData = await fetcherRef.current();

        if (!isMounted) {
          return;
        }

        setData(nextData);
        setError(null);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        const message =
          requestError instanceof Error ? requestError.message : 'Veri alinirken beklenmeyen bir hata olustu.';
        setError(message);
      } finally {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    runRequestRef.current = runRequest;
    setData(initialDataRef.current);
    setError(null);
    void runRequest(true);

    const intervalId =
      intervalMs && intervalMs > 0
        ? window.setInterval(() => {
            void runRequest(false);
          }, intervalMs)
        : null;

    return () => {
      isMounted = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [enabled, intervalMs, queryKey]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    setData,
    refetch: async () => {
      await runRequestRef.current(false);
    },
  };
}
