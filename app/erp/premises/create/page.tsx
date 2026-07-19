
//premise create Page

import PremiseEditForm from "../[id]/edit/premise-edit-form";
import { PremiseForm, User } from "@/app/lib/definitions";
import { lusitana } from "@/app/ui/fonts";
import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { DateTime } from "next-auth/providers/kakao";
import { checkReadonly, formatDateForInput } from "@/app/lib/common-utils";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import DocWrapper from "../../../lib/doc-wrapper";
import { fetchLegalEntities, fetchLegalEntitiesForm } from "../../legal-entities/lib/legal-entities-actions";
import { fetchRegionsForm } from "../../regions/lib/regions-actions";

export default async function Page() {
  const session = await auth();
  const email = session ? (session.user ? session.user.email : "") : "";
  const user = await getUser(email as string);
  const current_sections = await getCurrentSections(email as string);
  const userPermissions = await fetchDocUserPermissions(user?.id as string, 'premises');
  const pageUser = user ? user : {} as User
  const tenant_id = user ? user.tenant_id : "00000000-0000-0000-0000-000000000000";
  // const formatDateForInput = (date: Date | string): string => {
  //   if (!date) return ''; // Если дата пустая, возвращаем пустую строку
  //   const d = new Date(date);
  //   const year = d.getFullYear();
  //   const month = String(d.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
  //   const day = String(d.getDate()).padStart(2, '0');
  //   return `${year}-${month}-${day}`;
  // };
  const premise: PremiseForm = {
    id: "",
    name: "",
    description: "",
    cadastral_number: "",
    square: 0,
    address: "",
    address_alt: "",
    type: "",
    status: "",
    status_until: new Date(), //formatDateForInput(new Date()),
    region_id: "",
    owner_id: "",
    operator_id: "",
    section_id: "",
    tenant_id: "",
    username: user?.name as string,
    author_id: user?.id as string,
    editor_id: "00000000-0000-0000-0000-000000000000",
    // timestamptz: new Date().toISOString(),
    date_created: new Date(), //formatDateForInput(new Date()),
    section_name: "",
    region_name: "",
    owner_name: "",
    operator_name: "",
    user_tags: [],
    access_tags: []
  } as PremiseForm;
  const readonly = checkReadonly(userPermissions, premise, pageUser.id);

  const sections = await fetchSectionsForm(current_sections);
  const regions = await fetchRegionsForm(current_sections);
  const legalEntities = await fetchLegalEntitiesForm(current_sections);
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Помещения', href: '/erp/premises' },
          {
            label: 'Создать новое',
            href: '/erp/premises/create',
            active: true,
          },
        ]}
      />
      <div className="flex w-full items-center justify-between">
        {/* <h1 className={`${lusitana.className} text-2xl`}>Новое помещение</h1> */}
        {readonly && <span className="text-xs font-medium text-gray-400">только чтение для пользователя: {user?.email}</span>}
        {!readonly && <span className="text-xs font-medium text-gray-400">права на изменение для пользователя: {user?.email}</span>}
      </div>
      <DocWrapper
        pageUser={pageUser}
        userSections={sections}
        userPermissions={userPermissions}
        docTenantId={tenant_id}
      >
        <PremiseEditForm
          premise={premise}
          readonly={readonly}
          // sections={sections}
          regions={regions}
          legalEntities={legalEntities}
        />
      </DocWrapper>
    </main>
  );
}