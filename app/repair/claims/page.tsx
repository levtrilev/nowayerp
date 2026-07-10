// Claims Page

import Pagination from "@/app/ui/pagination";
import Search from "@/app/ui/search";
import { lusitana } from "@/app/ui/fonts";
import { auth, getUser } from "@/auth";
import { getCurrentSections, getCurrentSectionsArray } from "@/app/lib/common-actions";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { checkReadonly } from "@/app/lib/common-utils";
import { Claim } from "@/app/lib/definitions";
import { fetchClaimsPages } from "./lib/claims-actions";
import { CreateClaim } from "./lib/claims-buttons";
import ClaimsTable from "./lib/claims-table";
import { EffectiveSectionsSync } from "../arm/effective-sections-sync";
import { getUserCurrentSections } from "../arm/arm-actions";
import ArmTabsPage from "../arm/tabs-page";
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
  if (!session_user || !session_user.email) {
    return <h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>;
  }

  const email = session_user.email;
  const user = await getUser(email as string);
  if (!user) {
    return <h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>;
  }
  const pageUser = user;
  const current_sections = await getCurrentSections(email as string);
  const userPermissions = await fetchDocUserPermissions(user.id, 'claims');
  if (!isUserAuthorized(userPermissions, pageUser)) {
    return <NotAuthorized />
  }
  const claims = {};
  const readonly_permission = checkReadonly(userPermissions, claims, pageUser.id);
  //#endregion
  //#region arm sections
  const current_sections_array = await getCurrentSectionsArray(email as string);
  const effective_sections_array = await getUserCurrentSections(email);     // с учётом сохранённых из АРМ
  const effectiveSectionIdsString = '{' + effective_sections_array.map(s => s.id).join(",") + '}';
  //#endregion
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  // const totalPages = await fetchClaimsPages(query, current_sections);
  const totalPages = await fetchClaimsPages(query, effectiveSectionIdsString);

  return (

    <div className="w-full">
      <ArmTabsPage current_sections_array={current_sections_array} />
      {/* Синхронизация Zustand-tabs после выбора пользователем с сервером */}
      <EffectiveSectionsSync
        userId={user.id}
        allowedSections={current_sections_array.map((s) => s.id)}
        initialEffectiveSections={effective_sections_array.map((s) => s.id)}
      />
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Заявки</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Найти заявку..." initialQuery={query}  />
        <CreateClaim readonly={readonly_permission} />
      </div>

      {/* <ClaimsTable query={query} currentPage={currentPage} current_sections={current_sections} /> */}
      <ClaimsTable
        query={query}
        currentPage={currentPage}
        current_sections={effectiveSectionIdsString}
        key={1}
        machine_id={'00000000-0000-0000-0000-000000000000'}
        showDeleteButton={!readonly_permission}
      />
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>

  );
}