"use server";
import { z } from "zod";
import pool from "@/db";
import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { WarehouseForm, Warehouse } from "@/app/lib/definitions";

const ITEMS_PER_PAGE = 8;

//#region Create Warehouse
export async function createWarehouse(warehouse: Warehouse) {
  const session = await auth();
  const username = session?.user?.name;
  // const date_created = new Date().toISOString();
  const {
    name,
    section_id,
    tenant_id,
    doc_status
  } = warehouse;

  try {
    await pool.query(
      `
      INSERT INTO warehouses (
        name,
        username,
        section_id,
        tenant_id,
        doc_status
      ) VALUES ($1, $2, $3, $4, $5)
      `,
      [
        name,
        username,
        section_id,
        tenant_id,
        doc_status,
      ]
    );
  } catch (error) {
    console.error("Не удалось создать Warehouse:", error);
    throw new Error("Не удалось создать Warehouse:" + String(error));
  }
  revalidatePath("/erp/warehouses");
}

//#endregion

//#region Update/Delete Warehouse
export async function updateWarehouse(warehouse: Warehouse) {
  const session = await auth();
  const username = session?.user?.name;
  const {
    id,
    name,
    section_id,
    tenant_id,
    doc_status,
  } = warehouse;

  try {
    await pool.query(
      `
      UPDATE warehouses SET
        name = $1,
        username = $2,
        section_id = $3,
        tenant_id = $4,
        doc_status = $5,
        timestamptz = now()
      WHERE id = $6
      `,
      [
        name,
        username,
        section_id,
        tenant_id,
        doc_status,
        id,
      ]
    );
  } catch (error) {
    console.error("Не удалось обновить Warehouse:", error);
    throw new Error("Ошибка базы данных: Не удалось обновить Warehouse: " + error);
  }
  revalidatePath("/erp/warehouses");
}

export async function deleteWarehouse(id: string) {
  try {
    await pool.query(`DELETE FROM warehouses WHERE id = $1`, [id]);
  } catch (error) {
    console.error("Ошибка удаления Warehouse:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось удалить Warehouse: " + String(error)
    );
  }
  revalidatePath("/erp/warehouses");
}
//#endregion

//#region Fetch Warehouses
export async function fetchWarehouse(id: string, current_sections: string) {
  try {
    const data = await pool.query<Warehouse>(
      `
      WITH your_warehouses AS ( SELECT * FROM warehouses WHERE section_id = ANY ($1::uuid[]))
      SELECT
        id,
        name,
        username,
        editing_by_user_id,
        editing_since,
        timestamptz,
        section_id,
        tenant_id,
        doc_status
      FROM your_warehouses
      WHERE id = $2
      `,
      [current_sections, id]
    );
    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения Warehouse по ID:", err);
    throw new Error("Не удалось получить Warehouse:" + String(err));
  }
}

export async function fetchWarehouseForm(id: string, current_sections: string) {
  try {
    const data = await pool.query<WarehouseForm>(
      `
      WITH your_warehouses AS ( SELECT * FROM warehouses WHERE section_id = ANY ($1::uuid[]))
      SELECT
        warehouses.id,
        warehouses.name,
        warehouses.username,
        warehouses.section_id,
        warehouses.tenant_id,
        warehouses.doc_status,
        warehouses.editing_by_user_id,
        warehouses.editing_since,
        warehouses.timestamptz,
        COALESCE(sections.name, '') as section_name
      FROM your_warehouses warehouses
      LEFT JOIN sections ON warehouses.section_id = sections.id
      WHERE warehouses.id = $2
      `,
      [current_sections, id]
    );
    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения формы Warehouse:", err);
    throw new Error("Не удалось получить данные формы Warehouse:" + String(err));
  }
}

export async function fetchWarehouses(current_sections: string) {
  try {
    const data = await pool.query<Warehouse>(
      `
      WITH your_warehouses AS ( SELECT * FROM warehouses WHERE section_id = ANY ($1::uuid[]))
      SELECT
        id,
        name,
        section_id,
        tenant_id,
        doc_status,
        username,
        timestamptz
      FROM your_warehouses
      ORDER BY name ASC
      `,
      [current_sections]
    );
    return data.rows;
  } catch (err) {
    console.error("Ошибка получения списка складов:", err);
    throw new Error("Не удалось загрузить список складов:" + String(err));
  }
}

export async function fetchWarehousesForm(current_sections: string) {
  try {
    const data = await pool.query<WarehouseForm>(
      `
      WITH your_warehouses AS ( SELECT * FROM warehouses WHERE section_id = ANY ($1::uuid[]))
      SELECT
        warehouses.id,
        warehouses.name,
        warehouses.username,
        warehouses.section_id,
        warehouses.tenant_id,
        warehouses.doc_status,
        warehouses.editing_by_user_id,
        warehouses.editing_since,
        warehouses.timestamptz,
        COALESCE(sections.name, '') as section_name
      FROM your_warehouses warehouses
      LEFT JOIN sections ON warehouses.section_id = sections.id
      WHERE warehouses.doc_status = 'active'
      ORDER BY warehouses.name ASC
      `,
      [current_sections]
    );
    return data.rows;
  } catch (err) {
    console.error("Ошибка получения форм Warehouses:", err);
    throw new Error("Не удалось загрузить формы Warehouses:" + String(err));
  }
}
//#endregion

//#region Filtered Warehouses
export async function fetchFilteredWarehouses(
  query: string,
  currentPage: number,
  current_sections: string,
  rows_per_page?: number
) {
  const offset = (currentPage - 1) * (rows_per_page || ITEMS_PER_PAGE);
  try {
    const warehouses = await pool.query<WarehouseForm>(
      `
      WITH your_warehouses AS ( SELECT * FROM warehouses WHERE section_id = ANY ($1::uuid[]))
      SELECT
        warehouses.id,
        warehouses.name,
        warehouses.username,
        warehouses.section_id,
        warehouses.tenant_id,
        warehouses.doc_status,
        warehouses.editing_by_user_id,
        warehouses.editing_since,
        warehouses.timestamptz,
        sections.name AS section_name
      FROM your_warehouses warehouses
      LEFT JOIN sections ON warehouses.section_id = sections.id
      WHERE
        warehouses.name ILIKE $2
      ORDER BY warehouses.name ASC
      LIMIT $3 OFFSET $4
      `,
      [
        current_sections,
        `%${query}%`,
        rows_per_page || ITEMS_PER_PAGE,
        offset,
      ]
    );
    return warehouses.rows;
  } catch (error) {
    console.error("Ошибка фильтрации Warehouses (таблица warehouses):", error);
    throw new Error(
      "Не удалось загрузить отфильтрованные Warehouses:" + String(error)
    );
  }
}

export async function fetchWarehousesPages(
  query: string,
  current_sections: string,
  rows_per_page?: number
) {
  try {
    const count = await pool.query(
      `
      WITH your_warehouses AS ( SELECT * FROM warehouses WHERE section_id = ANY ($1::uuid[]))
      SELECT COUNT(*) FROM your_warehouses
      WHERE name ILIKE $2
      `,
      [current_sections, `%${query}%`]
    );
    const totalPages = Math.ceil(
      Number(count.rows[0].count) / (rows_per_page || ITEMS_PER_PAGE)
    );
    return totalPages;
  } catch (error) {
    console.error("Ошибка подсчёта страниц Warehouses:", error);
    throw new Error("Не удалось определить количество страниц.");
  }
}
//#endregion