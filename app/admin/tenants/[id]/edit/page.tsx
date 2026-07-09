
// tenant Page

import TenantEditForm from "./tenant-edit-form";
import { fetchTenantById } from "../../lib/tenants-actions";
import { Tenant, User } from "@/app/lib/definitions";
import { lusitana } from "@/app/ui/fonts";
import { auth, getUser } from "@/auth";
import UsersTable from "@/app/admin/users/lib/users-table";
import { getTenantUsers, useTenantUsers } from "../../store/use-tenant-store";
import { fetchUsersAdmin } from "@/app/admin/users/lib/users-actions";

async function Page(props: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const email = session ? (session.user ? session.user.email : "") : "";
    // const current_sections = await getCurrentSections(email as string);
    const current_user = await getUser(email as string) as User;
    const isSuperadmin = current_user.is_superadmin;
    const isAdmin = current_user.is_admin;

    const params = await props.params;
    const id = params.id;
    const tenant: Tenant = await fetchTenantById(id);
    const tenantUsers = await fetchUsersAdmin(id);
    // const tenantUsers = useTenantUsers();
    // getTenantUsers(id);
    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Организация</h1>
            </div>
            <h3 className="text-xs font-medium text-gray-400">id: {id}</h3>
            <TenantEditForm tenant={tenant} admin={ isAdmin || isSuperadmin } />
            {/* <TenantsTable tenants={tenants} superadmin={isSuperadmin} /> */}
            <UsersTable users={tenantUsers} admin={false}  allowDelete={true}/>
        </div>

    );
}

export default Page;
