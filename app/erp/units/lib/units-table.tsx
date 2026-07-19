// units-table.tsx

import { Unit } from '@/app/lib/definitions';
import { fetchFilteredUnits } from './units-actions';
import BtnDeleteUnit from './btn-delete-unit';
import { BtnEditUnitLink } from './units-buttons';

export default async function UnitsTable({
  query,
  currentPage,
  current_sections,
  readonly_permission,
  user_id,
}: {
  query: string;
  currentPage: number;
  current_sections: string;
  readonly_permission: boolean;
  user_id: string;
}) {
  const units = await fetchFilteredUnits(query, currentPage, current_sections);

  return (
    <div className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">

              {/* Desktop table */}
              <table className="table-fixed hidden w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Участок</th>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Объект</th>
                    <th scope="col" className="w-1/12 px-4 py-5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {units.map((unit) => (
                    <tr key={unit.id} className="group">
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/units/${unit.id}/edit?query=${encodeURIComponent(query)}&page=${currentPage}`}
                          className="text-blue-800 underline"
                        >
                          {unit.name}
                        </a>
                      </td>
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {unit.object_name}
                      </td>
                      <td className="w-1/12 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {!readonly_permission &&
                            <BtnDeleteUnit
                              id={unit.id}
                              name={unit.name}
                              user_id={user_id}
                              readonly_permission={readonly_permission}
                              current_sections={current_sections}
                            />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="md:hidden">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/erp/units/${unit.id}/edit?query=${encodeURIComponent(query)}&page=${currentPage}`}>
                          {unit.name}
                        </a>
                       </h3>
                      <div className="flex gap-2">
                        <BtnEditUnitLink id={unit.id} query={query} currentPage={currentPage} />
                          {!readonly_permission &&
                            <BtnDeleteUnit
                              id={unit.id}
                              name={unit.name}
                              user_id={user_id}
                              readonly_permission={readonly_permission}
                              current_sections={current_sections}
                            />}                      </div>
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