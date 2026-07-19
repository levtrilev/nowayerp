// Unit EditForm

'use client';
import { useEffect, useState } from "react";
import { ObjectForm, UnitForm } from "@/app/lib/definitions";
import BtnSectionsRef from "@/app/admin/sections/lib/btn-sections-ref";
import { object, z } from "zod";
import { pdf } from '@react-pdf/renderer';
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
import { createUnit, updateUnit } from "../../lib/units-actions";
import PdfDocument from "./unit-pdf-document";
import BtnObjectsRef from "@/app/erp/objects/lib/btn-objects-ref";

interface IEditFormProps {
  unit: UnitForm;
  lockedByUserId: string | null;
  unlockAction: ((tableName: string, id: string, userId: string) => Promise<void>) | null;
  readonly: boolean;
  objects: ObjectForm[];
}

const UnitFormSchemaFull = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, { message: "Название должно содержать не менее 2-х символов." }),
  object_id: z.string().min(1, { message: "Поле Объект должно быть заполнено." }),
  object_name: z.string().min(2, { message: "Название должно содержать не менее 2-х символов." }),
  section_name: z.string().min(1, { message: "Поле Раздел должно быть заполнено." }),
  section_id: z.string().min(1, { message: "Поле section_id должно быть заполнено." }),
  username: z.string().optional(),
  timestamptz: z.string().optional(),
  author_id: z.string(),
  editor_id: z.string(),
  tenant_id: z.string(),
  editing_by_user_id: z.string().nullable(),
  editing_since: z.string().nullable(),
});

const UnitFormSchema = UnitFormSchemaFull.omit({
  id: true, timestamptz: true, username: true, editing_by_user_id: true, editing_since: true
});

export type FormData = z.infer<typeof UnitFormSchemaFull>;

export default function UnitEditForm(props: IEditFormProps) {
  const docTenantId = useDocumentStore.getState().documentTenantId;
  const sessionUserId = useDocumentStore.getState().sessionUser.id;
  const [showErrors, setShowErrors] = useState(false);
  const isDocumentChanged = useIsDocumentChanged();
  const msgBox = useMessageBox();
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(props.unit as FormData);

  const docChanged = () => {
    setIsDocumentChanged(true);
    setMessageBoxText('Документ изменен. Закрыть без сохранения?');
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      author_id: sessionUserId,
      editor_id: sessionUserId,
      tenant_id: docTenantId,
    }));
  }, [sessionUserId, docTenantId]);
  const validate = () => {
    const res = UnitFormSchema.safeParse({
      ...formData,
    });
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
      if (!formData.id) {
        await createUnit(formData);
        setTimeout(() => router.push('/erp/units'), 2000);
      } else {
        await updateUnit(formData);
      }
      setIsDocumentChanged(false);
      setMessageBoxText('Документ сохранен.');
    } catch (error) {
      setMessageBoxText('Документ не сохранен! ' + String(error));
    }
    setIsShowMessageBoxCancel(false);
    setIsMessageBoxOpen(true);
  };

  const handleBackClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.unlockAction) await props.unlockAction('units', props.unit.id, sessionUserId);

    if (isDocumentChanged && !msgBox.isOKButtonPressed) {
      setIsShowMessageBoxCancel(true);
      setIsMessageBoxOpen(true);
    } else {
      // Preserve search params (page, query) when navigating back
      const urlParams = new URLSearchParams(window.location.search);
      const queryParams = urlParams.toString();
      const queryString = queryParams ? '?' + queryParams : '';
      router.push(`/erp/units${queryString}`);
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
const handleSelectObject = (new_object_id: string, new_object_name: string) => {
  setFormData((prev) => ({
    ...prev,
    object_id: new_object_id,
    object_name: new_object_name,
  }));
  docChanged();
}
  const handleInputChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    docChanged();
  };

  const handleShowPDF = async () => {
    try {
      const blob = await pdf(<PdfDocument formData={formData} />).toBlob();
      setPdfUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Ошибка PDF:', error);
    }
  };

  const handleClosePDF = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const errors = showErrors ? validate() : undefined;

  return (
    <div>
      {!pdfUrl && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex flex-col gap-4 w-full md:w-1/2">
              {/* name */}
              <InputField
                name="name"
                value={formData.name}
                label="Название:"
                type="text"
                w={["w-4/16", "w-13/16"]}
                onChange={(value) => handleInputChange('name', value)}
                readonly={props.readonly}
                errors={errors?.name?._errors as string[] | undefined}
              />
              {/* object_name */}
              <InputField
                name="object_name"
                value={formData.object_name}
                label="Объект:"
                type="text"
                w={["w-6/16", "w-11/16"]}
                onChange={() => { }}
                refBook={<BtnObjectsRef handleSelectObject={handleSelectObject} objects={props.objects}/>}
                readonly={props.readonly}
                errors={errors?.object_name?._errors}
              />
              {/* section_name */}
              <InputField
                name="section_name"
                value={formData.section_name}
                label="Раздел:"
                type="text"
                w={["w-6/16", "w-11/16"]}
                onChange={() => { }}
                refBook={<BtnSectionsRef handleSelectSection={handleSelectSection} />}
                readonly={props.readonly}
                errors={errors?.section_name?._errors}
              />
            </div>
          </div>

          <div className="flex justify-between mt-4 mr-4">
            <div className="flex w-full md:w-3/4">
              <div className="w-full md:w-1/2">
                <button
                  disabled={props.readonly}
                  className={`w-full rounded-md border p-2 ${props.readonly ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-400 text-white hover:bg-blue-100 hover:text-gray-500'
                    }`}
                  type="submit"
                >
                  Сохранить
                </button>
              </div>
              <div className="w-full md:w-1/2">
                <button
                  onClick={handleBackClick}
                  className="bg-blue-400 text-white w-full rounded-md border p-2 hover:bg-blue-100 hover:text-gray-500"
                >
                  {props.readonly ? 'Закрыть' : 'Закрыть и освободить'}
                </button>
              </div>
              <div className="w-full md:w-1/2">
                <button
                  type="button"
                  onClick={handleShowPDF}
                  className="bg-green-400 text-white w-full rounded-md border p-2 hover:bg-green-100 hover:text-gray-500"
                >
                  Открыть PDF
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {pdfUrl && (
        <>
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
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '1200px', border: '1px solid #ccc', marginTop: '20px' }}
            title="PDF Preview"
          />
        </>
      )}

      <MessageBoxOKCancel />
    </div>
  );
}