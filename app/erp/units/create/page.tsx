// Unit create Page

import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { checkReadonly } from "@/app/lib/common-utils";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { UnitForm } from "@/app/lib/definitions";
import UnitEditForm from "../[id]/edit/unit-edit-form";
import { fetchObjectsForm } from "../../objects/lib/objects-actions";

export default async function Page() {
  const session = await auth();
  const session_user = session?.user;
  if (!session_user?.email) return <h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>;

  const email = session_user.email;
  const user = await getUser(email);
  if (!user) return <h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>;

  const current_sections = await getCurrentSections(email);
  const sections = await fetchSectionsForm(current_sections);
  const tenant_id = user.tenant_id;
  const userPermissions = await fetchDocUserPermissions(user.id, 'units');
  const readonly_locked = false;

  const unit: UnitForm = {
    id: "",
    name: "",
    object_id: "",
    object_name: "",
    username: "",
    date_created: new Date(),
    section_id: "",
    section_name: "",
    tenant_id: "",
    author_id: "",
    editor_id: "",
    editing_since: null,
    editing_by_user_id: null,
  } as UnitForm;

  const readonly_permission = checkReadonly(userPermissions, unit, user.id);
  const readonly = readonly_locked || readonly_permission;
  const objects = readonly? [] : await fetchObjectsForm(current_sections);

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Участки', href: '/erp/units' },
          { label: 'Создать новый', href: '/erp/units/create', active: true },
        ]}
      />
      <div className="flex w-full items-center justify-between">
        {readonly && <span className="text-xs font-medium text-gray-400">только чтение для пользователя: {user.email}</span>}
        {!readonly && <span className="text-xs font-medium text-gray-400">права на изменение для пользователя: {user.email}</span>}
      </div>
      <DocWrapper
        pageUser={user}
        userSections={sections}
        userPermissions={userPermissions}
        docTenantId={tenant_id}
      >
        <UnitEditForm
          unit={unit}
          objects={objects}
          lockedByUserId={null}
          unlockAction={null}
          readonly={readonly}
        />
      </DocWrapper>
    </main>
  );
}