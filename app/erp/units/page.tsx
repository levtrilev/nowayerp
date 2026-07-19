// Units Page

import Pagination from "@/app/ui/pagination";
import Search from "@/app/ui/search";
import { lusitana } from "@/app/ui/fonts";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { checkReadonly } from "@/app/lib/common-utils";
import { fetchUnitsPages } from "./lib/units-actions";
import { CreateUnit } from "./lib/units-buttons";
import UnitsTable from "./lib/units-table";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const session_user = session?.user;
  if (!session_user?.email) {
    return <h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>;
  }

  const email = session_user.email;
  const user = await getUser(email);
  if (!user) {
    return <h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>;
  }

  const current_sections = await getCurrentSections(email);
  const userPermissions = await fetchDocUserPermissions(user.id, 'units');
  if (!isUserAuthorized(userPermissions, user)) {
    return <NotAuthorized />
  }
  const readonly_permission = checkReadonly(userPermissions, {}, user.id);

  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchUnitsPages(query, current_sections);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Участки</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Найти участок..." initialQuery={query}  />
        <CreateUnit readonly={readonly_permission} />
      </div>

      <UnitsTable
        query={query}
        currentPage={currentPage}
        current_sections={current_sections}
        readonly_permission={readonly_permission}
        user_id={user.id}
      />
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}