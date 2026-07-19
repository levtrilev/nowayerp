//Machine create Page

import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { checkReadonly } from "@/app/lib/common-utils";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { MachineForm } from "@/app/lib/definitions";
import MachineEditForm from "../[id]/edit/machine-edit-form";
import { fetchLocationsForm } from "../../../erp/locations/lib/locations-actions";
import { fetchUnitsForm } from "@/app/erp/units/lib/units-actions";

export default async function Page() {
  //#region unified hooks and variables 
  const session = await auth();
  const session_user = session ? session.user : null;
  if (!session_user || !session_user.email) return (<h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>);

  const email = session_user.email;
  const user = await getUser(email as string);
  if (!user) return (<h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>);
  const pageUser = user;

  const current_sections = await getCurrentSections(email as string);
  const sections = await fetchSectionsForm(current_sections);
  // const tenant_id = (await fetchSectionById(object.section_id)).tenant_id;
  const tenant_id = pageUser.tenant_id;
  const userPermissions = await fetchDocUserPermissions(user.id as string, 'machines');
  // const readonly_locked = !editingByCurrentUser;
  const readonly_locked = false
  //    #endregion

  const machine: MachineForm = {
    id: "",
    name: "",
    unit_id: "00000000-0000-0000-0000-000000000000",
    unit_name: "",
    location_id: "00000000-0000-0000-0000-000000000000",
    location_name: "",
    number: "",
    model: "",
    machine_status: "неизвестно",
    username: "",
    date_created: new Date(), //formatDateForInput(new Date()),
    section_id: "00000000-0000-0000-0000-000000000000",
    section_name: "",
    tenant_id: "00000000-0000-0000-0000-000000000000",
    author_id: "00000000-0000-0000-0000-000000000000",
    editor_id: "00000000-0000-0000-0000-000000000000",
    editing_since: "",
    editing_by_user_id: "",
    doc_status: "draft"
  } as MachineForm;
  const readonly_permission = checkReadonly(userPermissions, machine, pageUser.id);
  const readonly = readonly_locked || readonly_permission;
  const units = readonly ? [] : await fetchUnitsForm(current_sections);
  const locations = readonly ? [] : await fetchLocationsForm(current_sections);

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Машины', href: '/repair/machines' },
          {
            label: 'Создать новую',
            href: '/repair/machines/create',
            active: true,
          },
        ]}
      />
      <div className="flex w-full items-center justify-between">
        {readonly && <span className="text-xs font-medium text-gray-400">только чтение для пользователя: {user?.email}</span>}
        {!readonly && <span className="text-xs font-medium text-gray-400">права на изменение для пользователя: {user?.email}</span>}
      </div>
      <DocWrapper
        pageUser={pageUser}
        userSections={sections}
        userPermissions={userPermissions}
        docTenantId={tenant_id}
      >
        <MachineEditForm
          machine={machine}
          units={units}
          locations={locations}
          lockedByUserId={null}
          unlockAction={null}
          readonly={readonly}
        />
      </DocWrapper>
    </main>
  );
}