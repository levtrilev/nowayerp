'use client';
import { useEffect, useState } from "react";
import {
    GoodForm,
    InOutType,
    LedgerRecord,
    LegalEntityForm,
    PersonForm,
    StockMovement,
    VATInvoiceForm,
    VatInvoiceGoodsForm,
    WarehouseForm,
} from "@/app/lib/definitions";
import { formatDateForInput, utcISOToLocalDateTimeInput } from "@/app/lib/common-utils";
import BtnSectionsRef from "@/app/admin/sections/lib/btn-sections-ref";
import { z } from "zod";
import { pdf } from '@react-pdf/renderer';
import MessageBoxOKCancel from "@/app/lib/message-box-ok-cancel";
import {
    setIsCancelButtonPressed,
    setIsDocumentChanged,
    setIsMessageBoxOpen,
    setIsOKButtonPressed,
    setIsShowMessageBoxCancel,
    setMessageBoxText,
    useDocumentStore,
    useIsDocumentChanged,
    useMessageBox
} from "@/app/store/useDocumentStore";
import InputField from "@/app/lib/input-field";
import { useRouter } from "next/navigation";
import { createVatInvoice, updateVatInvoice } from "../../lib/vat-invoice-actions";
import BtnLegalEntitiesRef from "@/app/erp/legal-entities/lib/btn-legal-entities-ref";
import BtnPersonsRef from "@/app/erp/persons/lib/btn-persons-ref";
import VatInvoiceGoodsTable from "./vat-invoice-goods-table";
import { getVatInvoiceGoodsStore, destroyVatInvoiceGoodsStore } from "../../lib/store/vatInvoiceGoodsStoreRegistry";
import { fetchPersonByUser } from "@/app/repair/claims/lib/claims-actions";
import VatInvoicePdfDocument from "./vat-invoice-pdf-document";
import CreateStockMovementButton from "@/app/ledger/stock/movements/create/page";
import { createStockMovement, createStockMovements, deleteLedgerRecordWithMovements, getPeriodByDate } from "@/app/ledger/stock/lib/stock-actions";
import BtnWarehousesRef from "@/app/erp/warehouses/lib/btn-warehouses-ref";
import { TradeInOutToggle } from "@/app/lib/trade-inout-toggle";

interface IEditFormProps {
    invoice: VATInvoiceForm;
    lockedByUserId: string | null;
    unlockAction: ((tableName: string, id: string, userId: string) => Promise<void>) | null;
    readonly: boolean;
    customers: LegalEntityForm[];
    persons: PersonForm[];
    vat_invoice_goods: VatInvoiceGoodsForm[] | null;
    goods: GoodForm[];
    warehouses: WarehouseForm[];
    pageUser?: any;
    query?: string;
    currentPage?: number;
}

const DocStatusSchema = z.enum(['draft', 'active', 'deleted']);
const inOutTypeSchema = z.enum(['in', 'out']);
const VatInvoiceFormSchemaFull = z.object({
    id: z.string().uuid(),
    ledger_record_id: z.string().uuid(),
    name: z.string().min(2, {
        message: "Название должно содержать не менее 2-х символов.",
    }),
    number: z.string().nullable(),
    // date: z.date({
    //     required_error: "Поле Дата должно быть заполнено.",
    //     invalid_type_error: "Поле Дата должно быть датой.",
    // }).nullable(),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверный формат даты')
        .nullable()
        .refine((val) => val !== null, {
            message: 'Дата документа не указана',
        })
        .refine((s) => !isNaN(Date.parse(s)), 'Некорректная дата'),
    description: z.string().nullable(),
    customer_id: z.string().uuid(),
    customer_name: z.string().min(1, {
        message: "Поле Контрагент должно быть заполнено.",
    }),
    our_legal_entity_id: z.string().uuid(),
    our_legal_entity_name: z.string(),
    trade_in_out: inOutTypeSchema.default('out'),
    warehouse_id: z.string().uuid(),
    warehouse_name: z.string().min(1, {
        message: "Поле Склад должно быть заполнено.",
    }),
    amount_incl_vat: z.number(),
    amount_excl_vat: z.number(),
    vat_rate: z.number(),
    vat_amount: z.number(),
    doc_status: DocStatusSchema.default('draft'),
    approved_date: z.string().optional().nullable(),
    approved_by_person_id: z.string().uuid().nullable(),
    approved_by_person_name: z.string().nullable(),
    accepted_date: z.string().optional().nullable(),
    accepted_by_person_id: z.string().uuid().nullable(),
    accepted_by_person_name: z.string().nullable(),
    section_id: z.string().uuid(),
    section_name: z.string().min(1, {
        message: "Поле Раздел должно быть заполнено.",
    }),
    tenant_id: z.string().uuid(),
    username: z.string().optional(),
    author_id: z.string().uuid(),
    editor_id: z.string().uuid(),
    timestamptz: z.string().optional(),
    date_created: z.date(),
    editing_by_user_id: z.string().nullable(),
    editing_since: z.string().nullable(),
    access_tags: z.array(z.string()).nullable(),
    user_tags: z.array(z.string()).nullable(),
});

