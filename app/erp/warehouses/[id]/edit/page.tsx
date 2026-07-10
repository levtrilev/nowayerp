// Warehouses Page

import { lusitana } from "@/app/ui/fonts";
import { auth, getUser } from "@/auth";
import { getCurrentSections, getFeshRecord, tryLockRecord, unlockRecord } from "@/app/lib/common-actions";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { checkReadonly } from "@/app/lib/common-utils";
import { WarehouseForm } from "@/app/lib/definitions";
import { fetchWarehouseForm } from "../../lib/warehouses-actions";
import WarehouseEditForm from "./warehouse-edit-form";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";

async function Page(props: { params: Promise<{ id: string }> }) {
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
  const sections = await fetchSectionsForm(current_sections);
  const tenant_id = pageUser.tenant_id;
  const userPermissions = await fetchDocUserPermissions(user.id, 'warehouses');
  if (!isUserAuthorized(userPermissions, pageUser)) {
    return <NotAuthorized />
  }
  const params = await props.params;
  const id = params.id;
  //#endregion

  const warehouse: WarehouseForm = await fetchWarehouseForm(id, current_sections);
  if (!warehouse) {
    return <h3 className="text-xs font-medium text-gray-400">Not found! id: {id}</h3>;
  }

  //#region Lock Document
  const readonly_permission = checkReadonly(userPermissions, warehouse, pageUser.id);
  const isEditable =
    !readonly_permission &&
    (warehouse.editing_by_user_id === null ||
      warehouse.editing_by_user_id === user.id ||
      (warehouse.editing_since && new Date(warehouse.editing_since) < new Date(Date.now() - 30 * 60 * 1000)));
  let canEdit = false;
  if (isEditable) {
    const lockResult = await tryLockRecord('warehouses', warehouse.id, user.id);
    canEdit = lockResult.isEditable;
  } else {
    canEdit = false;
  }
  const freshRecord = !readonly_permission
    ? await getFeshRecord('warehouses', warehouse.id)
    : { editing_by_user_id: '', editing_by_user_email: '', };
  const editingByCurrentUser = freshRecord.editing_by_user_id === user.id;
  const readonly = readonly_permission ? readonly_permission : !editingByCurrentUser;
  //#endregion

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Склад</h1>
        {readonly && (
          <span className="text-xs font-medium text-gray-400">
            только чтение для пользователя: {user?.email}
          </span>
        )}
        {!readonly && (
          <span className="text-xs font-medium text-gray-400">
            права на изменение для пользователя: {user?.email}
          </span>
        )}
        {(!readonly_permission && !editingByCurrentUser) && (
          <span className="text-xs font-medium text-gray-400">
            &nbsp;&nbsp;&nbsp;Редактируется пользователем: {freshRecord.editing_by_user_email}
          </span>
        )}
      </div>
      <h3 className="text-xs font-medium text-gray-400">id: {id}</h3>
      <DocWrapper
        pageUser={pageUser}
        userSections={sections}
        userPermissions={userPermissions}
        docTenantId={tenant_id}
      >
        <WarehouseEditForm
          warehouse={warehouse}
          lockedByUserId={null}
          unlockAction={unlockRecord}
          readonly={readonly}
        />
      </DocWrapper>
    </div>
  );
}

export default Page;