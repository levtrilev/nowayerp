import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { auth, getUser } from "@/auth";
import { getCurrentSections } from "@/app/lib/common-actions";
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { checkReadonly } from "@/app/lib/common-utils";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { VATInvoiceForm } from "@/app/lib/definitions";
import VatInvoiceEditForm from "../[id]/edit/vat-invoice-edit-form";
import { fetchLegalEntitiesForm } from "../../legal-entities/lib/legal-entities-actions";
import { fetchPersonsForm } from "@/app/erp/persons/lib/persons-actions";
import { fetchGoodsForm } from "../../goods/lib/goods-actions";
import { fetchWarehousesForm } from "../../warehouses/lib/warehouses-actions";
// import { fetchPersonsForm } from "../../persons/lib/persons-actions";

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
  const userPermissions = await fetchDocUserPermissions(user.id as string, 'vat_invoices');
  const readonly_locked = false;
  //#endregion

  const invoice: VATInvoiceForm = {
    id: "",
    ledger_record_id: "00000000-0000-0000-0000-000000000000",
    name: "",
    date: null,
    number: null,
    description: null,
    customer_id: "",
    customer_name: "",
    our_legal_entity_id: "00000000-0000-0000-0000-000000000000",
    our_legal_entity_name: "",
    trade_in_out: "out",
    warehouse_id: "00000000-0000-0000-0000-000000000000",
    warehouse_name: "",
    amount_incl_vat: 0,
    amount_excl_vat: 0,
    vat_rate: 0,
    vat_amount: 0,
    doc_status: "draft",
    approved_date: null,
    approved_by_person_id: null,
    approved_by_person_name: null,
    accepted_date: null,
    accepted_by_person_id: null,
    accepted_by_person_name: null,
    section_id: "",
    section_name: "",
    tenant_id: "",
    username: "",
    author_id: pageUser.id,
    editor_id: pageUser.id,
    timestamptz: "",
    date_created: new Date(),
    editing_by_user_id: null,
    editing_since: null,
    access_tags: null,
    user_tags: null,
  };

  const readonly_permission = checkReadonly(userPermissions, invoice, pageUser.id);
  const readonly = readonly_locked || readonly_permission;
  const customers = readonly ? [] : await fetchLegalEntitiesForm(current_sections);
  const persons = readonly ? [] : await fetchPersonsForm(current_sections);
  const goods = readonly ? [] : await fetchGoodsForm(current_sections);
  const warehouses = readonly ? [] : await fetchWarehousesForm(current_sections);
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Счета-фактуры', href: '/repair/vat-invoices' },
          { label: 'Создать новый', href: '/repair/vat-invoices/create', active: true },
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
        <VatInvoiceEditForm
          invoice={invoice}
          lockedByUserId={null}
          unlockAction={null}
          readonly={readonly}
          customers={customers}
          persons={persons}
          vat_invoice_goods={null}
          goods={goods}
          warehouses={warehouses}
        />
      </DocWrapper>
    </main>
  );
}