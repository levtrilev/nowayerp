// LegalEntities actions
"use server";
import { z } from "zod";
import pool from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LegalEntityForm, LegalEntity } from "@/app/lib/definitions";

const ITEMS_PER_PAGE = 8;

//#region Create LegalEntity
export async function createLegalEntity(legalEntity: LegalEntity) {
  const session = await auth();
  const username = session?.user?.name;
  const timestamptz = new Date().toISOString();
  const {
    name,
    fullname,
    inn,
    address_legal,
    phone,
    email,
    contact,
    is_customer,
    is_supplier,
    kpp,
    region_id,
    section_id,
    user_tags,
    access_tags,
    tenant_id,
    author_id,
  } = legalEntity;

  try {
    await pool.query(
      `
INSERT INTO legal_entities (
name,
fullname,
inn,
address_legal,
phone,
email,
contact,
is_customer,
is_supplier,
kpp,
region_id,
section_id,
user_tags,
access_tags,
username,
tenant_id,
author_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
`,
      [
        name,
        fullname,
        inn,
        address_legal,
        phone,
        email,
        contact,
        is_customer,
        is_supplier,
        kpp,
        region_id,
        section_id,
        JSON.stringify(user_tags),
        JSON.stringify(access_tags),
        username,
        tenant_id,
        author_id,
      ]
    );
  } catch (error) {
    console.error("Не удалось создать LegalEntity:", error);
    throw new Error("Не удалось создать LegalEntity:" + String(error));
  }
  revalidatePath("/erp/legal-entities");
}

//#endregion

//#region Update/Delete LegalEntity
export async function updateLegalEntity(legalEntity: LegalEntity) {
  const session = await auth();
  const username = session?.user?.name;
  const {
    id,
    name,
    fullname,
    inn,
    address_legal,
    phone,
    email,
    contact,
    is_customer,
    is_supplier,
    kpp,
    region_id,
    section_id,
    user_tags,
    access_tags,
    tenant_id,
    author_id,
  } = legalEntity;

  try {
    await pool.query(
      `
UPDATE legal_entities SET
name = $1,
fullname = $2,
inn = $3,
address_legal = $4,
phone = $5,
email = $6,
contact = $7,
is_customer = $8,
is_supplier = $9,
kpp = $10,
region_id = $11,
section_id = $12,
user_tags = $13,
access_tags = $14,
username = $15,
timestamptz = now(),
tenant_id = $16,
author_id = $17
WHERE id = $18
`,
      [
        name,
        fullname,
        inn,
        address_legal,
        phone,
        email,
        contact,
        is_customer,
        is_supplier,
        kpp,
        region_id,
        section_id,
        JSON.stringify(user_tags),
        JSON.stringify(access_tags),
        username,
        tenant_id,
        author_id,
        id,
      ]
    );
  } catch (error) {
    console.error("Не удалось обновить LegalEntity:", error);
    throw new Error("Ошибка базы данных: Не удалось обновить LegalEntity: " + error);
  }
  revalidatePath("/erp/legal-entities");
}

export async function deleteLegalEntity(id: string) {
  try {
    await pool.query(`DELETE FROM legal_entities WHERE id = $1`, [id]);
  } catch (error) {
    console.error("Ошибка удаления LegalEntity:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось удалить LegalEntity: " + String(error)
    );
  }
  revalidatePath("/erp/legal-entities");
}
//#endregion

//#region Fetch LegalEntities
export async function fetchLegalEntity(id: string, current_sections: string) {
  try {
    const data = await pool.query<LegalEntity>(
      `
WITH your_legal_entities AS ( SELECT * FROM legal_entities where section_id =
ANY ($1::uuid[]))
SELECT
id,
name,
fullname,
inn,
address_legal,
phone,
email,
contact,
is_customer,
is_supplier,
kpp,
region_id,
section_id,
user_tags,
access_tags,
username,
editing_by_user_id,
editing_since,
timestamptz
FROM your_legal_entities
WHERE id = $2::uuid
`,
      [current_sections, id]
    );
    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения LegalEntity по ID:", err);
    throw new Error("Не удалось получить LegalEntity:" + String(err));
  }
}

export async function fetchLegalEntityForm(id: string, current_sections: string) {
  console.log("fetchLegalEntityForm by id:", id);
  console.log("current_sections:", current_sections);
  try {
    const data = await pool.query<LegalEntityForm>(
      `
WITH your_legal_entities AS ( SELECT * FROM legal_entities where section_id =
ANY ($1::uuid[]))
SELECT
le.id,
le.name,
le.fullname,
le.inn,
le.address_legal,
le.phone,
le.email,
le.contact,
le.is_customer,
le.is_supplier,
le.kpp,
le.region_id,
le.section_id,
le.user_tags,
le.access_tags,
le.username,
le.editing_by_user_id,
le.editing_since,
le.timestamptz,
le.tenant_id,
le.author_id,
le.editor_id,
COALESCE(regions.name, '') as region_name,
COALESCE(sections.name, '') as section_name
FROM your_legal_entities le
LEFT JOIN sections ON le.section_id = sections.id
LEFT JOIN regions ON le.region_id = regions.id
WHERE le.id = $2::uuid
`,
      [current_sections, id]
    );
    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения формы LegalEntity:", err);
    throw new Error("Не удалось получить данные формы LegalEntity:" + String(err));
  }
}

