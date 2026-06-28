'use client';
import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';
import { getVatInvoiceGoodsStore } from '../../lib/store/vatInvoiceGoodsStoreRegistry';
import BtnGoodsRef from '@/app/erp/goods/lib/btn-goods-ref';
// import { fetchGoodsForm } from '@/app/erp/goods/lib/goods-actions';
import { GoodForm } from '@/app/lib/definitions';

const VatInvoiceGoodSchema = z.object({
  row_number: z.string().min(1, { message: "Номер строки обязателен" }),
  good_id: z.string().uuid({ message: "Выберите товар" }),
  good_name: z.string().min(1, { message: "Выберите товар" }),
  quantity: z.string().regex(/^\d+(\.\d{1,3})?$/, { message: "Кол-во: до 3 знаков после запятой" }),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Цена: до 2 знаков после запятой" }),
});

// type VatInvoiceGoodFormData = z.infer<typeof VatInvoiceGoodSchema>;

interface IVatInvoiceGoodsTableProps {
  readonly: boolean;
  onDocumentChanged: () => void;
  vatInvoiceId: string;
  sectionId: string;
  goods: GoodForm[];
}

export default function VatInvoiceGoodsTable({
  readonly,
  onDocumentChanged,
  vatInvoiceId,
  sectionId,
  goods
}: IVatInvoiceGoodsTableProps) {
  const useCurrentStore = getVatInvoiceGoodsStore(vatInvoiceId);
  const {
    vat_invoice_goods,
    addNewGood,
    deleteGood,
    markGoodForDeletion,
    unmarkGoodForDeletion,
    updateGoodField,
    setGoodFromRefBook,
    saveNewGoodsToDB,
    deleteMarkedGoodsFromDB,
  } = useCurrentStore();

  const [goodsList, setGoodsList] = useState<GoodForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadGoods = async () => {
      if (!readonly) {
        // const goods = await fetchGoodsForm(`{${sectionId}}`);
        setGoodsList(goods);
      }
    };
    loadGoods();
  }, [readonly, sectionId]);

  const handleAddRow = () => {
    const newRowNumber = String(vat_invoice_goods.filter(g => !g.isToBeDeleted).length + 1);
    addNewGood(newRowNumber);
    onDocumentChanged();
  };

  const handleSaveRow = (index: number) => {
    const good = vat_invoice_goods[index];
    const validationResult = VatInvoiceGoodSchema.safeParse({
      row_number: good.row_number,
      good_id: good.good_id,
      good_name: good.good_name,
      quantity: good.quantity,
      price: good.price,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const key in validationResult.error.formErrors.fieldErrors) {
        fieldErrors[`${index}-${key}`] = validationResult.error.formErrors.fieldErrors[key as keyof typeof validationResult.error.formErrors.fieldErrors]?.[0] || '';
      }
      setErrors(prev => ({ ...prev, ...fieldErrors }));
      return;
    }

    // Успешная валидация — выходим из режима редактирования
    updateGoodField(index, 'isEditing', false);
    // Автоматически пересчитываем amount
    const quantity = parseFloat(good.quantity) || 0;
    const price = parseFloat(good.price) || 0;
    const discount = parseFloat(good.discount) || 0;
    const amount = (quantity * price * (1 - discount / 100)).toFixed(2);
    updateGoodField(index, 'amount', amount);
    onDocumentChanged();
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}-row_number`];
      delete newErrors[`${index}-good_name`];
      delete newErrors[`${index}-quantity`];
      delete newErrors[`${index}-price`];
      return newErrors;
    });
  };

  const handleCancelEdit = (index: number) => {
    updateGoodField(index, 'isEditing', false);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}-row_number`];
      delete newErrors[`${index}-good_name`];
      delete newErrors[`${index}-quantity`];
      delete newErrors[`${index}-price`];
      return newErrors;
    });
  };

  const handleInputChange = (index: number, field: 'row_number' | 'quantity' | 'price' | 'discount', value: string) => {
    updateGoodField(index, field, value);
    // Очищаем ошибку при изменении
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}-${field}`];
      return newErrors;
    });
  };

  const handleSelectGood = (index: number, good_id: string, good_name: string, product_code: string, measure_unit: string, price_retail: number) => {
    setGoodFromRefBook(index, good_id, good_name, product_code, measure_unit, price_retail);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}-good_name`];
      return newErrors;
    });
  };

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Товары</h2>
            {!readonly && (
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
              >
                <PlusIcon className="h-4 w-4" />
                Добавить
              </button>
            )}
          </div>

          <table className="min-w-full divide-y divide-gray-200 text-gray-900">
            <thead>
              <tr>
                <th scope="col" className="py-2 px-2 text-left text-xs font-medium uppercase tracking-wide">№</th>
                <th scope="col" className="py-2 px-2 text-left text-xs font-medium uppercase tracking-wide">Артикул</th>
                <th scope="col" className="py-2 px-2 text-left text-xs font-medium uppercase tracking-wide">Товар</th>
                <th scope="col" className="py-2 px-2 text-left text-xs font-medium uppercase tracking-wide">Ед.изм.</th>
                <th scope="col" className="py-2 px-2 text-left text-xs font-medium uppercase tracking-wide">Кол-во</th>
                <th scope="col" className="py-2 px-2 text-left text-xs font-medium uppercase tracking-wide">Цена</th>
                <th scope="col" className="py-2 px-2 text-left text-xs font-medium uppercase tracking-wide">Скидка</th>
                <th scope="col" className="py-2 px-2 text-left text-xs font-medium uppercase tracking-wide">Сумма</th>
                <th scope="col" className="py-2 px-2 text-right text-xs font-medium uppercase tracking-wide">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {vat_invoice_goods
                .filter(g => !g.isToBeDeleted)
                .map((good, index) => (
                  <tr key={good.id || `new-${index}`}>
                    {good.isEditing ? (
                      <>
                        <td className="whitespace-nowrap py-2 px-2">
                          <input
                            type="text"
                            value={good.row_number}
                            onChange={(e) => handleInputChange(index, 'row_number', e.target.value)}
                            className="w-12 border rounded px-1"
                            disabled={readonly}
                          />
                          {errors[`${index}-row_number`] && (
                            <p className="text-red-600 text-xs mt-1">{errors[`${index}-row_number`]}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2 px-2">
                          <input
                            type="text"
                            value={good.product_code}
                            onChange={() => { }}
                            className="w-12 border rounded px-1"
                            disabled={true}
                          />
                        </td>
                        <td className="whitespace-nowrap py-2 px-2">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={good.good_name}
                              readOnly
                              className="border rounded px-1 flex-grow"
                            />
                            {!readonly && (
                              <BtnGoodsRef
                                handleSelectGood={(id, name, product_code, measure_unit, price) => handleSelectGood(index, id, name, product_code, measure_unit, price)}
                                goods={goodsList}
                              />
                            )}
                          </div>
                          {errors[`${index}-good_name`] && (
                            <p className="text-red-600 text-xs mt-1">{errors[`${index}-good_name`]}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2 px-2">
                          <input
                            type="text"
                            value={good.measure_unit}
                            onChange={() => { }}
                            className="w-12 border rounded px-1"
                            disabled={true}
                          />
                        </td>
                        <td className="whitespace-nowrap py-2 px-2">
                          <input
                            type="text"
                            value={good.quantity}
                            onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                            className="w-20 border rounded px-1"
                            disabled={readonly}
                          />
                          {errors[`${index}-quantity`] && (
                            <p className="text-red-600 text-xs mt-1">{errors[`${index}-quantity`]}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2 px-2">
                          <input
                            type="text"
                            value={good.price}
                            onChange={(e) => handleInputChange(index, 'price', e.target.value)}
                            className="w-20 border rounded px-1"
                            disabled={readonly}
                          />
                          {errors[`${index}-price`] && (
                            <p className="text-red-600 text-xs mt-1">{errors[`${index}-price`]}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2 px-2">
                          <input
                            type="text"
                            value={good.discount}
                            onChange={(e) => handleInputChange(index, 'discount', e.target.value)}
                            className="w-20 border rounded px-1"
                            disabled={readonly}
                          />
                          {errors[`${index}-discount`] && (
                            <p className="text-red-600 text-xs mt-1">{errors[`${index}-discount`]}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2 px-2">{good.amount}</td>
                        <td className="whitespace-nowrap py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(index)}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelEdit(index)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="whitespace-nowrap py-2 px-2">{good.row_number}</td>
                        <td className="whitespace-nowrap py-2 px-2">{good.product_code}</td>
                        <td className="whitespace-nowrap py-2 px-2">{good.good_name}</td>
                        <td className="whitespace-nowrap py-2 px-2">{good.measure_unit}</td>
                        <td className="whitespace-nowrap py-2 px-2">{good.quantity}</td>
                        <td className="whitespace-nowrap py-2 px-2">{good.price}</td>
                        <td className="whitespace-nowrap py-2 px-2">{good.discount+' %'}</td>
                        <td className="whitespace-nowrap py-2 px-2">{good.amount}</td>
                        <td className="whitespace-nowrap py-2 px-2 text-right">
                          {!readonly && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateGoodField(index, 'isEditing', true)}
                                className="text-blue-600 hover:text-blue-900 mr-2"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => markGoodForDeletion(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}