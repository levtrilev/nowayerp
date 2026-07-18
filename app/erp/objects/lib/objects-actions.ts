// Objects actions

"use server";

import { z } from "zod";
import pool from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ObjectForm, Object } from "@/app/lib/definitions";

const ITEMS_PER_PAGE = 8;

//#region Create Task

export async function createObject(object: Object) {
  const session = await auth();
  const username = session?.user?.name;
  const date_created = new Date().toISOString();
  const {
    name,
    section_id,
    tenant_id,
    author_id,
  } = object;
  try {
    await pool.query(
      `
      INSERT INTO objects (
        name, 
        username, section_id, timestamptz,
        tenant_id, author_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        name,
        username,
        section_id,
        date_created,
        tenant_id,
        author_id,
      ]
    );
  } catch (error) {
    console.error("Не удалось создать Object:", error);
    throw new Error("Не удалось создать Object:" + String(error));
  }

  revalidatePath("/repair/objects");
  // redirect("/repair/objects");
}

//#endregion

//#region Update/Delete Object

export async function updateObject(object: Object) {
  const session = await auth();
  const username = session?.user?.name;

  const {
    id,
    name,
    section_id,
    tenant_id,
    author_id,
  } = object;

  try {
    await pool.query(
      `
      UPDATE objects SET
        name = $1,
        username = $2,
        section_id = $4,
        tenant_id = $5,
        author_id = $6,
        timestamptz = now()
      WHERE id = $3
    `,
      [
        name,
        username,
        id,
        section_id,
        tenant_id,
        author_id,
      ]
    );
  } catch (error) {
    console.error("Не удалось обновить Object:", error);
    throw new Error("Ошибка базы данных: Не удалось обновить Object: " + String(error));
  }

  revalidatePath("/repair/objects");
}

export async function deleteObject(id: string) {
  try {
    await pool.query(`DELETE FROM objects WHERE id = $1`, [id]);
  } catch (error) {
    console.error("Ошибка удаления Object:", error);
    throw new Error("Ошибка базы данных: Не удалось удалить Object: " + String(error));
  }
  revalidatePath("/repair/objects");
}

//#endregion

//#region Fetch Objects

export async function fetchObject(id: string, current_sections: string) {
  try {
    const data = await pool.query<Object>(
      `
      WITH your_objects AS ( SELECT * FROM objects where section_id = 
      ANY ($1::uuid[]))

      SELECT
        id,
        name,
        username,
        section_id,
        editing_by_user_id,
        editing_since,
        timestamptz
      FROM your_objects objects
      WHERE id = $2
    `,
      [current_sections, id]
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения Object по ID:", err);
    throw new Error("Не удалось получить Object:" + String(err));
  }
}

export async function fetchObjectForm(id: string, current_sections: string) {
  try {
    const data = await pool.query<ObjectForm>(
      `
      WITH your_objects AS ( SELECT * FROM objects where section_id = 
      ANY ($1::uuid[]))

      SELECT
        objects.id,
        objects.name,
        objects.username,
        objects.section_id,
        objects.editing_by_user_id,
        objects.editing_since,
        objects.timestamptz,
        sections.name AS section_name
      FROM your_objects objects
      LEFT JOIN sections ON objects.section_id = sections.id
      WHERE objects.id = $2
    `,
      [current_sections, id]
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения формы Object:", err);
    throw new Error("Не удалось получить данные формы Object.");
  }
}

export async function fetchObjects(current_sections: string) {
  try {
    const data = await pool.query<Object>(
      `
      WITH your_objects AS ( SELECT * FROM objects where section_id = 
      ANY ($1::uuid[]))

      SELECT
        id,
        name,
        section_id,
        username,
        timestamptz,
        date_created
      FROM your_objects objects
      ORDER BY name ASC
    `,
      [current_sections]
    );

    return data.rows;
  } catch (err) {
    console.error("Ошибка получения списка задач:", err);
    throw new Error("Не удалось загрузить список задач:" + String(err));
  }
}

export async function fetchObjectsForm(current_sections: string) {
  try {
    const data = await pool.query<ObjectForm>(
      `
      WITH your_objects AS ( SELECT * FROM objects where section_id = 
      ANY ($1::uuid[]))

      SELECT
        objects.id,
        objects.name,
        objects.username,
        objects.timestamptz
      FROM your_objects objects
      ORDER BY objects.name ASC
    `,
      [current_sections]
    );

    return data.rows;
  } catch (err) {
    console.error("Ошибка получения форм Objects:", err);
    throw new Error("Не удалось загрузить формы Objects:" + String(err));
  }
}

//#endregion

//#region Filtered Objects

export async function fetchFilteredObjects(query: string, currentPage: number, current_sections: string) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const objects = await pool.query<ObjectForm>(
      `
      WITH your_objects AS ( SELECT * FROM objects where section_id = 
      ANY ($1::uuid[]))

      SELECT
        objects.id,
        objects.name,
        objects.username,
        objects.timestamptz
      FROM your_objects objects
      WHERE
        objects.name ILIKE $2
      ORDER BY objects.name ASC
      LIMIT $3 OFFSET $4
    `,
      [current_sections, `%${query}%`, ITEMS_PER_PAGE, offset]
    );

    return objects.rows;
  } catch (error) {
    console.error("Ошибка фильтрации Объектов(таблица objects):", error);
    throw new Error("Не удалось загрузить отфильтрованные Объекты:" + String(error));
  }
}

export async function fetchObjectsPages(query: string, current_sections: string) {
  try {
    const count = await pool.query(
      `
      WITH your_objects AS ( SELECT * FROM objects where section_id = 
      ANY ($1::uuid[]))

      SELECT COUNT(*) FROM your_objects objects
      WHERE objects.name ILIKE $2
    `,
      [current_sections, `%${query}%`]
    );

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Ошибка подсчёта страниц Objects:", error);
    throw new Error("Не удалось определить количество страниц: " + String(error));
  }
}

//#endregion
