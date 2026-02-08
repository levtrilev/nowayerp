// Car EditForm

'use client';
import { useEffect, useState } from "react";
import { ClaimForm, LocationForm, CarForm, CarStatus, Unit, UnitForm, LegalEntityForm } from "@/app/lib/definitions";
// import { formatDateForInput } from "@/app/lib/common-utils";
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
import { createCar, updateCar } from "../../lib/cars-actions";
import PdfDocument from "./car-pdf-document";
import BtnUnitsRef from "@/app/erp/units/lib/btn-units-ref";
import BtnLocationsRef from "@/app/erp/locations/lib/btn-locations-ref";
import Pagination from "@/app/ui/pagination";
import BtnLegalEntitiesRef from "@/app/erp/legal-entities/lib/btn-legal-entities-ref";
import { useSearchParams } from 'next/navigation';
import { fetchLegalEntity, fetchLegalEntityForm } from "@/app/erp/legal-entities/lib/legal-entities-actions";


interface IEditFormProps {
  car: CarForm;
  customers: LegalEntityForm[];
  units: UnitForm[];
  locations: LocationForm[];
  lockedByUserId: string | null;
  unlockAction: ((tableName: string, id: string, userId: string) => Promise<void>) | null;
  readonly: boolean;
}

//#region zod schema
const CarStatusSchema = z.enum(['норма', 'ремонт', 'ожидание', 'неизвестно']);
const DocStatusSchema = z.enum(['draft', 'active', 'deleted']);
const CarFormSchemaFull = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, {
    message: "Название должно содержать не менее 2-х символов.",
  }),
  unit_id: z.string(),
  unit_name: z.string(),
  location_id: z.string(),
  location_name: z.string(),
  gos_number: z.string().min(5, {
    message: "Поле Гос.номер должно быть заполнено.",
  }),
  model: z.string().min(1, {
    message: "Поле Модель должно быть заполнено.",
  }),
  make: z.string().min(2, {
    message: "Поле Марка должно быть заполнено.",
  }),
  vin: z.string().min(5, {
    message: "Поле VIN должно быть заполнено.",
  }),
  year: z.string().min(4, {
    message: "Поле Год выпуска должно быть заполнено (4 цифры).",
  }),
  customer_id: z.string(),
  customer_name: z.string().min(1, {
    message: "Поле Клиент должно быть заполнено.",
  }),
  car_status: CarStatusSchema,
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
  doc_status: DocStatusSchema,
});
const CarFormSchema = CarFormSchemaFull.omit({ id: true, timestamptz: true, username: true, editing_by_user_id: true, editing_since: true });
export type FormData = z.infer<typeof CarFormSchemaFull>;
//#endregion

