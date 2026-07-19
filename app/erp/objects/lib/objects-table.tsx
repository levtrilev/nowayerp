// tasks-table.tsx

import { lusitana } from '@/app/ui/fonts';
import Search from '@/app/ui/search';

import { Object } from '@/app/lib/definitions';
// import { BtnEditTaskLink } from './task-buttons';
// import BtnDeleteTask from './btn-delete-task';
import { fetchFilteredObjects } from './objects-actions';
import BtnDeleteObject from './btn-delete-object';
import { BtnEditObjectLink } from './objects-buttons';

export default async function ObjectsTable({
  query,
  currentPage,
  current_sections,
  user_id,
  readonly_permission,
}: {
  query: string;
  currentPage: number;
  current_sections: string;
  user_id: string;
  readonly_permission: boolean;
}) {
  const objects = await fetchFilteredObjects(query, currentPage, current_sections);

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
                  {objects.map((object) => (
                    <tr key={object.id} className="group">
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/objects/${object.id}/edit`}
                          className="text-blue-800 underline"
                        >
                          {object.name}
                        </a>
                      </td>

                      <td className="w-1/12 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {!readonly_permission &&
                            <BtnDeleteObject
                              id={object.id}
                              name={object.name}
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

              {/* Карточки для мобильных устройств */}
              <div className="md:hidden">
                {objects.map((object) => (
                  <div
                    key={object.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/erp/objects/${object.id}/edit`}>
                          {object.name}
                        </a>
                      </h3>
                      <div className="flex gap-2">
                        <BtnEditObjectLink id={object.id} />
                        {!readonly_permission &&
                          <BtnDeleteObject
                            id={object.id}
                            name={object.name}
                            user_id={user_id}
                            readonly_permission={readonly_permission}
                            current_sections={current_sections}
                          />}                      </div>
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