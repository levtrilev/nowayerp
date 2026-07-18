// locations-table.tsx
// 'use client';
import { lusitana } from '@/app/ui/fonts';
import Search from '@/app/ui/search';

import { Location } from '@/app/lib/definitions';
import { fetchFilteredLocations } from './locations-actions';
import BtnDeleteLocation from './btn-delete-location';
import { BtnEditLocationLink } from './locations-buttons';

export default async function LocationsTable({
  query,
  currentPage,
  current_sections,
  userId,
  readonly_permission,
}: {
  query: string;
  currentPage: number;
  current_sections: string;
  userId: string;
  readonly_permission: boolean;
}) {
  const locations = await fetchFilteredLocations(query, currentPage, current_sections);

  return (
    <div className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">

              {/* Таблица для больших экранов */}
              <table className="table-fixed hidden w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Название</th>
                    <th scope="col" className="w-1/12 px-4 py-5 font-medium"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {locations.map((location) => (
                    <tr key={location.id} className="group">
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/locations/${location.id}/edit`}
                          className="text-blue-800 underline"
                        >
                          {location.name}
                        </a>
                      </td>

                      <td className="w-1/12 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {!readonly_permission && <BtnDeleteLocation
                            id={location.id}
                            name={location.name}
                            userId={userId}
                            readonly_permission={readonly_permission}
                            current_sections={current_sections}
                          />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Карточки для мобильных устройств */}
              <div className="md:hidden">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/erp/locations/${location.id}/edit`}>
                          {location.name}
                        </a>
                      </h3>
                      <div className="flex gap-2">
                        <BtnEditLocationLink id={location.id} />
                        {!readonly_permission && <BtnDeleteLocation 
                        id={location.id} 
                        name={location.name} 
                        userId={userId} 
                        readonly_permission={readonly_permission}
                        current_sections={current_sections} 
                        />}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
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