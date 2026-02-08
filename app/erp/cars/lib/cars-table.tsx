// Cars-table.tsx
'use client';

import { fetchFilteredCars } from './cars-actions';
import BtnDeleteCar from './btn-delete-car';
import { BtnEditCarLink } from './cars-buttons';
import { useEffect, useState } from 'react';
import CarsTableNaked from './cars-table-naked';

export default function CarsTable({
  query,
  currentPage,
  current_sections,
  showDeleteButton = false,
}: {
  query: string;
  currentPage: number;
  current_sections: string;
  showDeleteButton?: boolean;
}) {
  const [cars, setCars] = useState<Awaited<ReturnType<typeof fetchFilteredCars>> | null>(null);
  const [loading, setLoading] = useState(true);
  const loadCars = async () => {
    setLoading(true);
    try {
      const result = await fetchFilteredCars(query, currentPage, current_sections);
      setCars(result);
    } catch (error) {
      console.error('Failed to fetch cars:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadCars();
  }, [query, currentPage, current_sections]);

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  if (!cars) {
    return <div className="p-4">Нет данных</div>;
  }

  return (
    <CarsTableNaked cars={cars} showDeleteButton={showDeleteButton} loadCars={loadCars} />
  );
}
