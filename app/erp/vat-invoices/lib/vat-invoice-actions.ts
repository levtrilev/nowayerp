"use server";
import { z } from "zod";
import pool from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VATInvoice, VATInvoiceForm } from "@/app/lib/definitions";

const ITEMS_PER_PAGE = 8;

//#region Create VATInvoice
export async function createVatInvoice(invoice: VATInvoice) {
  const session = await auth();
  const username = session?.user?.name;
  const date_created = new Date().toISOString();
  const {
    name,
    date,
    number,
    description,
    customer_id,
    our_legal_entity_id,
    trade_in_out,
    warehouse_id,
    amount_incl_vat,
    amount_excl_vat,
    vat_rate,
    vat_amount,
    doc_status,
    approved_date,
    approved_by_person_id,
    accepted_date,
    accepted_by_person_id,
    section_id,
    tenant_id,
    author_id,
  } = invoice;

  try {
    await pool.query(
      `
      INSERT INTO "vat_invoices" (
        name,
        date,
        number,
        description,
        customer_id,
        our_legal_entity_id,
        trade_in_out,
        warehouse_id,
        amount_incl_vat,
        amount_excl_vat,
        vat_rate,
        vat_amount,
        doc_status,
        approved_date,
        approved_by_person_id,
        accepted_date,
        accepted_by_person_id,
        username,
        section_id,
        timestamptz,
        tenant_id,
        author_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `,
      [
        name,
        new Date(date as string),
        number,
        description,
        customer_id,
        our_legal_entity_id,
        trade_in_out,
        warehouse_id,
        amount_incl_vat,
        amount_excl_vat,
        vat_rate,
        vat_amount,
        doc_status,
        approved_date ? new Date(approved_date as string) : null,
        approved_by_person_id,
        accepted_date ? new Date(accepted_date as string) : null,
        accepted_by_person_id,
        username,
        section_id,
        date_created,
        tenant_id,
        author_id,
      ],
    );

  } catch (error) {
    console.error("Не удалось создать VATInvoice:", error);
    throw new Error("Не удалось создать VATInvoice:" + String(error));
  }
  revalidatePath("/erp/vat-invoices");
}
//#endregion

//#region Update/Delete VATInvoice
export async function updateVatInvoice(invoice: VATInvoice) {
  const session = await auth();
  const username = session?.user?.name;
  const {
    id,
    name,
    date,
    number,
    description,
    customer_id,
    our_legal_entity_id,
    trade_in_out,
    warehouse_id,
    amount_incl_vat,
    amount_excl_vat,
    vat_rate,
    vat_amount,
    doc_status,
    approved_date,
    approved_by_person_id,
    accepted_date,
    accepted_by_person_id,
    section_id,
    tenant_id,
    author_id,
  } = invoice;

  try {
    await pool.query(
      `
      UPDATE "vat_invoices" SET
        name = $2,
        date = $3,
        number = $4,
        description = $5,
        customer_id = $6,
        our_legal_entity_id = $7,
        trade_in_out = $8,
        warehouse_id = $9,
        amount_incl_vat = $10,
        amount_excl_vat = $11,
        vat_rate = $12,
        vat_amount = $13,
        doc_status = $14,
        approved_date = $15,
        approved_by_person_id = $16,
        accepted_date = $17,
        accepted_by_person_id = $18,
        username = $19,
        section_id = $20,
        tenant_id = $21,
        author_id = $22,
        timestamptz = now()
      WHERE id = $1
      `,
      [
        id,
        name,
        new Date(date as string),
        number,
        description,
        customer_id,
        our_legal_entity_id,
        trade_in_out,
        warehouse_id,
        amount_incl_vat,
        amount_excl_vat,
        vat_rate,
        vat_amount,
        doc_status,
        approved_date ? new Date(approved_date as string) : null,
        approved_by_person_id,
        accepted_date ? new Date(accepted_date as string) : null,
        accepted_by_person_id,
        username,
        section_id,
        tenant_id,
        author_id,
      ],
    );
  } catch (error) {
    console.error("Не удалось обновить VATInvoice:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось обновить VATInvoice: " + String(error),
    );
  }
  revalidatePath("/erp/vat-invoices");
}

export async function deleteVatInvoice(id: string) {
  try {
    await pool.query(`DELETE FROM "vat_invoices" WHERE id = $1`, [id]);
  } catch (error) {
    console.error("Ошибка удаления VATInvoice:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось удалить VATInvoice: " + String(error),
    );
  }
  revalidatePath("/erp/vat-invoices");
}
//#endregion