export default function CarEditForm(props: IEditFormProps) {

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

  const currentSections = '{' + useDocumentStore.getState().userSections.map((section) => section.id).join(',') + '}';

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(props.car as FormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repairReason, setRepairReason] = useState<string>('');
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');

  useEffect(() => {
    if (customerId) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const customer = await fetchLegalEntityForm(customerId, currentSections);
          setFormData((prev) => ({
            ...prev,
            author_id: sessionUserId,
            tenant_id: docTenantId,
            customer_id: customerId as string,
            customer_name: customer.name,
          }));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      setFormData((prev) => ({
        ...prev,
        author_id: sessionUserId,
        tenant_id: docTenantId,
      }));
    }

  }, [customerId, currentSections]);

  const validate = () => {
    const res = CarFormSchema.safeParse({
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

    const errors = validate();
    if (errors) {
      setShowErrors(true);
      console.log("ошибки есть: " + JSON.stringify(errors));

      return;
    }
    try {
      if (formData.id === "") {
        await createCar(formData);
        // setMessageBoxText('Документ сохранен.');
        setTimeout(() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/erp/cars');
          }
        }, 2000);
      } else {
        await updateCar(formData);
        router.refresh();
      }
      setIsDocumentChanged(false);
      setMessageBoxText('Документ сохранен.');
    } catch (error) {
      // if (String(error) === 'NEXT_REDIRECT') {
      setMessageBoxText('Документ не сохранен! :' + String(error));
      // }
      // alert('Документ не сохранен! :' + String(error));
    }
    setIsShowMessageBoxCancel(false);
    setIsMessageBoxOpen(true);
  }
  const handleBackClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.unlockAction) await props.unlockAction("cars", props.car.id, sessionUserId);
    if (isDocumentChanged && !msgBox.isOKButtonPressed) {
      setIsShowMessageBoxCancel(true);
      setIsMessageBoxOpen(true);
    } else if (isDocumentChanged && msgBox.isOKButtonPressed) {
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

  const handleSelectUnit = (new_unit_id: string, new_unit_name: string) => {
    setFormData((prev) => ({
      ...prev,
      unit_id: new_unit_id,
      unit_name: new_unit_name,
    }));
    docChanged();
  };
  function handleSelectCarStatus(event: any) {
    setFormData((prev) => ({
      ...prev,
      car_status: event.target.value,
      // car_status: event.target.selectedOptions[0].text,
    }));
    docChanged();
  }
  const handleSelectLocation = (new_location_id: string, new_location_name: string) => {
    setFormData((prev) => ({
      ...prev,
      location_id: new_location_id,
      location_name: new_location_name,
    }));
    docChanged();
  };
  const handleSelectCustomer = (new_customer_id: string, new_customer_name: string) => {
    setFormData((prev) => ({
      ...prev,
      customer_id: new_customer_id,
      customer_name: new_customer_name,
    }));
    docChanged();
  }
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
  const [claimsTableKey, setClaimsTableKey] = useState(0);
  const errors = showErrors ? validate() : undefined;
  // const handleCreateClaim = async (FormData: FormData) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     car_status: 'ремонт',
  //   }));
  //   const claim = {
  //     name: repairReason,
  //     // claim_date: new Date().toISOString(),
  //     claim_date: (function () {
  //       const d = new Date();
  //       return d.getFullYear() + '-' +
  //         String(d.getMonth() + 1).padStart(2, '0') + '-' +
  //         String(d.getDate()).padStart(2, '0');// + 'T' +
  //       // String(d.getHours()).padStart(2, '0') + ':' +
  //       // String(d.getMinutes()).padStart(2, '0');
  //     })(),
  //     priority: "низкий",
  //     car_id: formData.id,
  //     car_name: formData.name,
  //     car_car_status: formData.car_status,
  //     location_id: formData.location_id,
  //     location_name: formData.location_name,
  //     repair_todo: "",
  //     repair_reason: repairReason,
  //     breakdown_reasons: "",
  //     emergency_act: "",
  //     system_id: null,
  //     section_id: formData.section_id,
  //     section_name: formData.section_name,
  //     tenant_id: formData.tenant_id,
  //     author_id: formData.author_id,
  //     username: "",
  //     date_created: new Date(),
  //     editing_since: null,
  //     editing_by_user_id: null,
  //     // approved_date: (function () {
  //     //   const d = new Date();
  //     //   return d.getFullYear() + '-' +
  //     //     String(d.getMonth() + 1).padStart(2, '0') + '-' +
  //     //     String(d.getDate()).padStart(2, '0') + 'T' +
  //     //     String(d.getHours()).padStart(2, '0') + ':' +
  //     //     String(d.getMinutes()).padStart(2, '0');
  //     // })(),
  //     // accepted_date: (function () {
  //     //   const d = new Date();
  //     //   return d.getFullYear() + '-' +
  //     //     String(d.getMonth() + 1).padStart(2, '0') + '-' +
  //     //     String(d.getDate()).padStart(2, '0') + 'T' +
  //     //     String(d.getHours()).padStart(2, '0') + ':' +
  //     //     String(d.getMinutes()).padStart(2, '0');
  //     // })(),
  //   } as ClaimForm;
  //   try {
  //     await createClaim(claim);
  //     setClaimsTableKey(prev => prev + 1);
  //   } catch (error) {
  //     setMessageBoxText('Документ не сохранен! :' + String(error) + ' ' + JSON.stringify(claim));
  //   }
  // }
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
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

              {/* gos_number */}
              <InputField name="gos_number" value={formData.gos_number}
                label="Гос.номер:" type="text" w={["w-4/16", "w-13/16"]}
                onChange={(value) => handleInputChange('gos_number', value)}
                readonly={props.readonly}
                errors={errors?.gos_number?._errors as string[] | undefined}
              />

              {/* make */}
              <InputField name="make" value={formData.make}
                label="Марка:" type="text" w={["w-4/16", "w-13/16"]}
                onChange={(value) => handleInputChange('make', value)}
                readonly={props.readonly}
                errors={errors?.make?._errors as string[] | undefined}
              />

              {/* model */}
              <InputField name="model" value={formData.model}
                label="Модель:" type="text" w={["w-4/16", "w-13/16"]}
                onChange={(value) => handleInputChange('model', value)}
                readonly={props.readonly}
                errors={errors?.model?._errors as string[] | undefined}
              />

              {/* year */}
              <InputField name="year" value={formData.year}
                label="Год выпуска:" type="text" w={["w-4/16", "w-13/16"]}
                onChange={(value) => handleInputChange('year', value)}
                readonly={props.readonly}
                errors={errors?.year?._errors as string[] | undefined}
              />

              {/* vin */}
              <InputField name="vin" value={formData.vin}
                label="VIN:" type="text" w={["w-4/16", "w-13/16"]}
                onChange={(value) => handleInputChange('vin', value)}
                readonly={props.readonly}
                errors={errors?.vin?._errors as string[] | undefined}
              />

            </div>

            {/* second column */}
            <div className="flex flex-col gap-4 w-full md:w-1/2">

              {/* customer_name */}
              <InputField
                name="customer_name"
                value={formData.customer_name}
                label="Клиент:"
                type="text"
                w={["w-6/16", "w-11/16"]}
                onChange={() => { }}
                refBook={<BtnLegalEntitiesRef handleSelectLegalEntity={handleSelectCustomer} legalEntities={props.customers} elementIdPrefix="customer" />}
                readonly={props.readonly}
                errors={errors?.customer_name?._errors as string[] | undefined}
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

              {/* unit_name */}
              <InputField name="unit_name" value={formData.unit_name as string}
                label="Участок:" type="text" w={["w-6/16", "w-11/16"]}
                // onChange={(value) => handleInputChange('section_id', value)}
                onChange={(value) => { }}
                refBook={<BtnUnitsRef handleSelectUnit={handleSelectUnit} units={props.units} />}
                readonly={props.readonly}
                errors={errors?.unit_name?._errors as string[] | undefined}
              />

              {/* location_name */}
              <InputField name="location_name" value={formData.location_name as string}
                label="Местоположение:" type="text" w={["w-6/16", "w-11/16"]}
                // onChange={(value) => handleInputChange('section_id', value)}
                onChange={(value) => { }}
                refBook={<BtnLocationsRef handleSelectLocation={handleSelectLocation} locations={props.locations} />}
                readonly={props.readonly}
                errors={errors?.location_name?._errors as string[] | undefined}
              />

              {/* car_status */}
              <div className="flex-1 flex items-center">
                <label htmlFor="car_status" className="text-sm font-medium flex items-center p-2">Состояние:</label>
                <select
                  name="car_status" id="car_status"
                  className="w-full h-10 cursor-pointer rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-blue-300"
                  value={formData.car_status}
                  onChange={(e) => handleSelectCarStatus(e)}
                >
                  <option value="" disabled>
                    Состояние
                  </option>
                  <option key={'норма'} value={'норма'}>
                    норма
                  </option>
                  <option key={'ремонт'} value={'ремонт'}>
                    ремонт
                  </option>
                  <option key={'ожидание'} value={'ожидание'}>
                    ожидание
                  </option>
                  <option key={'неизвестно'} value={'неизвестно'}>
                    неизвестно
                  </option>
                </select>
              </div>

              {/* repairReason & createClaim */}
              <div className="flex justify-center h-1/4 md:w-full">
                <textarea
                  id="repairReason"
                  name="repairReason"
                  className="w-full break-words rounded-md border border-gray-200 p-2"
                  disabled={props.readonly}
                  placeholder="Причина постановки в ремонт"
                  value={repairReason}
                  onChange={(e) => setRepairReason(e.target.value)}
                />
                {/* onChange={(value) => { setRepairReason(value.toString()) }} */}

                {/* {!props.readonly && <button
                  type="button"
                  onClick={() => {handleCreateClaim(formData); docChanged();}}
                  disabled={props.readonly}
                  className={`w-4/16 rounded-md border p-2 ${props.readonly
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-400 text-white hover:bg-blue-100 hover:text-gray-500 cursor-pointer'
                    }`}
                >
                  Создать заявку
=                </button>} */}
              </div>
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
                  type="button"
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
      {/* <ClaimsTable
        query={''}
        currentPage={1}
        current_sections={effectiveSectionIdsString}
        car_id={formData.id}
        key={claimsTableKey} /> */}
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={1} />
      </div>
      <MessageBoxOKCancel />
    </div>
  );
}