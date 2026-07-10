// LegalEntity EditForm
'use client';
import { useEffect, useState } from "react";
import { CarForm, LegalEntityForm, Region } from "@/app/lib/definitions";
import { utcISOToLocalDateTimeInput } from "@/app/lib/common-utils";
import { z } from "zod";
import MessageBoxOKCancel from "@/app/lib/message-box-ok-cancel";
import {
    setIsDocumentChanged,
    setIsMessageBoxOpen,
    setIsShowMessageBoxCancel,
    setMessageBoxText,
    useDocumentStore,
    useIsDocumentChanged,
    useMessageBox
} from "@/app/store/useDocumentStore";
import { useAccessTagStore, useUserTagStore } from "@/app/lib/tags/tag-store";
import InputField from "@/app/lib/input-field";
import { useRouter } from "next/navigation";
import { createLegalEntity, updateLegalEntity } from "../../lib/legal-entities-actions";
import { lusitana } from "@/app/ui/fonts";
import { TagInput } from "@/app/lib/tags/tag-input";
import { upsertTags } from "@/app/lib/tags/tags-actions";
import BtnSectionsRef from "@/app/admin/sections/lib/btn-sections-ref";
import BtnRegionsRef from "@/app/erp/regions/lib/btn-regions-ref";
import CarsTableNaked from "@/app/erp/cars/lib/cars-table-naked";

interface IEditFormProps {
    legalEntity: LegalEntityForm;
    clients_cars: CarForm[];
    lockedByUserId: string | null;
    unlockAction: ((tableName: string, id: string, userId: string) => Promise<void>) | null;
    readonly: boolean;
    regions: Region[];
    current_sections: string;
}

//#region LegalEntity zod schema
const LegalEntityFormSchemaFull = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, {
        message: "Название обязательно.",
    }),
    fullname: z.string().optional(),
    inn: z.string().regex(/^\d{10}(\d{2})?$/, {
        message: "ИНН должен содержать 10 или 12 цифр.",
    }),
    address_legal: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email({
        message: "Некорректный email.",
    }).optional().nullable(),
    contact: z.string().optional().nullable(),
    is_customer: z.boolean(),
    is_supplier: z.boolean(),
    kpp: z.string().regex(/^\d{9}$/, {
        message: "КПП должен содержать 9 цифр.",
    }).optional().nullable(),
    region_id: z.string().uuid(),
    section_id: z.string().uuid(),
    region_name: z.string().min(1, {
        message: "Регион обязателен.",
    }),
    section_name: z.string().min(1, {
        message: "Раздел обязателен.",
    }),
    access_tags: z.array(z.string()).nullable(),
    user_tags: z.array(z.string()).nullable(),
    tenant_id: z.string().uuid(),
    username: z.string().optional(),
    author_id: z.string().uuid(),
    editor_id: z.string().uuid(),
    timestamptz: z.string().optional(),
    date_created: z.date().optional(),
    editing_by_user_id: z.string().uuid().nullable(),
    editing_since: z.string().nullable(),
});

const LegalEntityFormSchema = LegalEntityFormSchemaFull.omit({
    id: true,
    timestamptz: true,
    username: true,
    editing_by_user_id: true,
    editing_since: true,
    date_created: true,
});

export type FormData = z.infer<typeof LegalEntityFormSchemaFull>;
//#endregion

