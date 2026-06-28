// Persons Page

import Pagination from "@/app/ui/pagination";
import Search from "@/app/ui/search";
import { lusitana } from "@/app/ui/fonts";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { checkReadonly } from "@/app/lib/common-utils";
import { fetchPersonsPages } from "./lib/persons-actions";
import { CreatePerson } from "./lib/persons-buttons";
import PersonsTable from "./lib/persons-table";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";
// import PersonsTable from "./lib/persons-table";

export default async function Page(props: {

  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {

  //#region unified hooks and variables 
  const session = await auth();
  const session_user = session ? session.user : null;
  if (!session_user || !session_user.email) return (<h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>);

  const email = session_user.email;
  const user = await getUser(email as string);
  if (!user) return (<h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>);
  const pageUser = user;
  const current_sections = await getCurrentSections(email as string);
  const userPermissions = await fetchDocUserPermissions(user.id, 'persons');
  if (!isUserAuthorized(userPermissions, pageUser)) {
    return <NotAuthorized />
  }
  const persons = {};
  const readonly_permission = checkReadonly(userPermissions, persons, pageUser.id);

  //#endregion

  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchPersonsPages(query, current_sections);

  return (
    <>
      {/* <Counter /> */}
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <h1 className={`${lusitana.className} text-2xl`}>Сотрудники</h1>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
          <Search placeholder="Найти сотрудника..." />
          <CreatePerson readonly={readonly_permission} />
        </div>

        <PersonsTable
          query={query}
          currentPage={currentPage}
          current_sections={current_sections}
          showDeleteButton={!readonly_permission}
        />
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </>
  );
}