
// LegalEntity Page

import EditForm from "./tsch-edit-form";
import { TaskScheduleForm, User } from "@/app/lib/definitions";
import { lusitana } from "@/app/ui/fonts";
import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { fetchLegalEntitiesForm } from "@/app/erp/legal-entities/lib/legal-entities-actions";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import { fetchPremiseForm, fetchPremisesForm } from "@/app/erp/premises/lib/premises-actions";
import TaskScheduleEditForm from "./tsch-edit-form";
import { fetchTaskScheduleForm } from "../../lib/tsch-actions";
import { fetchScheduleTasksForm, fetchTasksForm } from "@/app/erp/tasks/lib/task-actions";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";

async function Page(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;

    const session = await auth();
    const session_user = session ? session.user : null;
    if (!session_user || !session_user.email) return (<h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>);
    const email = session_user.email;
    const user = await getUser(email as string);
    if (!user) return (<h3 className="text-xs font-medium text-gray-400">Вы не авторизованы!</h3>);
    const pageUser = user ? user : {} as User;
    const current_sections = await getCurrentSections(email as string);

    const taskSchedule: TaskScheduleForm = await fetchTaskScheduleForm(id, current_sections);
    if (!taskSchedule) {
        return (<h3 className="text-xs font-medium text-gray-400">Not found! id: {id}</h3>);
    }
    const sections = await fetchSectionsForm(current_sections);
    const premises = await fetchPremisesForm(current_sections);
    const legalEntities = await fetchLegalEntitiesForm(current_sections);
    const tasks = await fetchScheduleTasksForm(id);

    // const tenant_id = (await fetchSectionById(taskSchedule.section_id)).tenant_id;
    const tenant_id = pageUser.tenant_id;
    const userPermissions = await fetchDocUserPermissions(user?.id as string, 'task_schedules');
    if (!isUserAuthorized(userPermissions, pageUser)) {
        return <NotAuthorized />
    }
    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>План обслуживания</h1>
            </div>
            <h3 className="text-xs font-medium text-gray-400">id: {id}</h3>

            <DocWrapper
                pageUser={pageUser}
                userSections={sections}
                userPermissions={userPermissions}
                docTenantId={tenant_id}
            >
                <TaskScheduleEditForm
                    taskSchedule={taskSchedule}
                    premises={premises}
                    legalEntities={legalEntities}
                    tasks={tasks}
                />
            </DocWrapper>
        </div>

    );
}

export default Page;
