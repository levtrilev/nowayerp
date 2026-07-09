'use client';
import TabsSection from "./tabs-section";
import { useState } from "react";
import { Tenant, User, Section, UserForm, SectionForm } from '@/app/lib/definitions';
import { NewSection } from "./sections/lib/new-section";
import SectionsTable from "./sections/lib/sections-table";
import { NewTenant } from "./tenants/lib/new-tenant";
import TenantsTable from "./tenants/lib/tenants-table";
import { NewUser } from "./users/lib/new-user";
import UsersTable from "./users/lib/users-table";

interface ITabsPageProps {
    tenants: Tenant[],
    users: UserForm[],
    sections: SectionForm[],
    isSuperadmin: boolean,
    isAdmin: boolean,
}
export const TabsPage: React.FC<ITabsPageProps> = (props: ITabsPageProps) => {
    const [tab, setTab] = useState<string>('users');
    const handleSetTab = (value: string) => {
        setTab(value);
    };
    return (
        <>
            <TabsSection onClick={handleSetTab} activeTab={tab} />
            {tab === "tenants" &&
                <>
                    { props.isSuperadmin && <NewTenant />}
                    <TenantsTable tenants={props.tenants} superadmin={ props.isSuperadmin }/>
                </>
            }
            {(tab === 'users') &&
                <>
                    { (props.isSuperadmin || props.isAdmin) && <NewUser tenants={props.tenants} /> }
                    <UsersTable users={props.users} admin={ (props.isSuperadmin || props.isAdmin) }  allowDelete={true}/>
                </>
            }
            {tab === 'sections' &&
                <>
                    { (props.isSuperadmin || props.isAdmin) && <NewSection tenants={props.tenants} /> }
                    <SectionsTable sections={props.sections} admin={ (props.isSuperadmin || props.isAdmin) } tenants={props.tenants}/>
                </>
            }
        </>
    );
}

export default TabsPage;