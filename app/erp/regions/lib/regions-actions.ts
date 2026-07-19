// Regions actions

"use server";

import { z } from "zod";
import pool from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegionForm, Region } from "@/app/lib/definitions";

const ITEMS_PER_PAGE = 8;

//#region Create Region

export async function createRegion(region: RegionForm | Region) {
  const session = await auth();
  const username = session?.user?.name;
  const date_created = new Date().toISOString();
  const {
    name,
    capital,
    area,
    code,
    section_id,
    tenant_id,
    author_id,
    access_tags,
    user_tags,
    date,
  } = region;
  try {
    await pool.query(
      `
      INSERT INTO regions (
        name, capital, area, code,
        username, section_id, timestamptz,
        tenant_id, author_id, access_tags, user_tags, date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
      [
        name,
        capital,
        area,
        code,
        username,
        section_id,
        date_created,
        tenant_id,
        author_id,
        access_tags,
        user_tags,
        date,
      ]
    );
  } catch (error) {
    console.error("Не удалось создать Region:", error);
    throw new Error("Не удалось создать Region:" + String(error));
  }

   revalidatePath("/erp/regions");
   // redirect("/erp/regions");
}

//#endregion

//#region Update/Delete Region

export async function updateRegion(region: Region) {
  const session = await auth();
  const username = session?.user?.name;

  const {
    id,
    name,
    capital,
    area,
    code,
    section_id,
    tenant_id,
    author_id,
    access_tags,
    user_tags,
    date,
  } = region;

  try {
    await pool.query(
      `
      UPDATE regions SET
        name = $1,
        capital = $2,
        area = $3,
        code = $4,
        username = $5,
        section_id = $6,
        tenant_id = $7,
        author_id = $8,
        timestamptz = now(),
        access_tags = $9,
        user_tags = $10,
        date = $11
      WHERE id = $12
    `,
      [
        name,
        capital,
        area,
        code,
        username,
        section_id,
        tenant_id,
        author_id,
        access_tags,
        user_tags,
        date,
        id,
      ]
    );
  } catch (error) {
    console.error("Не удалось обновить Region:", error);
    throw new Error("Ошибка базы данных: Не удалось обновить Region: " + String(error));
  }

   revalidatePath("/erp/regions");
}

export async function deleteRegion(id: string) {
  try {
    await pool.query(`DELETE FROM regions WHERE id = $1`, [id]);
  } catch (error) {
    console.error("Ошибка удаления Region:", error);
    throw new Error("Ошибка базы данных: Не удалось удалить Region: " + String(error));
  }
   revalidatePath("/erp/regions");
}

//#endregion

//#region Fetch Regions

export async function fetchRegion(id: string, current_sections: string) {
  try {
    const data = await pool.query<Region>(
      `
      WITH your_regions AS ( SELECT * FROM regions where section_id = 
      ANY ($1::uuid[]))

      SELECT
        id,
        name,
        capital,
        area,
        code,
        username,
        section_id,
        editing_by_user_id,
        editing_since,
        timestamptz,
        date,
        access_tags,
        user_tags
      FROM your_regions regions
      WHERE id = $2
    `,
      [current_sections, id]
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения Region по ID:", err);
    throw new Error("Не удалось получить Region:" + String(err));
  }
}

export async function fetchRegionForm(id: string, current_sections: string) {
  try {
    const data = await pool.query<RegionForm>(
      `
      WITH your_regions AS ( SELECT * FROM regions where section_id = 
      ANY ($1::uuid[]))

      SELECT
        regions.id,
        regions.name,
        regions.capital,
        regions.area,
        regions.code,
        regions.username,
        regions.section_id,
        regions.editing_by_user_id,
        regions.editing_since,
        regions.timestamptz,
        regions.date,
        regions.access_tags,
        regions.user_tags,
        sections.name AS section_name
      FROM your_regions regions
      LEFT JOIN sections ON regions.section_id = sections.id
      WHERE regions.id = $2
    `,
      [current_sections, id]
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения формы Region:", err);
    throw new Error("Не удалось получить данные формы Region.");
  }
}

export async function fetchRegions(current_sections: string) {
  try {
    const data = await pool.query<Region>(
      `
      WITH your_regions AS ( SELECT * FROM regions where section_id = 
      ANY ($1::uuid[]))

      SELECT
        id,
        name,
        capital,
        area,
        code,
        section_id,
        username,
        timestamptz,
        date_created
      FROM your_regions regions
      ORDER BY name ASC
    `,
      [current_sections]
    );

    return data.rows;
  } catch (err) {
    console.error("Ошибка получения списка Region:", err);
    throw new Error("Не удалось загрузить список Region:" + String(err));
  }
}

export async function fetchRegionsForm(current_sections: string) {
  try {
    const data = await pool.query<RegionForm>(
      `
      WITH your_regions AS ( SELECT * FROM regions where section_id = 
      ANY ($1::uuid[]))

      SELECT
        regions.id,
        regions.name,
        regions.capital,
        regions.area,
        regions.code,
        regions.username,
        regions.timestamptz
      FROM your_regions regions
      ORDER BY regions.name ASC
    `,
      [current_sections]
    );

    return data.rows;
  } catch (err) {
    console.error("Ошибка получения форм Regions:", err);
    throw new Error("Не удалось загрузить формы Regions:" + String(err));
  }
}

//#endregion

//#region Filtered Regions

export async function fetchFilteredRegions(query: string, currentPage: number, current_sections: string) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const regions = await pool.query<RegionForm>(
      `
      WITH your_regions AS ( SELECT * FROM regions where section_id = 
      ANY ($1::uuid[]))

      SELECT
        regions.id,
        regions.name,
        regions.capital,
        regions.area,
        regions.code,
        regions.username,
        regions.timestamptz
      FROM your_regions regions
      WHERE
        regions.name ILIKE $2
      ORDER BY regions.name ASC
      LIMIT $3 OFFSET $4
    `,
      [current_sections, `%${query}%`, ITEMS_PER_PAGE, offset]
    );

    return regions.rows;
  } catch (error) {
    console.error("Ошибка фильтрации Регионов(таблица regions):", error);
    throw new Error("Не удалось загрузить отфильтрованные Регионы:" + String(error));
  }
}

export async function fetchRegionsPages(query: string, current_sections: string) {
  try {
    const count = await pool.query(
      `
      WITH your_regions AS ( SELECT * FROM regions where section_id = 
      ANY ($1::uuid[]))

      SELECT COUNT(*) FROM your_regions regions
      WHERE regions.name ILIKE $2
    `,
      [current_sections, `%${query}%`]
    );

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Ошибка подсчёта страниц Regions:", error);
    throw new Error("Не удалось определить количество страниц: " + String(error));
  }
}

//#endregion