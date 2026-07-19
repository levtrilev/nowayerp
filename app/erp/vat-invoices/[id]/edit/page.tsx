// VAT Invoice Page
import { lusitana } from "@/app/ui/fonts";
import { auth, getUser } from "@/auth";
import { getCurrentSections, getFeshRecord, tryLockRecord, unlockRecord } from "@/app/lib/common-actions";
import DocWrapper from "@/app/lib/doc-wrapper";
import { fetchDocUserPermissions } from "@/app/admin/permissions/lib/permissios-actions";
import { fetchSectionsForm } from "@/app/admin/sections/lib/sections-actions";
import { checkReadonly } from "@/app/lib/common-utils";
import { VATInvoiceForm } from "@/app/lib/definitions";
import VatInvoiceEditForm from "./vat-invoice-edit-form";
import { fetchVatInvoiceForm } from "../../lib/vat-invoice-actions";
import { fetchLegalEntitiesForm } from "@/app/erp/legal-entities/lib/legal-entities-actions";
import { fetchPersonsForm } from "@/app/erp/persons/lib/persons-actions";
import { fetchVatInvoiceGoodsForm } from "../../lib/vat-invoice-goods-actions";
import NotAuthorized, { isUserAuthorized } from "@/app/lib/not_authorized";
import { fetchGoodsForm } from "@/app/erp/goods/lib/goods-actions";
import { fetchWarehousesForm } from "@/app/erp/warehouses/lib/warehouses-actions";

async function Page(props: { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
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

  if (!isUserAuthorized(userPermissions, pageUser)) {
    return <NotAuthorized />
  }
   const params = await props.params;
   const id = params.id;
   
   const searchParams = await props.searchParams;
   const query = searchParams?.query || '';
   const currentPage = Number(searchParams?.page) || 1;
   //#endregion

  const invoice: VATInvoiceForm = await fetchVatInvoiceForm(id, current_sections);
  if (!invoice) {
    return <h3 className="text-xs font-medium text-gray-400">Not found! id: {id}</h3>;
  }

  const vat_invoice_goods = await fetchVatInvoiceGoodsForm(invoice.id, current_sections);

  //#region Lock Document
  const readonly_permission = checkReadonly(userPermissions, invoice, pageUser.id);
  // Пытаемся захватить документ, если имеем права на изменение
  const isEditable =
    !readonly_permission &&
    (invoice.editing_by_user_id === null ||
      invoice.editing_by_user_id === user.id ||
      (invoice.editing_since && new Date(invoice.editing_since) < new Date(Date.now() - 30 * 60 * 1000)));
  let canEdit = false;
  if (isEditable) {
    const lockResult = await tryLockRecord('vat_invoices', invoice.id, user.id);
    canEdit = lockResult.isEditable;
  } else {
    canEdit = false;
  }
  // Перечитываем запись после возможного обновления блокировки
  const freshRecord = !readonly_permission
    ? await getFeshRecord('vat_invoices', invoice.id)
    : { editing_by_user_id: '', editing_by_user_email: '', };
  const editingByCurrentUser = freshRecord.editing_by_user_id === user.id;
  const readonly = readonly_permission ? readonly_permission : !editingByCurrentUser;

  //#endregion

  const customers = readonly ? [] : await fetchLegalEntitiesForm(current_sections);
  const persons = readonly ? [] : await fetchPersonsForm(current_sections);
  const goods = readonly ? [] : await fetchGoodsForm(current_sections);
  const warehouses = readonly ? [] : await fetchWarehousesForm(current_sections);
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Счет-заказ</h1>
        {readonly && (
          <span className="text-xs font-medium text-gray-400">
            только чтение для пользователя: {user?.email}
          </span>
        )}
        {!readonly && invoice.ledger_record_id !== "00000000-0000-0000-0000-000000000000" && (
          <span className="text-xs font-medium text-blue-500">
            для редактирования необходимо отменить проведение документа
          </span>
        )}
        {!readonly && (
          <span className="text-xs font-medium text-gray-400">
            права на изменение для пользователя: {user?.email}
          </span>
        )}
        {!readonly && !editingByCurrentUser && freshRecord.editing_by_user_email && (
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
         <VatInvoiceEditForm
           invoice={invoice}
           lockedByUserId={freshRecord.editing_by_user_id}
           unlockAction={unlockRecord}
           readonly={readonly}
           customers={customers}
           persons={persons}
           goods={goods}
           warehouses={warehouses}
           vat_invoice_goods={vat_invoice_goods}
           pageUser={pageUser}
           query={query}
           currentPage={currentPage}
         />
       </DocWrapper>
    </div>
  );
}

export default Page;