//#region Fetch VATInvoices
export async function fetchVatInvoice(id: string, current_sections: string) {
  try {
    const data = await pool.query<VATInvoice>(
      `
      WITH your_vat_invoices AS ( SELECT * FROM "vat_invoices" WHERE section_id = ANY ($1::uuid[]))
      SELECT * FROM your_vat_invoices WHERE id = $2
      `,
      [current_sections, id],
    );
    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения VATInvoice по ID:", err);
    throw new Error("Не удалось получить VATInvoice:" + String(err));
  }
}

export async function fetchVatInvoiceForm(
  id: string,
  current_sections: string,
) {
  try {
    const data = await pool.query<VATInvoiceForm>(
      `
      WITH your_vat_invoices AS ( SELECT * FROM "vat_invoices" WHERE section_id = ANY ($1::uuid[]))
      SELECT
        v.id,
        v.ledger_record_id,
        v.name,
        v.date,
        TO_CHAR(v.date, 'YYYY-MM-DD') AS date,
        v.number,
        v.description,
        v.customer_id,
        v.our_legal_entity_id,
        v.trade_in_out,
        v.warehouse_id,
        v.amount_incl_vat,
        v.amount_excl_vat,
        v.vat_rate,
        v.vat_amount,
        v.doc_status,
      TO_CHAR(v.approved_date AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD"T"HH24:MI') AS approved_date,
        v.approved_by_person_id,
      TO_CHAR(v.accepted_date AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD"T"HH24:MI') AS accepted_date,
        v.accepted_by_person_id,
        v.section_id,
        v.tenant_id,
        v.username,
        v.author_id,
        v.editor_id,
        v.timestamptz,
        v.date_created,
        v.editing_by_user_id,
        v.editing_since,
        v.access_tags,
        v.user_tags,
        COALESCE(customers.name, '') AS customer_name,
        COALESCE(our_legal_entity.name, '') AS our_legal_entity_name,
        COALESCE(warehouses.name, '') AS warehouse_name,
        COALESCE(approved_persons.name, '') AS approved_by_person_name,
        COALESCE(accepted_persons.name, '') AS accepted_by_person_name,
        COALESCE(sections.name, '') AS section_name
      FROM your_vat_invoices v
      LEFT JOIN legal_entities customers ON v.customer_id = customers.id
      LEFT JOIN legal_entities our_legal_entity ON v.our_legal_entity_id = customers.id
      LEFT JOIN warehouses ON v.warehouse_id = warehouses.id
      LEFT JOIN persons approved_persons ON v.approved_by_person_id = approved_persons.id
      LEFT JOIN persons accepted_persons ON v.accepted_by_person_id = accepted_persons.id
      LEFT JOIN sections ON v.section_id = sections.id
      WHERE v.id = $2
      `,
      [current_sections, id],
    );
    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения формы VATInvoice:", err);
    throw new Error("Не удалось получить данные формы VATInvoice.");
  }
}

export async function fetchVatInvoices(current_sections: string) {
  try {
    const data = await pool.query<VATInvoice>(
      `
      WITH your_vat_invoices AS ( SELECT * FROM "vat_invoices" WHERE section_id = ANY ($1::uuid[]))
      SELECT * FROM your_vat_invoices ORDER BY name ASC
      `,
      [current_sections],
    );
    return data.rows;
  } catch (err) {
    console.error("Ошибка получения списка VATInvoices:", err);
    throw new Error("Не удалось загрузить список VATInvoices.");
  }
}

