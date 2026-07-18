// Locations actions

"use server";

import { z } from "zod";
import pool from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LocationForm, Location } from "@/app/lib/definitions";

const ITEMS_PER_PAGE = 8;

//#region Create Task

export async function createLocation(location: Location) {
  const session = await auth();
  const username = session?.user?.name;
  const date_created = new Date().toISOString();
  const { name, section_id, tenant_id, author_id } = location;
  try {
    await pool.query(
      `
      INSERT INTO locations (
        name, 
        username, section_id, timestamptz,
        tenant_id, author_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [name, username, section_id, date_created, tenant_id, author_id],
    );
  } catch (error) {
    console.error("Не удалось создать Location:", error);
    throw new Error("Не удалось создать Location:" + String(error));
  }

  revalidatePath("/erp/locations");
  // redirect("/erp/locations");
}

//#endregion

//#region Update/Delete Location

export async function updateLocation(location: Location) {
  const session = await auth();
  const username = session?.user?.name;

  const { id, name, section_id, tenant_id, author_id } = location;

  try {
    await pool.query(
      `
      UPDATE locations SET
        name = $1,
        username = $2,
        section_id = $4,
        tenant_id = $5,
        author_id = $6,
        timestamptz = now()
      WHERE id = $3
    `,
      [name, username, id, section_id, tenant_id, author_id],
    );
  } catch (error) {
    console.error("Не удалось обновить Location:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось обновить Location: " + error,
    );
  }

  revalidatePath("/erp/locations");
}

export async function deleteLocation(id: string) {
  try {
    await pool.query(`DELETE FROM locations WHERE id = $1`, [id]);
  } catch (error) {
    console.error("Ошибка удаления Location:", error);
    throw new Error("Ошибка базы данных: Не удалось удалить Location.");
  }
  revalidatePath("/erp/locations");
}

//#endregion

//#region Fetch Locations

export async function fetchLocation(id: string, current_sections: string) {
  try {
    const data = await pool.query<Location>(
      `
      WITH your_locations AS ( SELECT * FROM locations where section_id = 
        ANY ($1::uuid[]))

        SELECT
        id,
        name,
        username,
        section_id,
        editing_by_user_id,
        editing_since,
        timestamptz
      FROM your_locations
      WHERE id = $2
    `,
      [current_sections, id],
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения Location по ID:", err);
    throw new Error("Не удалось получить Location:" + String(err));
  }
}

export async function fetchLocationForm(id: string, current_sections: string) {
  try {
    const data = await pool.query<LocationForm>(
      `
      WITH your_locations AS ( SELECT * FROM locations where section_id = 
        ANY ($1::uuid[]))

        SELECT
        locations.id,
        locations.name,
        locations.username,
        locations.section_id,
        locations.editing_by_user_id,
        locations.editing_since,
        locations.timestamptz,
        sections.name AS section_name
      FROM your_locations locations
      LEFT JOIN sections ON locations.section_id = sections.id
      WHERE locations.id = $2
    `,
      [current_sections, id],
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения формы Location:", err);
    throw new Error("Не удалось получить данные формы Location.");
  }
}

export async function fetchLocations(current_sections: string) {
  try {
    const data = await pool.query<Location>(
      `
      WITH your_locations AS ( SELECT * FROM locations where section_id = 
        ANY ($1::uuid[]))

        SELECT
        id,
        name,
        section_id,
        username,
        timestamptz,
        date_created
      FROM your_locations
      ORDER BY name ASC
    `,
      [current_sections],
    );

    return data.rows;
  } catch (err) {
    console.error("Ошибка получения списка задач:", err);
    throw new Error("Не удалось загрузить список задач.");
  }
}

export async function fetchLocationsForm(current_sections: string) {
  try {
    const data = await pool.query<LocationForm>(
      `
      WITH your_locations AS ( SELECT * FROM locations where section_id = 
        ANY ($1::uuid[]))

      SELECT
        locations.id,
        locations.name,
        locations.username,
        locations.timestamptz
      FROM your_locations locations
      ORDER BY locations.name ASC
    `,
      [current_sections],
    );

    return data.rows;
  } catch (err) {
    console.error("Ошибка получения форм Locations:", err);
    throw new Error("Не удалось загрузить формы Locations:" + String(err));
  }
}

//#endregion

//#region Filtered Locations

export async function fetchFilteredLocations(
  query: string,
  currentPage: number,
  current_sections: string,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const locations = await pool.query<LocationForm>(
      `
      WITH your_locations AS ( SELECT * FROM locations where section_id = 
        ANY ($1::uuid[]))

        SELECT
        locations.id,
        locations.name,
        locations.username,
        locations.timestamptz
      FROM your_locations locations
      WHERE
        locations.name ILIKE $2
      ORDER BY locations.name ASC
      LIMIT $3 OFFSET $4
    `,
      [current_sections, `%${query}%`, ITEMS_PER_PAGE, offset],
    );

    return locations.rows;
  } catch (error) {
    console.error("Ошибка фильтрации Locations (таблица locations):", error);
    throw new Error("Не удалось загрузить отфильтрованные Locations:" + error);
  }
}

export async function fetchLocationsPages(
  query: string,
  current_sections: string,
) {
  try {
    const count = await pool.query(
      `
      WITH your_locations AS ( SELECT * FROM locations where section_id = 
        ANY ($1::uuid[]))

        SELECT COUNT(*) FROM your_locations locations
      WHERE locations.name ILIKE $2
    `,
      [current_sections, `%${query}%`],
    );

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Ошибка подсчёта страниц Locations:", error);
    throw new Error("Не удалось определить количество страниц.");
  }
}

//#endregion
