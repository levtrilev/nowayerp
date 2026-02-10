'use client';
import { useEffect, useState } from 'react';
import { WarehouseForm } from '@/app/lib/definitions';
import { fetchFilteredWarehouses } from './warehouses-actions';
import BtnDeleteWarehouse from './btn-delete-warehouse';
import { BtnEditWarehouseLink } from './warehouses-buttons';

export default function WarehousesTable({
  query,
  currentPage,
  current_sections,
  showDeleteButton = false,
  rows_per_page = 8,
}: {
  query: string;
  currentPage: number;
  current_sections: string;
  showDeleteButton?: boolean;
  rows_per_page?: number;
}) {
  const [warehouses, setWarehouses] = useState<WarehouseForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await fetchFilteredWarehouses(query, currentPage, current_sections, rows_per_page);
      setWarehouses(data);
    } catch (err) {
      setError('Не удалось загрузить склады');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, [query, currentPage, current_sections]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (warehouses.length === 0) return <div className='mt-4'>Нет складов</div>;

  return (
    <div id="warehouses-table" className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              {/* Таблица для больших экранов */}
              <table className="table-fixed hidden w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="w-3/4 px-4 py-5 font-medium sm:pl-6">СКЛАДЫ</th>
                    <th scope="col" className="w-1/4 px-4 py-5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {warehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="group">
                      <td className="w-3/4 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/warehouses/${warehouse.id}/edit`}
                          // className="text-blue-800 underline"
                          className={
                            warehouse.doc_status !== 'active'
                              ? 'text-gray-500 line-through hover:text-gray-600' // Неактивное состояние
                              : 'text-blue-800 underline hover:text-blue-900'   // Активное состояние
                          }
                        >
                          {warehouse.name}
                        </a>
                      </td>
                      <td className="w-1/4 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {showDeleteButton && <BtnDeleteWarehouse id={warehouse.id} name={warehouse.name} onDelete={loadWarehouses} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Карточки для мобильных устройств */}
              <div className="md:hidden">
                {warehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/erp/warehouses/${warehouse.id}/edit`}>
                          {warehouse.name}
                        </a>
                      </h3>
                      <div className="flex gap-2">
                        <BtnEditWarehouseLink id={warehouse.id} />
                        {showDeleteButton && <BtnDeleteWarehouse id={warehouse.id} name={warehouse.name} onDelete={loadWarehouses} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}