export async function fetchVatInvoicesForm(current_sections: string) {
  try {
    const data = await pool.query<VATInvoiceForm>(
      `
      WITH your_vat_invoices AS ( SELECT * FROM "vat_invoices" WHERE section_id = ANY ($1::uuid[]))
      SELECT
        v.id,
        v.ledger_record_id,
        v.name,
        v.date,
        v.number,
        v.description,
        v.customer_id,
        v.our_legal_entity_id,
        v.trade_in_out,
        v.warehouse_id,
        v.amount_incl_vat,
        v.amount_excl_vat,
        v.vat_rate,
        v.vat_amount,
        v.doc_status,
        v.approved_date,
        v.approved_by_person_id,
        v.accepted_date,
        v.accepted_by_person_id,
        v.section_id,
        v.tenant_id,
        v.username,
        v.author_id,
        v.editor_id,
        v.timestamptz,
        v.date_created,
        v.editing_by_user_id,
        v.editing_since,
        v.access_tags,
        v.user_tags,
        COALESCE(customers.name, '') AS customer_name,
        COALESCE(our_legal_entity.name, '') AS our_legal_entity_name,
        COALESCE(warehouses.name, '') AS warehouse_name,
        COALESCE(approved_persons.name, '') AS approved_by_person_name,
        COALESCE(accepted_persons.name, '') AS accepted_by_person_name,
        COALESCE(sections.name, '') AS section_name
      FROM your_vat_invoices v
      LEFT JOIN legal_entities customers ON v.customer_id = customers.id
      LEFT JOIN legal_entities our_legal_entity ON v.our_legal_entity_id = customers.id
      LEFT JOIN warehouses ON v.warehouse_id = warehouses.id
      LEFT JOIN persons approved_persons ON v.approved_by_person_id = approved_persons.id
      LEFT JOIN persons accepted_persons ON v.accepted_by_person_id = accepted_persons.id
      LEFT JOIN sections ON v.section_id = sections.id
      ORDER BY v.name ASC
      `,
      [current_sections],
    );
    return data.rows;
  } catch (err) {
    console.error("Ошибка получения форм VATInvoices:", err);
    throw new Error("Не удалось загрузить формы VATInvoices:" + String(err));
  }
}
//#endregion

//#region Filtered VATInvoices
export async function fetchFilteredVatInvoices(
  query: string,
  currentPage: number,
  current_sections: string,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const invoices = await pool.query<VATInvoiceForm>(
      `
      WITH your_vat_invoices AS ( SELECT * FROM "vat_invoices" WHERE section_id = ANY ($1::uuid[]))
      SELECT
        v.id,
        v.ledger_record_id,
        v.name,
        v.date,
        v.number,
        v.description,
        v.customer_id,
        v.our_legal_entity_id,
        v.trade_in_out,
        v.warehouse_id,
        v.amount_incl_vat,
        v.amount_excl_vat,
        v.vat_rate,
        v.vat_amount,
        v.doc_status,
        v.approved_date,
        v.approved_by_person_id,
        v.accepted_date,
        v.accepted_by_person_id,
        v.section_id,
        v.tenant_id,
        v.username,
        v.author_id,
        v.editor_id,
        v.timestamptz,
        v.date_created,
        v.editing_by_user_id,
        v.editing_since,
        v.access_tags,
        v.user_tags,
        COALESCE(customers.name, '') AS customer_name,
        COALESCE(our_legal_entity.name, '') AS our_legal_entity_name,
        COALESCE(warehouses.name, '') AS warehouse_name,
        COALESCE(approved_persons.name, '') AS approved_by_person_name,
        COALESCE(accepted_persons.name, '') AS accepted_by_person_name,
        COALESCE(sections.name, '') AS section_name
      FROM your_vat_invoices v
      LEFT JOIN legal_entities customers ON v.customer_id = customers.id
      LEFT JOIN legal_entities our_legal_entity ON v.our_legal_entity_id = our_legal_entity.id
      LEFT JOIN warehouses ON v.warehouse_id = warehouses.id
      LEFT JOIN persons approved_persons ON v.approved_by_person_id = approved_persons.id
      LEFT JOIN persons accepted_persons ON v.accepted_by_person_id = accepted_persons.id
      LEFT JOIN sections ON v.section_id = sections.id
      WHERE v.name ILIKE $2
      ORDER BY v.name ASC
      LIMIT $3 OFFSET $4
      `,
      [current_sections, `%${query}%`, ITEMS_PER_PAGE, offset],
    );
    return invoices.rows;
  } catch (error) {
    console.error("Ошибка фильтрации VATInvoices:", error);
    throw new Error(
      "Не удалось загрузить отфильтрованные VATInvoices:" + String(error),
    );
  }
}

export async function fetchVatInvoicesPages(
  query: string,
  current_sections: string,
) {
  try {
    const count = await pool.query(
      `
      WITH your_vat_invoices AS ( SELECT * FROM "vat_invoices" WHERE section_id = ANY ($1::uuid[]))
      SELECT COUNT(*) FROM your_vat_invoices WHERE name ILIKE $2
      `,
      [current_sections, `%${query}%`],
    );
    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Ошибка подсчёта страниц VATInvoices:", error);
    throw new Error(
      "Не удалось определить количество страниц: " + String(error),
    );
  }
}
//#endregion
