
//Object create Page

import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
// import { DateTime } from "next-auth/providers/kakao";
import { checkReadonly, formatDateForInput } from "@/app/lib/common-utils";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { ObjectForm } from "@/app/lib/definitions";
import ObjectEditForm from "../[id]/edit/object-edit-form";

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
  const userPermissions = await fetchDocUserPermissions(user.id as string, 'objects');
  // const readonly_locked = !editingByCurrentUser;
  const readonly_locked = false
  //    #endregion

  const object: ObjectForm = {
    id: "",
    name: "",
    username: "",
    date_created: new Date(), //formatDateForInput(new Date()),
    schedule_owner_name: "",
    section_id: "",
    section_name: "",
    premise_id: "",
    premise_name: "",
    tenant_id: "",
    author_id: "",
    editor_id: "",
    editing_since: "",
    editing_by_user_id: "",
  } as ObjectForm;
  const readonly_permission = checkReadonly(userPermissions, object, pageUser.id);
  const readonly = readonly_locked || readonly_permission;

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Объекты', href: '/erp/objects' },
          {
            label: 'Создать новый',
            href: '/erp/objects/create',
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
        <ObjectEditForm
          object={object}
          lockedByUserId={null}
          unlockAction={null}
          readonly={readonly}
        />
      </DocWrapper>
    </main>
  );
}