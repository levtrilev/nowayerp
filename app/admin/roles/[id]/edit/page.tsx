
// Role edit page

import { fetchRoleForm } from "../../lib/roles-actions";
import { RoleForm, User, UserForm } from "@/app/lib/definitions";
import { lusitana } from "@/app/ui/fonts";
// import RoleEditForm from "./role-edit-form";
import { getCurrentSections, getRoleSections } from "@/app/lib/common-actions";
import { fetchTenantsAdmin, fetchTenantsSuperadmin } from "@/app/admin/tenants/lib/tenants-actions";
import { fetchSectionsForm, fetchSectionsFormAdmin, fetchSectionsFormSuperadmin } from "@/app/admin/sections/lib/sections-actions";
import { auth, getUser } from "@/auth";
import { fetchRolePermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { fetchUsersWithRoleAdmin } from "@/app/admin/users/lib/users-actions";
import StateWrap from "./state_wrap";

async function Page(props: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const email = session ? (session.user ? session.user.email : "") : "";
    const current_sections = await getCurrentSections(email as string);
    const user = await getUser(email as string);
    const isSuperadmin = user?.is_superadmin;
    const isAdmin = user?.is_admin;

    const params = await props.params;
    const id = params.id;
    const role: RoleForm = await fetchRoleForm(id);

    const role_sections = await getRoleSections(id);

    const sections = isSuperadmin ? await fetchSectionsFormSuperadmin()
        : isAdmin ? await fetchSectionsFormAdmin(role.tenant_id)
            : await fetchSectionsForm(current_sections);

    const tenants = isSuperadmin ? await fetchTenantsSuperadmin() : await fetchTenantsAdmin(role.tenant_id);
    // const role_permissions = isAdmin ? await fetchPermissionsAdmin(user.tenant_id, role.id) : [];
    const role_permissions = await fetchRolePermissions(role.tenant_id, role.id);
    const role_users = await fetchUsersWithRoleAdmin(role.id, role.tenant_id); // fetchRoleUsers(role.tenant_id, role.id);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Роль</h1>
            </div>
            <h3 className="text-xs font-medium text-gray-400">id: {id}</h3>
            <StateWrap
                role={role}
                role_sections={role_sections}
                tenants={tenants}
                userSections={sections}
                role_permissions={role_permissions}
                role_users={role_users} />
        </div>

    );
}

export default Page;
