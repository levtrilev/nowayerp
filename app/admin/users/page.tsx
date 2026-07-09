
// users Page

'use server';
import UsersTable from "./lib/users-table";
import { User, Tenant, UserForm } from '@/app/lib/definitions';
import { NewUser } from "./lib/new-user";
import { lusitana } from "@/app/ui/fonts";
import { fetchUsersAdmin, fetchUsersSuperadmin, fetchUsersUser } from "./lib/users-actions";
import { fetchTenantsAdmin, fetchTenantsSuperadmin } from "../tenants/lib/tenants-actions";
import { auth, getUser } from "@/auth";

async function Page() {
    const session = await auth();
    const email = session ? (session.user ? session.user.email : "") : "";
    // const current_sections = await getCurrentSections(email as string);
    const user = await getUser(email as string) as User;
    const isSuperadmin = user.is_superadmin;
    const isAdmin = user.is_admin;

        const users: UserForm[] = isSuperadmin ? await fetchUsersSuperadmin()
            : isAdmin ? await fetchUsersAdmin(user.tenant_id)
                : await fetchUsersUser(email as string);

    // const users: User[] = await fetchUsers();
    // const tenants: Tenant[] = await fetchTenants();

    const tenants: Tenant[] = isSuperadmin ? await fetchTenantsSuperadmin()
    : await fetchTenantsAdmin(user.tenant_id);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Пользователи</h1>
            </div>
            { (isSuperadmin || isAdmin) && <NewUser tenants={tenants} /> }
            <UsersTable users={users} admin={isSuperadmin || isAdmin}  allowDelete={true}/>
        </div>
    );
}

export default Page;