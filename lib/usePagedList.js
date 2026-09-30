'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { useToast } from './toast';

// loads one page of a paginated endpoint and keeps track of the page number
export function usePagedList(path, limit = 9) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api('GET', `${path}?page=${page}&limit=${limit}`);
      // e.g. deleted the last item on the last page, step back one page
      if (page > 1 && page > res.pagination.totalPages) {
        setPage(Math.max(res.pagination.totalPages, 1));
        return;
      }
      setData(res);
    } catch (err) {
      toast(err.message);
    }
  }, [path, page, limit, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items: data?.data ?? [],
    pagination: data?.pagination,
    loading: data === null,
    page,
    setPage,
    reload: load,
  };
}
