// Persons actions

"use server";

import { z } from "zod";
import pool from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PersonForm, Person } from "@/app/lib/definitions";

const ITEMS_PER_PAGE = 8;

//#region createPerson

export async function createPerson(person: Person) {
  const session = await auth();
  const username = session?.user?.name;
  const date_created = new Date().toISOString();
  const { name, person_user_id, person_user_name, profession, tabel_number, section_id, tenant_id, author_id } = person;
  try {
    await pool.query(
      `
      INSERT INTO persons (
        name, person_user_id, person_user_name, profession, tabel_number,
        username, section_id, timestamptz,
        tenant_id, author_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [name, person_user_id, person_user_name, profession, tabel_number, username, section_id, date_created, tenant_id, author_id]
    );
  } catch (error) {
    console.error("Не удалось создать Person:", error);
    throw new Error("Не удалось создать Person:" + String(error));
  }

  revalidatePath("/erp/persons");
  // redirect("/erp/persons");
}

//#endregion

//#region Update/Delete Person

export async function updatePerson(person: Person) {
  const session = await auth();
  const username = session?.user?.name;

  const { id, name, person_user_id, person_user_name, profession, tabel_number, section_id, tenant_id, author_id } = person;

  try {
    await pool.query(
      `
      UPDATE persons SET
        name = $1,
        person_user_id = $2,
        person_user_name = $3,
        profession = $4, 
        tabel_number = $5,
        username = $6,
        section_id = $7,
        tenant_id = $8,
        author_id = $9,
        timestamptz = now()
      WHERE id = $10
    `,
      [name, person_user_id, person_user_name, profession, tabel_number, username, section_id, tenant_id, author_id, id]
    );
  } catch (error) {
    console.error("Не удалось обновить Person:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось обновить Person: " + String(error)
    );
  }

  revalidatePath("/erp/persons");
}

export async function deletePerson(id: string) {
  try {
    await pool.query(`DELETE FROM persons WHERE id = $1`, [id]);
  } catch (error) {
    console.error("Ошибка удаления Person:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось удалить Person: " + String(error)
    );
  }
  revalidatePath("/erp/persons");
}

//#endregion

//#region Fetch Persons

export async function fetchPerson(id: string, current_sections: string) {
  try {
    const data = await pool.query<Person>(
      `
      WITH your_persons AS ( SELECT * FROM persons where section_id = 
      ANY ($1::uuid[]))

      SELECT
        id,
        name,
        person_user_id,
        COALESCE(person_user_name, '') as person_user_name,
        profession,
        tabel_number,
        username,
        editing_by_user_id,
        editing_since,
        timestamptz,
        section_id
      FROM your_persons persons
      WHERE id = $2
    `,
      [current_sections, id]
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения Person по ID:", err);
    throw new Error("Не удалось получить Person:" + String(err));
  }
}

export async function fetchPersonForm(id: string, current_sections: string) {
  try {
    const data = await pool.query<PersonForm>(
      `
      WITH your_persons AS ( SELECT * FROM persons where section_id = 
      ANY ($1::uuid[]))

      SELECT
        persons.id,
        persons.name,
        persons.person_user_id,
        COALESCE(persons.person_user_name, '') as person_user_name,
        persons.profession,
        persons.tabel_number,
        persons.username,
        persons.section_id,
        persons.editing_by_user_id,
        persons.editing_since,
        persons.timestamptz,
        sections.name AS section_name
      FROM your_persons persons
      LEFT JOIN sections ON persons.section_id = sections.id
      WHERE persons.id = $2
    `,
      [current_sections, id]
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения формы Person:", err);
    throw new Error("Не удалось получить данные формы Person:" + String(err));
  }
}

export async function fetchPersons(current_sections: string) {
  try {
    const data = await pool.query<Person>(
      `
      WITH your_persons AS ( SELECT * FROM persons where section_id = 
      ANY ($1::uuid[]))

      SELECT
        id,
        name,
        person_user_id,
        COALESCE(person_user_name, '') as person_user_name,
        profession,
        tabel_number,
        section_id,
        username,
        timestamptz,
        date_created
      FROM your_persons persons
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

export async function fetchPersonsForm(current_sections: string) {
  try {
    const data = await pool.query<PersonForm>(
      `
      WITH your_persons AS ( SELECT * FROM persons where section_id = 
      ANY ($1::uuid[]))

      SELECT
        persons.id,
        persons.name,
        persons.person_user_id,
        COALESCE(persons.person_user_name, '') as person_user_name,
        persons.profession,
        persons.tabel_number,
        persons.username,
        persons.timestamptz,
        sections.name AS section_name
      FROM your_persons persons
      LEFT JOIN sections ON persons.section_id = sections.id
      ORDER BY persons.name ASC
    `,
      [current_sections]
    );

    return data.rows;
  } catch (err) {
    console.error("Ошибка получения форм Persons:", err);
    throw new Error("Не удалось загрузить формы Persons:" + String(err));
  }
}

//#endregion

//#region Filtered Persons

export async function fetchFilteredPersons(
  query: string,
  currentPage: number,
  current_sections: string,
  rows_per_page?: number
) {
  const offset = (currentPage - 1) * (rows_per_page || ITEMS_PER_PAGE);

  try {
    const persons = await pool.query<PersonForm>(
      `
      WITH your_persons AS ( SELECT * FROM persons where section_id = 
      ANY ($1::uuid[]))

      SELECT
        persons.id,
        persons.name,
        persons.person_user_id,
        COALESCE(persons.person_user_name, '') as person_user_name,
        persons.profession,
        persons.tabel_number,        
        persons.username,
        persons.timestamptz
      FROM your_persons persons
      WHERE
        persons.name ILIKE $2
        OR persons.person_user_name ILIKE $2
        OR persons.profession ILIKE $2
        OR persons.tabel_number ILIKE $2
      ORDER BY persons.name ASC
      LIMIT $3 OFFSET $4
    `,
      [current_sections, `%${query}%`, (rows_per_page || ITEMS_PER_PAGE), offset]
    );

    return persons.rows;
  } catch (error) {
    console.error("Ошибка фильтрации Объектов(таблица persons):", error);
    throw new Error("Не удалось загрузить отфильтрованные Объекты:" + error);
  }
}

export async function fetchPersonsPages(
  query: string,
  current_sections: string,
  rows_per_page?: number
) {
  try {
    const count = await pool.query(
      `
      WITH your_persons AS ( SELECT * FROM persons where section_id = 
      ANY ($1::uuid[]))

      SELECT COUNT(*) FROM your_persons persons
      WHERE persons.name ILIKE $2
    `,
      [current_sections, `%${query}%`]
    );

    const totalPages = Math.ceil(Number(count.rows[0].count) / (rows_per_page || ITEMS_PER_PAGE));
    return totalPages;
  } catch (error) {
    console.error("Ошибка подсчёта страниц Persons:", error);
    throw new Error("Не удалось определить количество страниц.");
  }
}

//#endregion
