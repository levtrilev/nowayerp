'use client';
import { useEffect, useState } from "react";
import { WarehouseForm } from "@/app/lib/definitions";
import { lusitana } from "@/app/ui/fonts";
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
import InputField from "@/app/lib/input-field";
import { useRouter } from "next/navigation";
import { createWarehouse, updateWarehouse } from "../../lib/warehouses-actions";
import WarehousePdfDocument from "./warehouse-pdf-document";
import { pdf } from '@react-pdf/renderer';

interface IEditFormProps {
  warehouse: WarehouseForm;
  lockedByUserId: string | null;
  unlockAction: ((tableName: string, id: string, userId: string) => Promise<void>) | null;
  readonly: boolean;
}
const DocStatusSchema = z.enum(['draft', 'active', 'deleted']);
//#region Warehouse zod schema
import { z } from "zod";
const WarehouseFormSchemaFull = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, { message: "Название обязательно." }),
  section_id: z.string().uuid(),
  section_name: z.string().min(1, { message: "Раздел обязателен." }),
  tenant_id: z.string().uuid(),
  author_id: z.string().uuid(),
  editor_id: z.string().uuid(),
  username: z.string().optional(),
  timestamptz: z.string().optional(),
  editing_by_user_id: z.string().nullable(),
  editing_since: z.string().nullable(),
  doc_status: DocStatusSchema,
});
const WarehouseFormSchema = WarehouseFormSchemaFull.omit({
  id: true,
  timestamptz: true,
  username: true,
  editing_by_user_id: true,
  editing_since: true,
});
export type FormData = z.infer<typeof WarehouseFormSchemaFull>;
//#endregion

export default function WarehouseEditForm(props: IEditFormProps) {
  const userSections = useDocumentStore.getState().userSections;
  const sessionUser = useDocumentStore.getState().sessionUser;
  const docTenantId = useDocumentStore.getState().documentTenantId;
  const [showErrors, setShowErrors] = useState(false);
  const isDocumentChanged = useIsDocumentChanged();
  const msgBox = useMessageBox();
  const router = useRouter();

  const docChanged = () => {
    setIsDocumentChanged(true);
    setMessageBoxText('Документ изменен. Закрыть без сохранения?');
  };

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(props.warehouse as FormData);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      author_id: sessionUser.id,
      editor_id: sessionUser.id,
      tenant_id: docTenantId,
    }));
  }, [sessionUser.id, docTenantId]);

  const validate = () => {
    const res = WarehouseFormSchema.safeParse({
      ...formData,
    });
    if (res.success) {
      return undefined;
    }
    return res.error.format();
  };

  //#region handles
  const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validate();
    if (errors) {
      setShowErrors(true);
      return;
    }
    try {
      if (formData.id === "") {
        await createWarehouse(formData);
        setTimeout(() => {
          router.push('/erp/warehouses');
        }, 2000);
      } else {
        await updateWarehouse(formData);
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
    if (props.unlockAction) await props.unlockAction("warehouses", props.warehouse.id, sessionUser.id);
    if (isDocumentChanged && !msgBox.isOKButtonPressed) {
      setIsShowMessageBoxCancel(true);
      setIsMessageBoxOpen(true);
    } else if (!isDocumentChanged) {
      window.history.back();
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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    docChanged();
  };

  const handleShowPDF = async () => {
    try {
      const blob = await pdf(<WarehousePdfDocument formData={formData} />).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Ошибка при экспорте PDF:', error);
    }
  };

  const handleClosePDF = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };
  //#endregion

  const errors = showErrors ? validate() : undefined;

  return (
    <div>
      {!pdfUrl && (
        <form id="warehouse-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex flex-col gap-4 w-full">
              <InputField
                name="name"
                value={formData.name}
                label="Название:"
                type="text"
                w={["w-4/16", "w-13/16"]}
                onChange={(value) => handleInputChange('name', String(value))}
                readonly={props.readonly}
                errors={errors?.name?._errors as string[] | undefined}
              />
              <InputField
                name="section_name"
                value={formData.section_name}
                label="Раздел:"
                type="text"
                w={["w-4/16", "w-13/16"]}
                onChange={() => { }}
                refBook={<BtnSectionsRef handleSelectSection={handleSelectSection} />}
                readonly={props.readonly}
                errors={errors?.section_name?._errors as string[] | undefined}
              />
              <div className="flex justify-between mt-1">
                <label
                  htmlFor="doc_status"
                  className="w-4/16 text-sm text-blue-900 font-medium flex items-center p-2"
                >
                  Статус:
                </label>
                <select
                  name="doc_status"
                  value={formData.doc_status}
                  onChange={(e) => handleInputChange('doc_status', e.target.value)}
                  className="w-13/16 border border-gray-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                  disabled={props.readonly}
                >
                  <option value="draft">Черновик</option>
                  <option value="active">Активно</option>
                  <option value="deleted">Удалено</option>
                </select>
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
          {/* button area */}
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
              <div className="w-full md:w-1/2">
                <button
                  type="button"
                  onClick={handleShowPDF}
                  className="bg-green-400 text-white w-full rounded-md border p-2 hover:bg-green-100 hover:text-gray-500 cursor-pointer"
                >
                  Открыть PDF
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Кнопка закрытия PDF */}
      {pdfUrl && (
        <button
          onClick={handleClosePDF}
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

// Временный импорт (если BtnSectionsRef ещё не глобальный)
import BtnSectionsRef from "@/app/admin/sections/lib/btn-sections-ref";