export default function LegalEntityEditForm(props: IEditFormProps) {
    const userSections = useDocumentStore.getState().userSections;
    const sessionUser = useDocumentStore.getState().sessionUser;
    const addUserTag = useUserTagStore().addTag;
    const addAccessTag = useAccessTagStore().addTag;

    const docTenantId = useDocumentStore.getState().documentTenantId;
    const [showErrors, setShowErrors] = useState(false);
    const isDocumentChanged = useIsDocumentChanged();
    const msgBox = useMessageBox();
    const router = useRouter();

    const docChanged = () => {
        setIsDocumentChanged(true);
        setMessageBoxText('Документ изменен. Закрыть без сохранения?');
    };

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            author_id: sessionUser.id,
            editor_id: sessionUser.id,
            tenant_id: docTenantId,
        }));
    }, [sessionUser.id, docTenantId]);

    const [formData, setFormData] = useState<FormData>(props.legalEntity as FormData);

    const validate = () => {
        const res = LegalEntityFormSchema.safeParse({
            ...formData,
        });
        if (res.success) {
            return undefined;
        }
        return res.error.format();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validate();
        if (errors) {
            setShowErrors(true);
            return;
        }

        try {
            if (formData.user_tags) {
                await upsertTags(formData.user_tags, docTenantId);
                useDocumentStore.getState().addAllTags(formData.user_tags);
            }
            if (formData.access_tags) {
                await upsertTags(formData.access_tags, docTenantId);
                useDocumentStore.getState().addAllTags(formData.access_tags);
            }

            if (formData.id === "") {
                await createLegalEntity(formData);
                setTimeout(() => {
                    router.push('erp/legal-entities');
                }, 2000);
            } else {
                await updateLegalEntity(formData);
                router.refresh();
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
        if (props.unlockAction) await props.unlockAction("legal_entities", props.legalEntity.id, sessionUser.id);
        if (isDocumentChanged && !msgBox.isOKButtonPressed) {
            setIsShowMessageBoxCancel(true);
            setIsMessageBoxOpen(true);
        } else if (!isDocumentChanged) {
            window.history.back();
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        docChanged();
    };

    const handleChangeUserTags = () => {
        const currentTags = useUserTagStore.getState().selectedTags;
        setFormData((prev) => ({ ...prev, user_tags: currentTags }));
        docChanged();
    };

    const handleChangeAccessTags = () => {
        const currentTags = useAccessTagStore.getState().selectedTags;
        setFormData((prev) => ({ ...prev, access_tags: currentTags }));
        docChanged();
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

    const handleSelectRegion = (new_region_id: string, new_region_name: string) => {
        setFormData((prev) => ({
            ...prev,
            region_id: new_region_id,
            region_name: new_region_name,
        }));
        docChanged();
    };

    const handleCreateClientsCar = () => {
        // router.push('/erp/cars/create');
        router.push(`/erp/cars/create?customer_id=${formData.id}`);
    };
    const errors = showErrors ? validate() : undefined;

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    {/* первая колонка */}
                    <div className="flex flex-col gap-4 w-full md:w-1/2">
                        {/* Название: */}
                        <InputField
                            name="name"
                            value={formData.name}
                            label="Название:"
                            type="text"
                            w={["w-4/16", "w-13/16"]}
                            onChange={(value) => handleInputChange('name', value)}
                            readonly={props.readonly}
                            errors={errors?.name?._errors}
                        />
                        {/* Полное: */}
                        <InputField
                            name="fullname"
                            value={formData.fullname || ''}
                            label="Полное:"
                            type="text"
                            w={["w-4/16", "w-13/16"]}
                            onChange={(value) => handleInputChange('fullname', value)}
                            readonly={props.readonly}
                            errors={errors?.fullname?._errors}
                        />
                        {/* ИНН: */}
                        <InputField
                            name="inn"
                            value={formData.inn || ''}
                            label="ИНН:"
                            type="text"
                            w={["w-4/16", "w-13/16"]}
                            onChange={(value) => handleInputChange('inn', value)}
                            readonly={props.readonly}
                            errors={errors?.inn?._errors}
                        />
                        {/* Юр.адрес: */}
                        <InputField
                            name="address_legal"
                            value={formData.address_legal || ''}
                            label="Юр.адрес:"
                            type="text"
                            w={["w-4/16", "w-13/16"]}
                            onChange={(value) => handleInputChange('address_legal', value)}
                            readonly={props.readonly}
                            errors={errors?.address_legal?._errors}
                        />
                        {/* Телефон: */}
                        <InputField
                            name="phone"
                            value={formData.phone || ''}
                            label="Телефон:"
                            type="text"
                            w={["w-4/16", "w-13/16"]}
                            onChange={(value) => handleInputChange('phone', value)}
                            readonly={props.readonly}
                            errors={errors?.phone?._errors}
                        />
                        {/* Email: */}
                        <InputField
                            name="email"
                            value={formData.email || ''}
                            label="Email:"
                            type="text"
                            w={["w-4/16", "w-13/16"]}
                            onChange={(value) => handleInputChange('email', value)}
                            readonly={props.readonly}
                            errors={errors?.email?._errors}
                        />
                        {/* Контакт: */}
                        <InputField
                            name="contact"
                            value={formData.contact || ''}
                            label="Контакт:"
                            type="text"
                            w={["w-4/16", "w-13/16"]}
                            onChange={(value) => handleInputChange('contact', value)}
                            readonly={props.readonly}
                            errors={errors?.contact?._errors}
                        />
                        {/* автомобли клиента */}
                        {!errors && formData.is_customer && <button
                            id="add_car"
                            className="absolute top-123 left-30 px-2 py-1 bg-green-300 text-sm text-white border-none rounded cursor-pointer z-50"
                            type="button"
                            onClick={handleCreateClientsCar}
                        >
                            добавить
                        </button>}
                    </div>
                    {/* вторая колонка */}
                    <div className="flex flex-col gap-4 w-full md:w-1/2">
                        {/* Покупатель? */}
                        <div className="flex items-center">
                            <label className="w-6/16 text-sm font-medium p-2">Клиент?</label>
                            <input
                                type="checkbox"
                                checked={formData.is_customer}
                                onChange={(e) => handleInputChange('is_customer', e.target.checked)}
                                disabled={props.readonly}
                                className="ml-2"
                            />
                        </div>
                        {/* Поставщик? */}
                        <div className="flex items-center">
                            <label className="w-6/16 text-sm font-medium p-2">Поставщик?</label>
                            <input
                                type="checkbox"
                                checked={formData.is_supplier}
                                onChange={(e) => handleInputChange('is_supplier', e.target.checked)}
                                disabled={props.readonly}
                                className="ml-2"
                            />
                        </div>
                        {/* КПП: */}
                        <InputField
                            name="kpp"
                            value={formData.kpp || ''}
                            label="КПП:"
                            type="text"
                            w={["w-4/16", "w-13/16"]}
                            onChange={(value) => handleInputChange('kpp', value)}
                            readonly={props.readonly}
                            errors={errors?.kpp?._errors}
                        />
                        {/* Регион: */}
                        <InputField
                            name="region_name"
                            value={formData.region_name}
                            label="Регион:"
                            type="text"
                            w={["w-6/16", "w-11/16"]}
                            refBook={<BtnRegionsRef handleSelectRegion={handleSelectRegion} regions={props.regions} />}
                            onChange={() => { }}
                            readonly={props.readonly}
                            errors={errors?.region_name?._errors}
                        />
                        {/* section_name */}
                        <InputField
                            name="section_name"
                            value={formData.section_name as string}
                            label="Раздел:"
                            type="text"
                            w={["w-6/16", "w-11/16"]}
                            onChange={(value) => { }}
                            refBook={<BtnSectionsRef handleSelectSection={handleSelectSection} />}
                            readonly={props.readonly}
                            errors={errors?.section_name?._errors as string[] | undefined}
                        />
                        {/* Теги: */}
                        <div className="flex max-w-[1150px] mt-1">
                            <label className={`${lusitana.className} w-[130px] font-medium flex items-center p-2 text-gray-500`}>
                                Теги:
                            </label>
                            <TagInput
                                id="user_tags"
                                value={formData.user_tags}
                                onAdd={addUserTag}
                                handleFormInputChange={handleChangeUserTags}
                                readonly={props.readonly}
                            />
                        </div>
                        {/* Теги доступа: */}
                        <div className="flex max-w-[1150px] mt-1">
                            <label className={`${lusitana.className} w-[130px] font-medium flex items-center p-2 text-gray-500`}>
                                Теги доступа:
                            </label>
                            <TagInput
                                id="access_tags"
                                value={formData.access_tags}
                                onAdd={addAccessTag}
                                handleFormInputChange={handleChangeAccessTags}
                                readonly={props.readonly}
                            />
                        </div>
                    </div>
                </div>
                <div id="form-error" aria-live="polite" aria-atomic="true">
                    {errors &&
                        <p className="mt-2 text-sm text-red-500" key={'form_errors'}>
                            {JSON.stringify(errors)}
                        </p>
                    }
                </div>
                {formData.is_customer &&
                    <CarsTableNaked
                        cars={props.clients_cars}
                        showDeleteButton={false}
                        userId={sessionUser.id}
                        current_sections={props.current_sections}
                        readonly_permission={true}
                    />}
                <div className="flex justify-between mt-4 mr-4">
                    <div className="flex w-full md:w-3/4">
                        <div className="w-full md:w-1/2">
                            <button
                                disabled={props.readonly}
                                className={`w-full rounded-md border p-2 ${props.readonly
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
                            >
                                {props.readonly ? 'Закрыть' : 'Закрыть и освободить'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
            <MessageBoxOKCancel />
        </div>
    );
}