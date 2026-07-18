// Persons Page

import Pagination from "@/app/ui/pagination";
import TasksTable from "@/app/erp/tasks/lib/task-table";
import Search from "@/app/ui/search";
import { CreateTask } from "@/app/erp/tasks/lib/task-buttons";
import { lusitana } from "@/app/ui/fonts";
import { auth, getUser } from "@/auth";
import { getCurrentSections, getCurrentSectionsArray } from "@/app/lib/common-actions";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { checkReadonly } from "@/app/lib/common-utils";

import { getUserCurrentSections } from "../arm/arm-actions";
import ArmTabsPage from "../arm/tabs-page";
import { EffectiveSectionsSync } from "../arm/effective-sections-sync";
import { fetchPersonsPages } from "../../erp/persons/lib/persons-actions";
import { CreatePerson } from "../../erp/persons/lib/persons-buttons";
import { CreateMachine } from "../machines/lib/machines-buttons";
import MachinesTable from "../machines/lib/machines-table";
import { fetchMachinesPages } from "../machines/lib/machines-actions";
import ClaimsTable from "../claims/lib/claims-table";
import PersonsTable from "../../erp/persons/lib/persons-table";
import { fetchClaimsPages } from "../claims/lib/claims-actions";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";

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

  //#region arm sections
  const current_sections_array = await getCurrentSectionsArray(email as string);
  const effective_sections_array = await getUserCurrentSections(email);     // с учётом сохранённых из АРМ
  const effectiveSectionIdsString = '{' + effective_sections_array.map(s => s.id).join(",") + '}';
  //#endregion

  const searchParams_persons = await props.searchParams;
  const query_persons = searchParams_persons?.query || '';
  const currentPage_persons = Number(searchParams_persons?.page) || 1;
  const totalPages_persons = await fetchPersonsPages(query_persons, current_sections, 16);

  const searchParams_claims = await props.searchParams;
  const query_claims = searchParams_claims?.query || '';
  const currentPage_claims = Number(searchParams_claims?.page) || 1;
  const totalPages_claims = await fetchClaimsPages(query_claims, current_sections, 16);

  return (
    <div className="w-full">
      <ArmTabsPage current_sections_array={current_sections_array} />
      {/* Синхронизация Zustand-tabs после выбора пользователем с сервером */}
      <EffectiveSectionsSync
        userId={user.id}
        allowedSections={current_sections_array.map((s) => s.id)}
        initialEffectiveSections={effective_sections_array.map((s) => s.id)}
      />
      <div className="flex flex-row w-full">

        {/* PersonsTable */}
        <div className="w-5/12">
          <div className="flex w-full items-center justify-between">
            <h1 className={`${lusitana.className} text-2xl`}>Персонал</h1>
          </div>
          {/* <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
            <Search placeholder="Найти сотрудника..." initialQuery={query}  />
            <CreatePerson readonly={readonly_permission} />
          </div> */}

          <PersonsTable
            query={query_persons}
            currentPage={currentPage_persons}
            current_sections={current_sections}
            columns={3}
            rows_per_page={16}
            user_id={user.id}
            readonly_permission={readonly_permission}
          />
          <div className="mt-5 flex w-full justify-center">
            <Pagination totalPages={totalPages_persons} />
          </div>
        </div>
        {/* end of PersonsTable */}

        {/* MachinesTable */}
        {/* <div className="w-full ml-2">
          <div className="flex w-full items-center justify-between">
            <h1 className={`${lusitana.className} text-2xl`}>Машины</h1>
          </div>

          <MachinesTable query={query_machines} currentPage={currentPage_machines} current_sections={effectiveSectionIdsString} />
          <div className="mt-5 flex w-full justify-center">
            <Pagination totalPages={totalPages_machines} />
          </div>
        </div> */}
        {/* end of MachinesTable */}

        {/* ClaimsTable */}
        <div className="w-7/12 ml-2">
          <div className="flex w-full items-center justify-between">
            <h1 className={`${lusitana.className} text-2xl`}>Проводимые ремонты</h1>
          </div>

          <ClaimsTable
            query={query_claims}
            currentPage={currentPage_claims}
            current_sections={effectiveSectionIdsString}
            columns={4}
            rows_per_page={16}
          />
          <div className="mt-5 flex w-full justify-center">
            <Pagination totalPages={totalPages_claims} />
          </div>
        </div>
        {/* end of ClaimsTable */}

      </div>
    </div>
  );
}