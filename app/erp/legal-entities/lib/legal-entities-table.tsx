'use client';
import { useEffect, useState } from 'react';
import { LegalEntityForm } from '@/app/lib/definitions';
import { fetchFilteredLegalEntities } from './legal-entities-actions';
import BtnDeleteLegalEntity from './btn-delete-legal-entity';
import { BtnEditLegalEntityLink } from './legal-entities-buttons';

export default function LegalEntitiesTable({
  query,
  currentPage,
  current_sections,
  userId, 
  readonly_permission,
  showDeleteButton = false,
}: {
  query: string;
  currentPage: number;
  current_sections: string;
  userId: string;
  readonly_permission: boolean;
  showDeleteButton?: boolean;
}) {
  const [legalEntities, setLegalEntities] = useState<LegalEntityForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLegalEntities = async () => {
    try {
      setLoading(true);
      const data = await fetchFilteredLegalEntities(query, currentPage, current_sections);
      setLegalEntities(data);
    } catch (err) {
      setError('Не удалось загрузить юрлица');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLegalEntities();
  }, [query, currentPage, current_sections]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (legalEntities.length === 0) return <div className='mt-4'>Нет юрлиц</div>;

  return (
    <div id="legal-entities-table" className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              {/* Таблица для больших экранов */}
              <table className="table-fixed hidden w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium sm:pl-6">ЮРЛИЦА</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium">ИНН</th>
                    <th scope="col" className="w-3/12 px-4 py-5 font-medium">Полное название</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium">Телефон</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {legalEntities.map((le) => (
                    <tr key={le.id} className="group">
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/legal-entities/${le.id}/edit`}
                          className="text-blue-800 underline"
                        >
                          {le.name}
                        </a>
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {le.inn}
                      </td>
                      <td className="w-3/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {le.fullname}
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {le.phone}
                      </td>
                      <td className="w-2/12 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {showDeleteButton && <BtnDeleteLegalEntity 
                          id={le.id} 
                          name={le.name}
                          readonly_permission={readonly_permission}
                          userId={userId}
                          current_sections={current_sections} 
                          onDelete={loadLegalEntities} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Карточки для мобильных устройств */}
              <div className="md:hidden">
                {legalEntities.map((le) => (
                  <div
                    key={le.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/legal-entities/${le.id}/edit`}>
                          {le.name}
                        </a>
                      </h3>
                      <div className="flex gap-2">
                        <BtnEditLegalEntityLink id={le.id} />
                          {showDeleteButton && <BtnDeleteLegalEntity 
                          id={le.id} 
                          name={le.name}
                          readonly_permission={readonly_permission}
                          userId={userId}
                          current_sections={current_sections} 
                          onDelete={loadLegalEntities} />}                      </div>
                    </div>
                    <p className="text-sm text-gray-600">ИНН: {le.inn}</p>
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