import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { checkReadonly } from "@/app/lib/common-utils";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { LegalEntityForm } from "@/app/lib/definitions";
import LegalEntityEditForm from "../[id]/edit/legal-entity-edit-form";
// import { fetchRegionsForm } from "../../regions/lib/region-actions";
import { fetchCarsForm } from "../../cars/lib/cars-actions";
import { fetchRegionsForm } from "../../regions/lib/regions-actions";

export default async function Page() {
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
    const userPermissions = await fetchDocUserPermissions(user.id as string, 'legal_entities');
    const readonly_locked = false;
    //#endregion

    const legalEntity: LegalEntityForm = {
        id: "",
        name: "",         // Название:
        fullname: "",     // Полное:
        inn: "",          // ИНН:
        address_legal: "", // Юр.адрес:
        phone: "",        // Телефон:
        email: "",        // Email:
        contact: "",      // Контакт:
        is_customer: false, // Покупатель?
        is_supplier: false, // Поставщик?
        kpp: "",          // КПП:
        region_id: "",
        section_id: "",
        region_name: "",      // Регион:
        section_name: "",     // Раздел:
        access_tags: [],    // Теги доступа:
        user_tags: [],      // Теги:
        tenant_id: "",
        username: undefined,
        author_id: "",
        editor_id: "",
        timestamptz: undefined,
        date_created: undefined,
        editing_by_user_id: null,
        editing_since: null,
    } as LegalEntityForm;

    const readonly_permission = checkReadonly(userPermissions, legalEntity, pageUser.id);
    const readonly = readonly_locked || readonly_permission;
    const regions = readonly ? [] : await fetchRegionsForm(current_sections);
    const clients_cars = readonly ? [] : await fetchCarsForm(current_sections, legalEntity.id);
    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Юрлица', href: '/legal-entities' },
                    {
                        label: 'Создать новое',
                        href: '/legal-entities/create',
                        active: true,
                    },
                ]}
            />
            <div className="flex w-full items-center justify-between">
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
            </div>
            <DocWrapper
                pageUser={pageUser}
                userSections={sections}
                userPermissions={userPermissions}
                docTenantId={tenant_id}
            >
                <LegalEntityEditForm
                    legalEntity={legalEntity}
                    clients_cars={clients_cars}
                    readonly={readonly}
                    lockedByUserId={null}
                    unlockAction={null}
                    regions={regions}
                    current_sections={current_sections}
                />
            </DocWrapper>
        </main>
    );
}