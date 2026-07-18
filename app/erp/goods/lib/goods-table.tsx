'use client';
import { useEffect, useState } from 'react';
import { GoodForm } from '@/app/lib/definitions';
import { fetchFilteredGoods } from './goods-actions';
import BtnDeleteGood from './btn-delete-good';
import { BtnEditGoodLink } from './goods-buttons';

export default function GoodsTable({
  query,
  currentPage,
  userId,
  readonly_permission,
  current_sections,
  showDeleteButton = false,
  rows_per_page = 8,
}: {
  query: string;
  currentPage: number;
  userId: string;
  readonly_permission: boolean;
  current_sections: string;
  showDeleteButton?: boolean;
  rows_per_page?: number;
}) {
  const [goods, setGoods] = useState<GoodForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoods = async () => {
    try {
      setLoading(true);
      const data = await fetchFilteredGoods(query, currentPage, current_sections, rows_per_page);
      setGoods(data);
    } catch (err) {
      setError('Не удалось загрузить товары');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoods();
  }, [query, currentPage, current_sections]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (goods.length === 0) return <div className='mt-4'>Нет товаров</div>;

  return (
    <div id="goods-table" className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              {/* Таблица для больших экранов */}
              <table className="table-fixed hidden w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium sm:pl-6">ТОВАРЫ</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium">Бренд</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium">Артикул</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium">Поставщик</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium">Цена розница</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {goods.map((good) => (
                    <tr key={good.id} className="group">
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/goods/${good.id}/edit`}
                          className="text-blue-800 underline"
                        >
                          {good.name}
                        </a>
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {good.brand}
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {good.product_code}
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {good.supplier_name}
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {good.price_retail}
                      </td>
                      <td className="w-2/12 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {showDeleteButton && <BtnDeleteGood 
                          id={good.id} 
                          name={good.name}
                          userId={userId}
                          readonly_permission={readonly_permission}
                          current_sections={current_sections} 
                          onDelete={loadGoods} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Карточки для мобильных устройств */}
              <div className="md:hidden">
                {goods.map((good) => (
                  <div
                    key={good.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/erp/goods/${good.id}/edit`}>
                          {good.name}
                        </a>
                      </h3>
                      <div className="flex gap-2">
                        <BtnEditGoodLink id={good.id} />
                          {showDeleteButton && <BtnDeleteGood 
                          id={good.id} 
                          name={good.name}
                          userId={userId}
                          readonly_permission={readonly_permission}
                          current_sections={current_sections} 
                          onDelete={loadGoods} />}                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Бренд: {good.brand}</p>
                    <p className="text-sm text-gray-600">Артикул: {good.product_code}</p>
                    <p className="text-sm text-gray-600">Поставщик: {good.supplier_name}</p>
                    <p className="text-sm text-gray-600">Цена: {good.price_retail}</p>
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