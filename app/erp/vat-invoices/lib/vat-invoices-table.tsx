import { lusitana } from '@/app/ui/fonts';
import { VATInvoice } from '@/app/lib/definitions';
import { fetchFilteredVatInvoices } from './vat-invoice-actions';
import BtnDeleteVatInvoice from './btn-delete-vat-invoice';
import { BtnEditVatInvoiceLink } from './vat-invoice-buttons';

export default async function VatInvoicesTable({
  query,
  currentPage,
  current_sections,
  user_id,
  readonly_permission,
}: {
  query: string;
  currentPage: number;
  current_sections: string;
  user_id: string;
  readonly_permission: boolean;
}) {
  const vatInvoices = await fetchFilteredVatInvoices(query, currentPage, current_sections);

  return (
    <div className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              {/* Таблица для больших экранов */}
              <table className="table-fixed hidden w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Счет-заказ</th>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Дата</th>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Покупка/Продажа</th>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Контрагент</th>
                    <th scope="col" className="w-4/12 px-4 py-5 font-medium sm:pl-6">Склад</th>
                    <th scope="col" className="w-1/12 px-4 py-5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {vatInvoices.map((invoice) => (
                    <tr key={invoice.id} className="group">
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/vat-invoices/${invoice.id}/edit?query=${encodeURIComponent(query)}&page=${currentPage}`}
                          className="text-blue-800 underline"
                        >
                          {invoice.name}
                        </a>
                      </td>
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {new Date(invoice.date as string).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {invoice.trade_in_out === 'in' ? 'Покупка' : 'Продажа'}
                      </td>
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {invoice.customer_name}
                      </td>
                      <td className="w-4/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {invoice.warehouse_name}
                      </td>
                      <td className="w-1/12 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {!readonly_permission &&
                            <BtnDeleteVatInvoice
                              id={invoice.id}
                              name={invoice.name}
                              current_sections={current_sections}
                              user_id={user_id}
                              readonly_permission={readonly_permission}
                            />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Карточки для мобильных устройств */}
              <div className="md:hidden">
                {vatInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/erp/vat-invoices/${invoice.id}/edit?query=${encodeURIComponent(query)}&page=${currentPage}`}>
                          {invoice.name}
                        </a>
                      </h3>
                      <div className="flex gap-2">
                        <BtnEditVatInvoiceLink id={invoice.id} query={query} currentPage={currentPage} />
                        {!readonly_permission &&
                          <BtnDeleteVatInvoice
                            id={invoice.id}
                            name={invoice.name}
                            current_sections={current_sections}
                            user_id={user_id}
                            readonly_permission={readonly_permission}
                          />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}