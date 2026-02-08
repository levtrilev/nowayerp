import { lusitana } from "@/app/ui/fonts";
import { auth, getUser } from "@/auth";
import { getCurrentSections, getFeshRecord, tryLockRecord, unlockRecord } from "@/app/lib/common-actions";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { checkReadonly } from "@/app/lib/common-utils";
import { LegalEntityForm } from "@/app/lib/definitions";
import { fetchLegalEntityForm } from "../../lib/legal-entities-actions";
import LegalEntityEditForm from "./legal-entity-edit-form";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";
import { fetchRegionsForm } from "@/app/erp/regions/lib/region-actions";
import { fetchCarsForm } from "@/app/erp/cars/lib/cars-actions";

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
    const userPermissions = await fetchDocUserPermissions(user.id, 'legal_entities');
    if (!isUserAuthorized(userPermissions, pageUser)) {
        return <NotAuthorized />
    }
    const params = await props.params;
    const id = params.id;
    //#endregion

    const legalEntity: LegalEntityForm = await fetchLegalEntityForm(id, current_sections);
    if (!legalEntity) {
        return <h3 className="text-xs font-medium text-gray-400">Not found! id: {id}</h3>;
    }

    //#region Lock Document
    const readonly_permission = checkReadonly(userPermissions, legalEntity, pageUser.id);
    const isEditable =
        !readonly_permission &&
        (legalEntity.editing_by_user_id === null ||
            legalEntity.editing_by_user_id === user.id ||
            (legalEntity.editing_since && new Date(legalEntity.editing_since) < new Date(Date.now() - 30 * 60 * 1000)));
    let canEdit = false;
    if (isEditable) {
        const lockResult = await tryLockRecord('legal_entities', legalEntity.id, user.id);
        canEdit = lockResult.isEditable;
    } else {
        canEdit = false;
    }
    const freshRecord = !readonly_permission
        ? await getFeshRecord('legal_entities', legalEntity.id)
        : { editing_by_user_id: '', editing_by_user_email: '', };
    const editingByCurrentUser = freshRecord.editing_by_user_id === user.id;
    const readonly = readonly_permission ? readonly_permission : !editingByCurrentUser;
    //#endregion
    const regions = readonly ? [] : await fetchRegionsForm(current_sections);
    const clients_cars = readonly ? [] : await fetchCarsForm(current_sections, legalEntity.id);
    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Юридическое лицо</h1>
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
                <LegalEntityEditForm
                    legalEntity={legalEntity}
                    clients_cars={clients_cars}
                    lockedByUserId={null}
                    unlockAction={unlockRecord}
                    readonly={readonly}
                    regions={regions}
                />
            </DocWrapper>
        </div>
    );
}

export default Page;