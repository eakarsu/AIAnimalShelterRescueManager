import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { listItems } from './listResponse';

export default function useCrud(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(endpoint);
      setData(listItems(res.data, endpoint));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (item) => {
    const res = await api.post(endpoint, item);
    await fetchData();
    return res.data;
  };

  const update = async (id, item) => {
    const res = await api.put(`${endpoint}/${id}`, item);
    await fetchData();
    return res.data;
  };

  const remove = async (id) => {
    await api.delete(`${endpoint}/${id}`);
    await fetchData();
  };

  return { data, loading, error, fetchData, create, update, remove };
}
