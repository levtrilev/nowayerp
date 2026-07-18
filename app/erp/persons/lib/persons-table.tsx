// tasks-table.tsx

import { lusitana } from '@/app/ui/fonts';
import Search from '@/app/ui/search';

import { Person } from '@/app/lib/definitions';
// import { BtnEditTaskLink } from './task-buttons';
// import BtnDeleteTask from './btn-delete-task';
import { fetchFilteredPersons } from './persons-actions';
import BtnDeletePerson from './btn-delete-person';
import { BtnEditPersonLink } from './persons-buttons';

export default async function PersonsTable({
  query,
  currentPage,
  current_sections,
  columns = 5,
  rows_per_page = 8,
  user_id,
  readonly_permission,
}: {
  query: string;
  currentPage: number;
  current_sections: string;
  columns?: number;
  rows_per_page?: number;
  user_id: string;
  readonly_permission: boolean;
}) {
  const persons = await fetchFilteredPersons(query, currentPage, current_sections, rows_per_page);

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
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Имя</th>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Профессия</th>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Табельный номер</th>
                    {columns >= 4 && <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Пользователь</th>}
                    {columns >= 5 && <th scope="col" className="w-1/12 px-4 py-5 font-medium"></th>}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {persons.map((person) => (
                    <tr key={person.id} className="group">
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/persons/${person.id}/edit`}
                          className="text-blue-800 underline"
                        >
                          {person.name}
                        </a>
                      </td>
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {person.profession}
                      </td>
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {person.tabel_number}
                      </td>
                      {columns >= 4 && <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {person.person_user_name}
                      </td>}
                      {columns >= 5 && <td className="w-1/12 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {!readonly_permission &&
                            <BtnDeletePerson
                              id={person.id}
                              name={person.name}
                              user_id={user_id}
                              readonly_permission={readonly_permission}
                              current_sections={current_sections}
                            />}
                        </div>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Карточки для мобильных устройств */}
              <div className="md:hidden">
                {persons.map((person) => (
                  <div
                    key={person.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/erp/persons/${person.id}/edit`}>
                          {person.name}
                        </a>
                      </h3>
                      <div className="flex gap-2">
                        <BtnEditPersonLink id={person.id} />
                        {!readonly_permission &&
                          <BtnDeletePerson
                            id={person.id}
                            name={person.name}
                            user_id={user_id}
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