const VatInvoiceFormSchema = VatInvoiceFormSchemaFull.omit({
    id: true,
    timestamptz: true,
    username: true,
    editing_by_user_id: true,
    editing_since: true,
    amount_incl_vat: true,
    amount_excl_vat: true,
    vat_rate: true,
    vat_amount: true,
    // approved_date: true,
    approved_by_person_id: true,
    approved_by_person_name: true,
    // accepted_date: true,
    accepted_by_person_id: true,
    accepted_by_person_name: true,
    date_created: true,
    access_tags: true,
    user_tags: true,
});

export type FormData = z.infer<typeof VatInvoiceFormSchemaFull>;

export default function VatInvoiceEditForm(props: IEditFormProps) {
    const userSections = useDocumentStore.getState().userSections;
    const sessionUser = useDocumentStore.getState().sessionUser;
    const docTenantId = useDocumentStore.getState().documentTenantId;
    const sessionUserId = sessionUser.id;
    const [showErrors, setShowErrors] = useState(false);
    const isDocumentChanged = useIsDocumentChanged();
    const msgBox = useMessageBox();
    const router = useRouter();

    const docChanged = () => {
        setIsDocumentChanged(true);
        setMessageBoxText('Документ изменен. Закрыть без сохранения?');
    };

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        ...props.invoice,
        date: props.invoice.date ?? '',
        date_created: props.invoice.date_created ?? new Date(),
        approved_date: props.invoice.approved_date ?? '',
    });

    const useCurrentVatInvoiceGoodsStore = getVatInvoiceGoodsStore(formData.id);
    const {
        vat_invoice_goods,
        saveNewGoodsToDB,
        deleteMarkedGoodsFromDB,
        setInitialGoods,
    } = useCurrentVatInvoiceGoodsStore();
    type VatInvoiceGoodItem = typeof vat_invoice_goods[number];
    useEffect(() => {
        return () => {
            destroyVatInvoiceGoodsStore(formData.id);
        };
    }, [formData.id]);

    useEffect(() => {
        if (props.vat_invoice_goods) {
            setInitialGoods(
                props.vat_invoice_goods.map(g => ({
                    id: g.id,
                    row_number: g.row_number,
                    good_id: g.good_id,
                    good_name: g.good_name,
                    product_code: g.product_code,
                    brand: g.brand,
                    measure_unit: g.measure_unit,
                    quantity: String(g.quantity),
                    price: String(g.price),
                    discount: String(g.discount),
                    amount: String(g.amount),
                    isEditing: false,
                    isToBeDeleted: false,
                }))
            );
        }
    }, [props.vat_invoice_goods, useCurrentVatInvoiceGoodsStore]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            author_id: sessionUserId,
            editor_id: '00000000-0000-0000-0000-000000000000',
            tenant_id: docTenantId,
        }));
    }, []);

    // Эффект для обработки закрытия сообщения "Документ сохранен" - возврат на список с сохранением параметров
    useEffect(() => {
        if (msgBox.isOKButtonPressed && msgBox.messageBoxText === 'Документ сохранен.' && !msgBox.isMessageBoxOpen) {
            setIsOKButtonPressed(false);
            // Preserve search params (page, query) when navigating back
            const urlParams = new URLSearchParams(window.location.search);
            const queryParams = urlParams.toString();
            const queryString = queryParams ? '?' + queryParams : '';
            // Временно отключаем эффект при первом рендере формы
            // Эффект срабатывает только после нажатия OK на сообщении "Документ сохранен"
            // Навигация с сохранением параметров страницы
            router.push(`/erp/vat-invoices${queryString}`);
        }
    }, [msgBox.isOKButtonPressed, msgBox.messageBoxText, msgBox.isMessageBoxOpen, router]);

    const validate = () => {
        const res = VatInvoiceFormSchema.safeParse(formData);
        if (res.success) {
            return undefined;
        }
        return res.error.format();
    };
    const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors = validate();
        if (errors) {
            setShowErrors(true);
            return;
        }

        try {
            if (formData.id === "") {
                await createVatInvoice(formData);
                // revalidatePath в createVatInvoice уже вызывается
            } else {
                await Promise.all([
                    updateVatInvoice(formData),
                    deleteMarkedGoodsFromDB(),
                    saveNewGoodsToDB(formData.id, formData.section_id),
                ]);
                // revalidatePath в updateVatInvoice уже вызывается
            }
            setIsDocumentChanged(false);
            setMessageBoxText('Документ сохранен.');
        } catch (error) {
            setMessageBoxText('Документ не сохранен! :' + String(error));
        }
        setIsShowMessageBoxCancel(false);
        setIsMessageBoxOpen(true);
    };

    const handleBackClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (props.unlockAction) await props.unlockAction("vat_invoices", props.invoice.id, sessionUserId);
        if (isDocumentChanged && !msgBox.isOKButtonPressed) {
            setIsShowMessageBoxCancel(true);
            setIsMessageBoxOpen(true);
        } else if (!isDocumentChanged) {
            // Preserve search params (page, query) when navigating back
            setIsOKButtonPressed(false); // сброс флага, чтобы эффект не сработал дважды
            const urlParams = new URLSearchParams();
            if (props.currentPage && props.currentPage > 1) urlParams.set('page', props.currentPage.toString());
            if (props.query) urlParams.set('query', props.query);
            const queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
            router.push(`/erp/vat-invoices${queryString}`);
        }
    };

    const handleShowPDF = async () => {
        try {
            const blob = await pdf(<VatInvoicePdfDocument formData={formData} goods={vat_invoice_goods} />).toBlob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (error) {
            console.error('Ошибка при экспорте PDF:', error);
        }
    };
    const handleSelectSection = (new_section_id: string, new_section_name: string, new_section_tenant_id: string) => {
        setFormData((prev) => ({
            ...prev,
            section_id: new_section_id,
            section_name: new_section_name,
            tenant_id: new_section_tenant_id,
        }));
        useDocumentStore.getState().setDocumentTenantId(new_section_tenant_id);
        docChanged();
    };

    const handleSelectCustomer = (new_customer_id: string, new_customer_name: string) => {
        setFormData((prev) => ({
            ...prev,
            customer_id: new_customer_id,
            customer_name: new_customer_name,
        }));
        docChanged();
    };
    const handleSelectOurLegalEntity = (new_our_legal_entity_id: string, new_our_legal_entity_name: string) => {
        setFormData((prev) => ({
            ...prev,
            our_legal_entity_id: new_our_legal_entity_id,
            our_legal_entity_name: new_our_legal_entity_name,
        }));
        docChanged();
    };
    const handleSelectWarehouse = (new_warehouse_id: string, new_warehouse_name: string) => {
        setFormData((prev) => ({
            ...prev,
            warehouse_id: new_warehouse_id,
            warehouse_name: new_warehouse_name,
        }));
        docChanged();
    }
    const handleSelectApprovedPerson = (new_person_id: string, new_person_name: string) => {
        setFormData((prev) => ({
            ...prev,
            approved_by_person_id: new_person_id,
            approved_by_person_name: new_person_name,
        }));
        docChanged();
    };

    const handleSelectAcceptedPerson = (new_person_id: string, new_person_name: string) => {
        setFormData((prev) => ({
            ...prev,
            accepted_by_person_id: new_person_id,
            accepted_by_person_name: new_person_name,
        }));
        docChanged();
    };

    const handleInputChange = (field: string, value: string | Date | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        docChanged();
    };
    const handleDateChange = (value: string) => {
        setFormData((prev) => ({ ...prev, date: value }));
        docChanged();
    };
    const handleSetAccepted = async () => {
        const accepted_by_person = await fetchPersonByUser(sessionUser.id, userSections.map((s) => s.id));

        setFormData((prev) => ({
            ...prev,
            accepted_date: (function () {
                const d = new Date();
                return d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0') + 'T' +
                    String(d.getHours()).padStart(2, '0') + ':' +
                    String(d.getMinutes()).padStart(2, '0');
            })(),

            accepted_by_person_id: accepted_by_person ? accepted_by_person.id : '00000000-0000-0000-0000-000000000000',
            accepted_by_person_name: accepted_by_person ? accepted_by_person.name : sessionUser.name,
        }));
        docChanged();
    }
    const handleSetApproved = async () => {
        const approved_by_person = await fetchPersonByUser(sessionUser.id, userSections.map((s) => s.id));

        setFormData((prev) => ({
            ...prev,
            approved_date: (function () {
                const d = new Date();
                return d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0') + 'T' +
                    String(d.getHours()).padStart(2, '0') + ':' +
                    String(d.getMinutes()).padStart(2, '0');
            })(),

            approved_by_person_id: approved_by_person ? approved_by_person.id : '00000000-0000-0000-0000-000000000000',
            approved_by_person_name: approved_by_person ? approved_by_person.name : sessionUser.name,
        }));
        docChanged();
    }
    const errors = showErrors ? validate() : undefined;
    const handleCreateDeleteStockMovements = async (vat_invoice_goods: VatInvoiceGoodItem[], formData: FormData) => {
        if (formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000') {
            try {
                const deleteResult = await deleteLedgerRecordWithMovements(formData.ledger_record_id, formData.id);
                if (!deleteResult.success) {
                    alert(deleteResult.message);
                    return;
                } else {
                    setFormData({ ...formData, ledger_record_id: '00000000-0000-0000-0000-000000000000' });
                    setMessageBoxText('Документ распроведен.');
                }
            } catch (error) {
                setMessageBoxText('Документ не распроведен! :' + String(error));
            }
            setIsShowMessageBoxCancel(false);
            setIsMessageBoxOpen(true);
            return;
        }
        const period = await getPeriodByDate(new Date(formData.date));
        if (!period) {
            alert('Период не определен!');
            return;
        }
        const ledgerRecord: LedgerRecord = {
            id: '00000000-0000-0000-0000-000000000000',
            doc_id: formData.id,
            doc_type: 'vat_invoice',
            section_id: formData.section_id,
            tenant_id: formData.tenant_id,
            record_date: formData.date,
            record_text: formData.description ?? formData.trade_in_out === 'out' ? 'Реализация товаров и услуг' : 'Закупка товаров',
        };
        const stockMovements: StockMovement[] = [];
        const newGoods = vat_invoice_goods.filter(
            (g) => !g.id.startsWith('temp-') && g.id.length < 36 // предполагаем, что временные ID не UUID
        );

        for (const vat_invoice_good of vat_invoice_goods.filter((g) => !g.isToBeDeleted)) {
            const stockMovement: StockMovement = {
                id: '00000000-0000-0000-0000-000000000000',
                doc_id: formData.id,
                doc_type: ledgerRecord.doc_type,
                section_id: ledgerRecord.section_id,
                tenant_id: ledgerRecord.tenant_id,
                record_date: ledgerRecord.record_date,
                record_text: ledgerRecord.record_text,
                good_id: vat_invoice_good.good_id,
                user_id: useDocumentStore.getState().sessionUser.id,
                period_id: period.id,
                record_in_out: formData.trade_in_out,
                quantity: parseFloat(vat_invoice_good.quantity),
                amount: parseFloat(vat_invoice_good.amount),
                warehouse_id: formData.warehouse_id,
                editing_by_user_id: null,
                editing_since: null,
                movement_status: 'active',
            };
            stockMovements.push(stockMovement);
        }
        try {
            //   if (formData.id === 'new') {
            const res = await createStockMovements(ledgerRecord, stockMovements);
            if (res.success) setFormData({ ...formData, ledger_record_id: res.ledgerId });
            // setTimeout(() => {
            //   router.push('/ledger/stock');
            // }, 2000);
            //   } else {
            //     const res = await updateStockMovement(data);
            //   }
            //   setIsDocumentChanged(false);
            setMessageBoxText('Документ проведен.');
        } catch (error) {
            setMessageBoxText('Документ не проведен! :' + String(error));
        }
        setIsShowMessageBoxCancel(false);
        setIsMessageBoxOpen(true);
    };

    return (
        <div>
            {!pdfUrl && (
                <form id="vat-invoice-form" onSubmit={handleSubmit} className="flex flex-col gap-4 pb-24">
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        {/* первая колонка */}
                        <div className="flex flex-col gap-4 w-full md:w-1/2">
                            <div className="flex flex-1 justify-between">
                                {/* number */}
                                <InputField
                                    name="number"
                                    value={formData.number || ""}
                                    label="Номер:"
                                    type="text"
                                    w={["w-4/16", "w-13/16"]}
                                    onChange={(value) => handleInputChange('number', value)}
                                    readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                    errors={errors?.number?._errors as string[] | undefined}
                                />
                                <TradeInOutToggle
                                    value={formData.trade_in_out}
                                    onChange={(value) => { handleInputChange('trade_in_out', value); docChanged() }}
                                    readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                    size="md"
                                />
                            </div>
                            {/* date */}
                            <div className="flex-2 flex items-center">
                                <label
                                    htmlFor="date"
                                    className="w-5/16 text-sm text-blue-900 font-medium flex items-center p-2 pl-2"
                                >Дата:</label>
                                <input
                                    name="date"
                                    value={formData.date ?? ''}
                                    type="date"
                                    className="w-5/16 disabled:text-gray-400 disabled:bg-gray-100 break-words control rounded-md border border-gray-200 p-2"
                                    onChange={(e) => handleDateChange(String(e.target.value))}
                                    disabled={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                />
                                {/* Блок с выводом ошибок */}
                                <div id={"date-error"} aria-live="polite" aria-atomic="true">
                                    {errors &&
                                        errors?.date?._errors.map((error, index) => (
                                            <p className="mt-2 text-xs text-red-500" key={index}>
                                                {error}
                                            </p>
                                        ))}
                                </div>
                            </div>
                            {/* customer_name */}
                            <InputField
                                name="customer_name"
                                value={formData.customer_name}
                                label="Контрагент:"
                                type="text"
                                w={["w-6/16", "w-11/16"]}
                                onChange={() => { }}
                                refBook={<BtnLegalEntitiesRef handleSelectLegalEntity={handleSelectCustomer} legalEntities={props.customers} elementIdPrefix="customer" />}
                                readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                errors={errors?.customer_name?._errors as string[] | undefined}
                            />
                            {/* warehouse_name */}
                            <InputField
                                name="warehouse_name"
                                value={formData.warehouse_name}
                                label="Склад:"
                                type="text"
                                w={["w-6/16", "w-11/16"]}
                                onChange={() => { }}
                                refBook={<BtnWarehousesRef handleSelectWarehouse={handleSelectWarehouse} warehouses={props.warehouses} />}
                                readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                errors={errors?.warehouse_name?._errors as string[] | undefined}
                            />
                            {/* SetApprovedButton & approved_date */}
                            <div className="flex justify-between h-1/4 md:w-full">

                                {!props.readonly && <button
                                    type="button"
                                    onClick={() => handleSetApproved()}
                                    disabled={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                    className={`w-10/16 h-10 mt-1 rounded-md border p-2 ${(props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000')
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-400 text-white hover:bg-blue-100 hover:text-gray-500 cursor-pointer'
                                        }`}
                                >
                                    Проверил
                                </button>}
                                {/* approved_date */}
                                <InputField name="approved_date" value={utcISOToLocalDateTimeInput(formData.approved_date)}
                                    label="" type="datetime-local" w={["w-1/16", "w-16/16"]}
                                    onChange={(value) => handleInputChange('approved_date', String(value))}
                                    readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                    errors={errors?.approved_date?._errors as string[] | undefined}
                                />
                            </div>
                            {/* approved_by_person_name */}
                            <InputField
                                name="approved_by_person_name"
                                value={formData.approved_by_person_name || ""}
                                label="Проверил:"
                                type="text"
                                w={["w-6/16", "w-11/16"]}
                                onChange={() => { }}
                                refBook={<BtnPersonsRef handleSelectPerson={handleSelectApprovedPerson} persons={props.persons} />}
                                readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                            />
                        </div>

                        {/* вторая колонка */}
                        <div className="flex flex-col gap-4 w-full md:w-1/2">
                            {/* name */}
                            <InputField
                                name="name"
                                value={formData.name}
                                label="Название:"
                                type="text"
                                w={["w-4/16", "w-13/16"]}
                                onChange={(value) => handleInputChange('name', value)}
                                readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                errors={errors?.name?._errors as string[] | undefined}
                            />
                            {/* description */}
                            <InputField
                                name="description"
                                value={formData.description ?? "Реализация товаров и услуг"}
                                label="Описание:"
                                type="text"
                                w={["w-4/16", "w-13/16"]}
                                onChange={(value) => handleInputChange('description', value)}
                                readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                errors={errors?.description?._errors as string[] | undefined}
                            />
                            {/* customer_name */}
                            <InputField
                                name="our_legal_entity_name"
                                value={formData.our_legal_entity_name}
                                label="Юрлицо(наше):"
                                type="text"
                                w={["w-6/16", "w-11/16"]}
                                onChange={() => { }}
                                refBook={<BtnLegalEntitiesRef handleSelectLegalEntity={handleSelectOurLegalEntity} legalEntities={props.customers} elementIdPrefix="our_legal_entity" />}
                                readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                errors={errors?.our_legal_entity_name?._errors as string[] | undefined}
                            />
                            <InputField
                                name="section_name"
                                value={formData.section_name}
                                label="Раздел:"
                                type="text"
                                w={["w-6/16", "w-11/16"]}
                                onChange={() => { }}
                                refBook={<BtnSectionsRef handleSelectSection={handleSelectSection} />}
                                readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                errors={errors?.section_name?._errors as string[] | undefined}
                            />

                            {/* SetAcceptedButton & accepted_date */}
                            <div className="flex justify-between h-1/4 md:w-full">

                                {!props.readonly &&
                                    <button
                                        type="button"
                                        onClick={() => handleSetAccepted()}
                                        disabled={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                        className={`w-10/16 h-10 mt-1 rounded-md border p-2 ${(props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000')
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-400 text-white hover:bg-blue-100 hover:text-gray-500 cursor-pointer'
                                            }`}
                                    >
                                        Подписал
                                    </button>}
                                {/* accepted_date */}
                                <InputField name="accepted_date" value={utcISOToLocalDateTimeInput(formData.accepted_date)}
                                    label="" type="datetime-local" w={["w-1/16", "w-16/16"]}
                                    onChange={(value) => handleInputChange('accepted_date', String(value))}
                                    readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                    errors={errors?.accepted_date?._errors as string[] | undefined}
                                />
                            </div>
                            <InputField
                                name="accepted_by_person_name"
                                value={formData.accepted_by_person_name || ""}
                                label="Подписал:"
                                type="text"
                                w={["w-6/16", "w-11/16"]}
                                onChange={() => { }}
                                refBook={<BtnPersonsRef handleSelectPerson={handleSelectAcceptedPerson} persons={props.persons} />}
                                readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                            />

                        </div>
                    </div>
                    <div id="form-error" aria-live="polite" aria-atomic="true">
                        {errors &&
                            <p className="mt-2 text-sm text-red-500" key={'form_errors'}>
                                {JSON.stringify(errors)}
                            </p>
                        }
                    </div>
                    {props.vat_invoice_goods && (
                        <VatInvoiceGoodsTable
                            readonly={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                            onDocumentChanged={docChanged}
                            vatInvoiceId={formData.id}
                            goods={props.goods}
                            sectionId={formData.section_id}
                        />
                    )}

                    <div className="sticky bottom-0 bg-white py-4 z-10">
                        <div className="flex justify-between mt-4 mr-4">
                            <div className="flex w-full md:w-3/4">
                                <div className="w-full md:w-1/2">
                                    <button
                                        disabled={props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000'}
                                        className={`w-full rounded-md border p-2 ${(props.readonly || formData.ledger_record_id !== '00000000-0000-0000-0000-000000000000')
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-400 text-white hover:bg-blue-100 hover:text-gray-500 cursor-pointer'
                                            }`}
                                        type="submit"
                                    >
                                        Сохранить
                                    </button>
                                </div>
                                <div className="w-full md:w-1/2">
                                    <button
                                        onClick={handleBackClick}
                                        className="bg-blue-400 text-white w-full rounded-md border p-2 hover:bg-blue-100 hover:text-gray-500 cursor-pointer"
                                        type="button"
                                    >
                                        {props.readonly ? 'Закрыть' : 'Закрыть и освободить'}
                                    </button>
                                </div>
                                <div className="w-full md:w-1/2">
                                    <button
                                        type="button"
                                        onClick={handleShowPDF}
                                        className="bg-blue-400 text-white w-full rounded-md border p-2 hover:bg-green-100 hover:text-gray-500 cursor-pointer"
                                    >
                                        Открыть PDF
                                    </button>
                                </div>
                                {props.vat_invoice_goods && <div className="w-full md:w-1/2">
                                    <button
                                        disabled={props.readonly || isDocumentChanged}
                                        type='button'
                                        onClick={(e) => handleCreateDeleteStockMovements(vat_invoice_goods ?? [], formData)}
                                        className={`text-white w-full border p-2 ${(props.readonly || isDocumentChanged)
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-blue-400  rounded-md hover:bg-green-100 hover:text-gray-500 cursor-pointer'}
                                            `}
                                    >
                                        {formData.ledger_record_id === '00000000-0000-0000-0000-000000000000' ? 'Провести документ' : 'Отменить проведение'}
                                    </button>
                                    <h3 className="text-xs font-medium text-gray-400">проведено: {formData.ledger_record_id}</h3>
                                </div>}
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* Кнопка закрытия PDF */}
            {pdfUrl && (
                <button
                    onClick={() => {
                        URL.revokeObjectURL(pdfUrl);
                        setPdfUrl(null);
                    }}
                    style={{
                        position: 'absolute',
                        top: '50px',
                        right: '50px',
                        padding: '5px 10px',
                        background: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Закрыть PDF
                </button>
            )}

            {/* Отображение PDF в iframe */}
            {pdfUrl && (
                <iframe
                    src={pdfUrl}
                    style={{
                        width: '100%',
                        height: '1200px',
                        border: '2px solid red',
                        marginTop: '20px',
                    }}
                    title="PDF Preview"
                />
            )}
            <MessageBoxOKCancel />
        </div>
    );
}