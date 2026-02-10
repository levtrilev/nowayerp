
import { DateTime } from "next-auth/providers/kakao";

export type InOutType = 'in' | 'out';
export type DocStatus = "draft" | "active" | "deleted";
export type Priority = "высокий" | "низкий";
export type MachineStatus = "норма" | "ремонт" | "ожидание" | "неизвестно";
export type CarStatus = "норма" | "ремонт" | "ожидание" | "неизвестно";

export type Document = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  doc_status: DocStatus;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};

export type Car = Document & {
  unit_id: string;
  location_id: string;
  gos_number: string;
  make: string;
  model: string;
  vin: string;
  year: string;
  customer_id: string;
  car_status: CarStatus;
};
export type CarForm =  Car & {
  customer_name: string;
  unit_name: string;
  location_name: string;
  section_name: string;
};

export type LedgerRecord ={
  id: string;
  doc_id: string;
  doc_type: string;
  section_id: string;
  tenant_id: string;
  record_date: string;
  record_text: string;
  timestamptz?: string;
};

export type Period = {
  id: string;
  name: string;
  date_start: Date | string;
  date_end: Date | string;
};
export type RecordMovement = {
  id: string;
  doc_id: string;
  doc_type: string;
  timestamptz?: string;
  section_id: string;
  tenant_id: string;
  user_id: string;
  period_id: string;
  record_date: string;
  record_text: string;
  record_in_out: InOutType;
  amount: number;
  editing_by_user_id: string | null;
  editing_since: string | null;
  movement_status: DocStatus;
};
export type StockMovement = RecordMovement & {
  quantity: number;
  good_id: string;
  warehouse_id: string;
};

export type StockMovementForm = StockMovement & {
  good_name: string;
  warehouse_name: string;
  section_name: string;
  period_name: string;
};
export type StockBalance = {
    period_id: string;
    balance_quantity: number;
    balance_amount: number;
    inflows_qantity: number;
    outflows_quantity: number;
    inflows_amount: number;
    outflows_amount: number;
    good_id: string;
    warehouse_id: string;
    section_id: string;
};

export type VATInvoice = Document & {
  ledger_record_id: string;
  date: string | null;
  number: string | null;
  description: string | null;
  customer_id: string;
  our_legal_entity_id: string;
  warehouse_id: string;
  trade_in_out: InOutType;
  amount_incl_vat: number;
  amount_excl_vat: number;
  vat_rate: number;
  vat_amount: number;
  approved_date?: string | null;
  approved_by_person_id: string | null;
  accepted_date?: string | null;
  accepted_by_person_id: string | null;
  access_tags: string[] | null;
  user_tags: string[] | null;
};
export type VATInvoiceForm = VATInvoice & {
  customer_name: string;
  our_legal_entity_name: string;
  warehouse_name: string;
  approved_by_person_name: string | null;
  accepted_by_person_name: string | null;
  section_name: string;
};
export type VatInvoiceGoodsForm = {
  id: string;
  vat_invoice_id: string;
  row_number: string;
  good_id: string;
  good_name: string;
  product_code: string;
  brand: string;
  measure_unit: string;
  quantity: number;
  price: number;
  discount: number;
  amount: number;
  section_id: string;
};
export type Warehouse = Document;
// {
//   id: string;
//   name: string;
//   section_id: string;
//   tenant_id: string;
//   username?: string;
//   timestamptz?: string;
//   editing_by_user_id: string | null;
//   editing_since: string | null;
//   author_id: string | undefined;
// };
export type Document1 = {
  // id: string;
  // name: string;
  // section_id: string;
  // tenant_id: string;
  // username?: string;
  // author_id: string;
  editor_id: string;
  doc_status: DocStatus;
  // timestamptz?: string;
  date_created?: Date;
  // editing_by_user_id: string | null;
  // editing_since: string | null;
};