export async function fetchLegalEntities(current_sections: string) {
  try {
    const data = await pool.query<LegalEntity>(
      `
WITH your_legal_entities AS ( SELECT * FROM legal_entities where section_id =
ANY ($1::uuid[]))
SELECT
id,
name,
fullname,
inn,
address_legal,
phone,
email,
contact,
is_customer,
is_supplier,
kpp,
region_id,
section_id,
user_tags,
access_tags,
tenant_id,
author_id,
username,
timestamptz
FROM your_legal_entities
ORDER BY name ASC
`,
      [current_sections]
    );
    return data.rows;
  } catch (err) {
    console.error("Ошибка получения списка юрлиц:", err);
    throw new Error("Не удалось загрузить список юрлиц:" + String(err));
  }
}

export async function fetchLegalEntitiesForm(current_sections: string) {
  try {
    const data = await pool.query<LegalEntityForm>(
      `
WITH your_legal_entities AS ( SELECT * FROM legal_entities where section_id =
ANY ($1::uuid[]))
SELECT
le.id,
le.name,
le.fullname,
le.inn,
le.address_legal,
le.phone,
le.email,
le.contact,
le.is_customer,
le.is_supplier,
le.kpp,
le.region_id,
le.section_id,
le.user_tags,
le.access_tags,
le.username,
le.editing_by_user_id,
le.editing_since,
le.timestamptz,
le.tenant_id,
le.author_id,
le.editor_id,
COALESCE(regions.name, '') as region_name,
COALESCE(sections.name, '') as section_name
FROM your_legal_entities le
LEFT JOIN sections ON le.section_id = sections.id
LEFT JOIN regions ON le.region_id = regions.id
ORDER BY le.name ASC
`,
      [current_sections]
    );
    return data.rows;
  } catch (err) {
    console.error("Ошибка получения форм LegalEntities:", err);
    throw new Error("Не удалось загрузить формы LegalEntities:" + String(err));
  }
}
//#endregion

//#region Filtered LegalEntities
export async function fetchFilteredLegalEntities(
  query: string,
  currentPage: number,
  current_sections: string,
  rows_per_page?: number
) {
  const offset = (currentPage - 1) * (rows_per_page || ITEMS_PER_PAGE);
  try {
    const legalEntities = await pool.query<LegalEntityForm>(
      `
WITH your_legal_entities AS ( SELECT * FROM legal_entities where section_id =
ANY ($1::uuid[]))
SELECT
le.id,
le.name,
le.fullname,
le.inn,
le.address_legal,
le.phone,
le.email,
le.contact,
le.is_customer,
le.is_supplier,
le.kpp,
le.region_id,
le.section_id,
le.user_tags,
le.access_tags,
le.username,
le.editing_by_user_id,
le.editing_since,
le.timestamptz,
le.tenant_id,
le.author_id,
le.editor_id,
COALESCE(regions.name, '') as region_name,
COALESCE(sections.name, '') as section_name
FROM your_legal_entities le
LEFT JOIN sections ON le.section_id = sections.id
LEFT JOIN regions ON le.region_id = regions.id
WHERE
le.name ILIKE $2
ORDER BY le.name ASC
LIMIT $3 OFFSET $4
`,
      [
        current_sections,
        `%${query}%`,
        rows_per_page || ITEMS_PER_PAGE,
        offset,
      ]
    );
    return legalEntities.rows;
  } catch (error) {
    console.error("Ошибка фильтрации LegalEntities:", error);
    throw new Error(
      "Не удалось загрузить отфильтрованные LegalEntities:" + String(error)
    );
  }
}

export async function fetchLegalEntitiesPages(
  query: string,
  current_sections: string,
  rows_per_page?: number
) {
  try {
    const count = await pool.query(
      `
WITH your_legal_entities AS ( SELECT * FROM legal_entities where section_id =
ANY ($1::uuid[]))
SELECT COUNT(*) FROM your_legal_entities
WHERE name ILIKE $2
`,
      [current_sections, `%${query}%`]
    );
    const totalPages = Math.ceil(
      Number(count.rows[0].count) / (rows_per_page || ITEMS_PER_PAGE)
    );
    return totalPages;
  } catch (error) {
    console.error("Ошибка подсчёта страниц LegalEntities:", error);
    throw new Error("Не удалось определить количество страниц.");
  }
}
//#endregion