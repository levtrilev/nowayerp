
// Task EditForm

'use client';
import { useEffect, useState } from "react";
import { ObjectForm } from "@/app/lib/definitions";
import { formatDateForInput } from "@/app/lib/common-utils";
import BtnSectionsRef from "@/app/admin/sections/lib/btn-sections-ref";
import { z } from "zod";
import { pdf, PDFViewer } from '@react-pdf/renderer';
// import BtnTaskScheduleRef from "@/app/erp/task-schedules/lib/btn-task-schedule-ref";
import MessageBoxOKCancel from "@/app/lib/message-box-ok-cancel";
import {
  setIsCancelButtonPressed, setIsDocumentChanged, setIsMessageBoxOpen, setIsOKButtonPressed,
  setIsShowMessageBoxCancel, setMessageBoxText, useDocumentStore, useIsDocumentChanged, useMessageBox
} from "@/app/store/useDocumentStore";
import InputField from "@/app/lib/input-field";
import { useRouter } from "next/navigation";
import { createObject, updateObject } from "../../lib/objects-actions";
import PdfDocument from "./object-pdf-document";

interface IEditFormProps {
  object: ObjectForm;
  lockedByUserId: string | null;
  unlockAction: ((tableName: string, id: string, userId: string) => Promise<void>) | null;
  readonly: boolean;
}
//#region zod schema
const ObjectFormSchemaFull = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, {
    message: "Название должно содержать не менее 2-х символов.",
  }),
  section_name: z.string().min(1, {
    message: "Поле Раздел должно быть заполнено.",
  }),
  section_id: z.string().min(1, {
    message: "Поле section_id должно быть заполнено.",
  }),
  username: z.string().optional(),
  timestamptz: z.string().optional(),
  author_id: z.string(), // z.string().uuid(),
  editor_id: z.string(), // z.string().uuid(),
  tenant_id: z.string(), // z.string().uuid(),
  editing_by_user_id: z.string().nullable(),
  editing_since: z.string().nullable(),
});
const ObjectFormSchema = ObjectFormSchemaFull.omit({ id: true, timestamptz: true, username: true, editing_by_user_id: true, editing_since: true });
export type FormData = z.infer<typeof ObjectFormSchemaFull>;
//#endregion

export default function ObjectEditForm(props: IEditFormProps) {

  //#region unified form hooks and variables 

  const docTenantId = useDocumentStore.getState().documentTenantId;
  const sessionUserId = useDocumentStore.getState().sessionUser.id;
  const [showErrors, setShowErrors] = useState(false);
  // const [formData, setFormData] = useState<FormData>(props.premise);
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
      author_id: sessionUserId,
      editor_id: sessionUserId,
    }));
  }, [sessionUserId]);
  //#endregion

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(props.object as FormData);


  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      author_id: sessionUserId,
      tenant_id: docTenantId,
    }));
  }, []);

  const validate = () => {
    const res = ObjectFormSchema.safeParse({
      ...formData,
      // square: Number(formData.square),
    });
    if (res.success) {
      return undefined;
    }
    return res.error.format();
  }
  //#region handles
  const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();

    // if (formData.is_periodic === null) {
    //   formData.is_periodic = false;
    // }
    const errors = validate();
    if (errors) {
      setShowErrors(true);
      console.log("ошибки есть: " + JSON.stringify(errors));
      // console.log(`tenant_id: ${formData.tenant_id}, section_id: ${formData.section_id}`);
      // console.log(`author_id: ${formData.author_id}, editor_id: ${formData.editor_id}`);
      return;
    }
    try {
      if (formData.id === "") {
        await createObject(formData);
        // setMessageBoxText('Документ сохранен.');
        setTimeout(() => {
          router.push('/erp/objects');
        }, 2000);
      } else {
        await updateObject(formData);
      }
      setIsDocumentChanged(false);
      setMessageBoxText('Документ сохранен.');
    } catch (error) {
      if (String(error) === 'NEXT_REDIRECT') {
        setMessageBoxText('Документ не сохранен! :' + String(error));
      }
      // alert('Документ не сохранен! :' + String(error));
    }
    setIsShowMessageBoxCancel(false);
    setIsMessageBoxOpen(true);
  }
  const handleBackClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.unlockAction) await props.unlockAction("objects", props.object.id, sessionUserId);

    if (isDocumentChanged && !msgBox.isOKButtonPressed) {
      setIsShowMessageBoxCancel(true);
      setIsMessageBoxOpen(true);
    } else {
      // Preserve search params (page, query) when navigating back
      const urlParams = new URLSearchParams(window.location.search);
      const queryParams = urlParams.toString();
      const queryString = queryParams ? '?' + queryParams : '';
      router.push(`/erp/objects${queryString}`);
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

  const handleSelectTaskSchedule = (new_ts_id: string, new_ts_name: string) => {
    setFormData((prev) => ({
      ...prev,
      task_schedule_id: new_ts_id,
      task_schedule_name: new_ts_name,
    }));
    docChanged();
  };
  // handleRedirectBack is intentionally not used - use handleBackClick instead
  const handleShowPDF = async () => {
    try {
      // Создаем PDF из компонента PdfDocument
      const blob = await pdf(<PdfDocument formData={formData} />).toBlob();

      // Создаем URL для Blob-объекта
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);

    } catch (error) {
      console.error('Ошибка при экспорте PDF:', error);

    }
  };
  const handleClosePDF = () => {
    if (pdfUrl) {
      // Освобождаем ресурсы Blob-URL
      URL.revokeObjectURL(pdfUrl);
      // Убираем iframe
      setPdfUrl(null);
    }
  };
  const handleInputChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    docChanged();
  };
  //#endregion

  const errors = showErrors ? validate() : undefined;

  return (
    <div>
      {!pdfUrl && (
        <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">

            {/* first column */}
            <div className="flex flex-col gap-4 w-full md:w-1/2">

              {/* name */}
              <InputField name="name" value={formData.name}
                label="Название:" type="text" w={["w-4/16", "w-13/16"]}
                onChange={(value) => handleInputChange('name', value)}
                readonly={props.readonly}
                errors={errors?.name?._errors as string[] | undefined}
              />

              {/* section_name */}
              <InputField name="section_name" value={formData.section_name as string}
                label="Раздел:" type="text" w={["w-6/16", "w-11/16"]}
                // onChange={(value) => handleInputChange('section_id', value)}
                onChange={(value) => { }}
                refBook={<BtnSectionsRef handleSelectSection={handleSelectSection} />}
                readonly={props.readonly}
                errors={errors?.section_name?._errors as string[] | undefined}
              />
            </div>

            {/* second column */}
            <div className="flex flex-col gap-4 w-full md:w-1/2">


            </div>
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
                  type="submit">
                  Сохранить
                </button>
              </div>
              <div className="w-full md:w-1/2">
                <button
                  onClick={handleBackClick}
                  className="bg-blue-400 text-white w-full rounded-md border p-2
                 hover:bg-blue-100 hover:text-gray-500 cursor-pointer"
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
      {/* Кнопка закрытия PDF*/}
      {
        pdfUrl &&
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
      }
      {/* Отображение PDF в iframe */}
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          style={{
            width: '100%',
            height: '1200px',
            border: '2px solid red', // Временная граница для отладки
            marginTop: '20px',
          }}
          title="PDF Preview"
        />
      )}
      <MessageBoxOKCancel />
    </div>
  );
}