export type WarehouseForm = Warehouse & {
  section_name: string;
};
export type Good = {
  id: string;
  name: string;
  brand: string;
  product_code: string;
  supplier_id: string;
  measure_unit: string;
  dimensions_height: number;
  dimensions_width: number;
  dimensions_length: number;
  weight: number;
  price_retail: number;
  price_wholesale: number;
  price_cost: number;
  section_id: string;
  tenant_id: string;
  username?: string;
  timestamptz?: string;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type GoodForm = {
  id: string;
  name: string; // Название
  brand: string; // Брэнд
  product_code: string; // Артикул
  supplier_id: string;
  supplier_name: string; // Поставщик
  measure_unit: string;
  dimensions_height: number; // Размеры высота (см)
  dimensions_width: number; // Размеры ширина (см)
  dimensions_length: number; // Размеры длина (см)
  weight: number; // Вес
  price_retail: number; // Цена розница
  price_wholesale: number; // Цена опт
  price_cost: number; // Цена закупки
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  timestamptz?: string;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type WoPart = {
  id: string;
  name: string;
  workorder_id: string;
  work_id: string;
  part_id: string;
  quantity: number;
  section_id: string;
};
export type WoPartForm = {
  id: string;
  name: string;
  workorder_id: string;
  work_id: string;
  part_id: string;
  quantity: number;
  section_id: string;
  work_name: string;
  part_name: string;
  section_name: string;
  workorder_name: string;
};
export type WoOperation = {
  id: string;
  name: string;
  workorder_id: string;
  work_id: string;
  operation_id: string;
  hours_norm: number;
  hours_fact: number;
  completed: boolean;
  section_id: string;
};
export type WoOperationForm = {
  id: string;
  name: string;
  workorder_id: string;
  work_id: string;
  operation_id: string;
  hours_norm: number;
  hours_fact: number;
  completed: boolean;
  section_id: string;
  work_name: string;
  operation_name: string;
  section_name: string;
  workorder_name: string;
};
export type Workorder = {
  id: string;
  name: string;
  doc_number: string;
  doc_date: Date;
  doc_status: DocStatus;
  performer_id: string;
  claim_id: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type WorkorderForm = {
  id: string;
  name: string;
  doc_number: string;
  doc_date: Date;
  doc_status: DocStatus;
  performer_id: string;
  performer_name: string;
  claim_id: string;
  claim_name: string;
  claim_machine_id: string;
  claim_machine_name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};

export type System = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type SystemForm = {
  id: string;
  name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Component = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type ComponentForm = {
  id: string;
  name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type WrhClaims = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type WrhClaimsForm = {
  id: string;
  name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Equip = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type EquipForm = {
  id: string;
  name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Operation = {
  id: string;
  name: string;
  work_id: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type OperationForm = {
  id: string;
  name: string;
  work_id: string;
  work_name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Work = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type WorkForm = {
  id: string;
  name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Person = {
  id: string;
  name: string;
  person_user_name?: string | null;
  person_user_id?: string | null;
  profession?: string | null;
  tabel_number?: string | null;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type PersonForm = {
  id: string;
  name: string;
  person_user_name: string;
  person_user_id: string;
  profession?: string | null;
  tabel_number?: string | null;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Location = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type LocationForm = {
  id: string;
  name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Part = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type PartForm = {
  id: string;
  name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Claim = {
  id: string;
  name: string;
  claim_date: string | null;
  created_by_person_id: string;
  priority: Priority;
  machine_id: string;
  location_id: string;
  system_id: string | null;
  repair_todo: string;
  repair_reason: string;
  breakdown_reasons: string;
  emergency_act: string;
  approved_date?: string | null;
  approved_by_person_id: string | null;
  accepted_date?: string | null;
  accepted_by_person_id: string | null;
  hours_plan?: string | null;
  hours_done?: string | null;
  hours_rest?: string | null;
  hours_percent?: string | null;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
  access_tags: string[] | null;
  user_tags: string[] | null;
};
export type ClaimForm = {
  id: string;
  name: string;
  claim_date: string | null;
  created_by_person_id: string;
  created_by_person_name: string;
  priority: Priority;
  machine_id: string;
  machine_name: string;
  location_id: string;
  location_name: string;
  system_id: string | null;
  system_name: string;
  repair_todo: string;
  repair_reason: string;
  breakdown_reasons: string;
  emergency_act: string;
  approved_date: string | null; // формат "YYYY-MM-DDTHH:mm" — местное время, без зоны
  approved_by_person_id: string | null;
  approved_by_person_name: string;
  accepted_date: string | null;
  accepted_by_person_id: string | null;
  accepted_by_person_name: string;
  hours_plan?: string | null;
  hours_done?: string | null;
  hours_rest?: string | null;
  hours_percent?: string | null;
  section_id: string;
  section_name: string;
  machine_unit_name: string;
  machine_machine_status: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
  access_tags: string[] | null;
  user_tags: string[] | null;
};
export type Machine = {
  id: string;
  name: string;
  unit_id: string;
  location_id: string;
  number: string;
  model: string;
  machine_status: MachineStatus;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  doc_status: DocStatus;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type MachineForm = {
  id: string;
  name: string;
  unit_id: string;
  unit_name: string;
  location_id: string;
  location_name: string;
  number: string;
  model: string;
  machine_status: MachineStatus;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  doc_status: DocStatus;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Unit = {
  id: string;
  name: string;
  object_id: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type UnitForm = {
  id: string;
  name: string;
  object_id: string;
  object_name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type Object = {
  id: string;
  name: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type ObjectForm = {
  id: string;
  name: string;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type DocUserPermissions = {
  full_access: boolean;
  editor: boolean;
  author: boolean;
  can_delete: boolean;
  reader: boolean;
  access_by_tags: boolean;
};
export type Permission = {
  id: string;
  role_id: string;
  role_name: string;
  doctype: string;
  doctype_name: string;
  full_access: boolean;
  editor: boolean;
  author: boolean;
  can_delete: boolean;
  reader: boolean;
  access_by_tags: boolean;
  or_tags: string[];
  and_tags: string[];
  no_tags: string[];
  tenant_id: string;
  tenant_name: string;
};
export type MessageBox = {
  isMessageBoxOpen: boolean;
  messageBoxText: string;
  isShowMessageBoxCancel: boolean;
  isOKButtonPressed: boolean;
  isCancelButtonPressed: boolean;
};
export type Task = {
  id: string;
  name: string;
  date_start: Date | string;
  date_end: Date | string;
  task_schedule_id: string | null;
  is_periodic: boolean;
  period_days: number | null;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type TaskForm = {
  id: string;
  name: string;
  date_start: Date | string;
  date_end: Date | string;
  task_schedule_id: string | null;
  task_schedule_name: string | null;
  is_periodic: boolean;
  period_days: number | null;
  section_id: string;
  section_name: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};

export type TaskSchedule = {
  id: string;
  name: string;
  description: string;
  premise_id: string;
  schedule_owner_id: string;
  date: Date;
  date_start: Date;
  date_end: Date;
  section_id: string;
  username?: string;
  timestamptz?: string;
  date_created?: Date;
};

export type TaskScheduleForm = {
  id: string;
  name: string;
  description: string;
  premise_id: string;
  schedule_owner_id: string;
  date: Date;
  date_start: Date;
  date_end: Date;
  section_id: string;
  username?: string;
  timestamptz?: string;
  date_created?: Date;
  schedule_owner_name: string;
  section_name: string;
  premise_name: string;
  // tasks: Task[];
};

export type Premise = {
  id: string;
  name: string;
  description: string;
  cadastral_number: string;
  square: number;
  address: string;
  address_alt?: string;
  type: string;
  status: string;
  status_until: Date;
  region_id: string;
  owner_id: string;
  operator_id: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  user_tags: string[] | null;
  access_tags: string[] | null;
};
export type PremiseForm = {
  id: string;
  name: string;
  description: string;
  cadastral_number: string;
  square: number;
  address: string;
  address_alt?: string;
  type: string;
  status: string;
  status_until: Date;
  region_id: string;
  owner_id: string;
  operator_id: string;
  section_id: string;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  date_created?: Date;
  region_name: string;
  owner_name: string;
  operator_name: string;
  section_name: string;
  user_tags: string[] | null;
  access_tags: string[] | null;
};
export type Role = {
  id: string;
  name: string;
  description: string;
  tenant_id: string;
  section_ids: string;
  section_names: string;
};
export type RoleForm = {
  id: string;
  name: string;
  description: string;
  tenant_id: string;
  tenant_name: string;
  section_ids?: string;
  section_names?: string;
};
export type Region = {
  id: string;
  name: string;
  capital: string;
  area: string;
  code: string;
  section_id: string;
  username: string;
  author_id: string;
  editor_id: string;
  timestamptz: string;
  date: DateTime;
  access_tags: string[];
  user_tags: string[];
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type RegionForm = {
  id: string;
  name: string;
  capital: string;
  area: string;
  code: string;
  section_id: string;
  username: string;
  author_id: string;
  editor_id: string;
  timestamptz: string;
  date: DateTime;
  section_name: string;
  access_tags: string[];
  user_tags: string[];
  editing_by_user_id: string | null;
  editing_since: string | null;
};
export type LegalEntity = {
  id: string;
  name: string;
  fullname?: string | null;
  inn: string;
  address_legal?: string | null;
  phone?: string | null;
  email?: string | null;
  contact?: string | null;
  is_customer: boolean;
  is_supplier: boolean;
  kpp?: string | null;
  region_id: string;
  section_id: string;
  access_tags: string[] | null;
  user_tags: string[] | null;
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};

export type LegalEntityForm = {
  id: string;
  name: string; // Название:
  fullname?: string | null; // Полное:
  inn: string; // ИНН:
  address_legal?: string | null; // Юр.адрес:
  phone?: string | null; // Телефон:
  email?: string | null; // Email:
  contact?: string | null; // Контакт:
  is_customer: boolean; // Покупатель?
  is_supplier: boolean; // Поставщик?
  kpp?: string | null; // КПП:
  region_id: string;
  section_id: string;
  region_name: string; // Регион:
  section_name: string; // Раздел:
  access_tags: string[] | null; // Теги доступа:
  user_tags: string[] | null; // Теги:
  tenant_id: string;
  username?: string;
  author_id: string;
  editor_id: string;
  timestamptz?: string;
  date_created?: Date;
  editing_by_user_id: string | null;
  editing_since: string | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  is_admin: boolean;
  is_superadmin: boolean;
  tenant_id: string;
  role_ids: string;
};

export type UserForm = {
  id: string;
  name: string;
  email: string;
  password?: string;
  is_admin: boolean;
  is_superadmin: boolean;
  tenant_id: string;
  tenant_name: string;
  role_ids: string;
};

export type Tenant = {
  id: string;
  name: string;
  active: boolean;
  description: string;
};

export type Section = {
  id: string;
  name: string;
  tenant_id: string;
};
export type SectionForm = {
  id: string;
  name: string;
  tenant_id: string;
  tenant_name: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
};

export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: "pending" | "paid";
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, "amount"> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: string;
  amount: number;
  status: "pending" | "paid";
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: "pending" | "paid";
};
