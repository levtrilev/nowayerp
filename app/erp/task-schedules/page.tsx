
// TaskSchedules Page

import Pagination from "@/app/ui/pagination";
import Search from "@/app/ui/search";
import { lusitana } from "@/app/ui/fonts";
// import { CreateTaskSchedule } from "./lib/buttons";
// import TaskSchedulesTable from "./lib/taskSchedulesTable";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import { fetchTaskSchedulesPages } from "./lib/tsch-actions";
import { CreateTaskSchedule } from "./lib/tsch-buttons";
import TaskSchedulesTable from "./lib/taskSchedulesTable";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { checkReadonly } from "@/app/lib/common-utils";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const email = session ? (session.user ? session.user.email : "") : "";
  const current_sections = await getCurrentSections(email as string);

  const user = await getUser(email as string);
  if (!user) {
    return <h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>;
  }
  const pageUser = user;
  const userPermissions = await fetchDocUserPermissions(user.id, 'task_schedules');
  if (!isUserAuthorized(userPermissions, pageUser)) {
    return <NotAuthorized />
  }
  const task_schedules = {};
  const readonly_permission = checkReadonly(userPermissions, task_schedules, pageUser.id);

  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchTaskSchedulesPages(query, current_sections);

  // const customers = await fetchCustomers();
  // const regions = await fetchRegionsForm();
  return (
    <>
      {/* <Counter /> */}
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <h1 className={`${lusitana.className} text-2xl`}>Планы обслуживания</h1>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
          <Search placeholder="Найти план обслуживания..." initialQuery={query}  />
          <CreateTaskSchedule />
        </div>

        <TaskSchedulesTable
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