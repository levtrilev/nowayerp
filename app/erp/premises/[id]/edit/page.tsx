
// LegalEntity Page

import { fetchPremiseForm } from "../../lib/premises-actions";
import { PremiseForm, User } from "@/app/lib/definitions";
import { lusitana } from "@/app/ui/fonts";
import { fetchSectionById, fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import PremiseEditForm from "./premise-edit-form";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import DocWrapper from "../../../../lib/doc-wrapper";
import { checkReadonly } from "@/app/lib/common-utils";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";
import { fetchLegalEntitiesForm } from "@/app/erp/legal-entities/lib/legal-entities-actions";
import { fetchRegionsForm } from "@/app/erp/regions/lib/regions-actions";

async function Page(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;

    const session = await auth();
    const session_user = session ? session.user : null;
    const email = session_user ? session_user.email : "";
    const current_sections = await getCurrentSections(email as string);

    const premise: PremiseForm = await fetchPremiseForm(id, current_sections);
    if (!premise) {
        return (<h3 className="text-xs font-medium text-gray-400">Not found! id: {id}</h3>);
    }
    const sections = await fetchSectionsForm(current_sections);
    const regions = await fetchRegionsForm(current_sections);
    const legalEntities = await fetchLegalEntitiesForm(current_sections);
    const tenant_id = (await fetchSectionById(premise.section_id)).tenant_id;
    const user = await getUser(email as string);
    const userPermissions = await fetchDocUserPermissions(user?.id as string, 'premises');

    const pageUser = user ? user : {} as User
    if (!isUserAuthorized(userPermissions, pageUser)) {
        return <NotAuthorized />
    }
    const readonly = checkReadonly(userPermissions, premise, pageUser.id);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Помещение</h1>
                {readonly && <span className="text-xs font-medium text-gray-400">только чтение для пользователя: {user?.email}</span>}
                {!readonly && <span className="text-xs font-medium text-gray-400">права на изменение для пользователя: {user?.email}</span>}
            </div>
            <h3 className="text-xs font-medium text-gray-400">id: {id}</h3>
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
        </div>

    );
}

export default Page;
