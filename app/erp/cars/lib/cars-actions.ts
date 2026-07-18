// Cars actions

"use server";

// import { z } from "zod";
import pool from "@/db";
import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CarForm, Car } from "@/app/lib/definitions";

const ITEMS_PER_PAGE = 8;

//#region Create Task

export async function createCar(car: Car) {
  const session = await auth();
  const username = session?.user?.name;
  const date_created = new Date().toISOString();
  const {
    name,
    model,
    gos_number,
    make,
    vin,
    year,
    customer_id,
    car_status,
    unit_id,
    location_id,
    section_id,
    tenant_id,
    author_id,
  } = car;
  try {
    await pool.query(
      `
      INSERT INTO cars (
        name, model, gos_number, make, vin, year, customer_id,
        car_status, unit_id, location_id,
        username, section_id, timestamptz,
        tenant_id, author_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `,
      [
        name,
        model,
        gos_number,
        make,
        vin,
        year,
        customer_id,
        car_status,
        unit_id,
        location_id,
        username,
        section_id,
        date_created,
        tenant_id,
        author_id,
      ],
    );
  } catch (error) {
    console.error("Не удалось создать car:", error);
    throw new Error("Не удалось создать car:" + String(error));
  }

  revalidatePath("/repair/cars");
}

//#endregion

//#region Update/Delete car

export async function updateCar(car: Car) {
  const session = await auth();
  const username = session?.user?.name;

  const {
    id,
    name,
    model,
    gos_number,
    make,
    vin,
    year,
    customer_id,
    car_status,
    unit_id,
    location_id,
    section_id,
    tenant_id,
    author_id,
    doc_status,
  } = car;

  try {
    await pool.query(
      `
      UPDATE cars SET
        name = $1, model = $2, gos_number = $3, make = $4, vin = $5, year = $6,
        customer_id = $7, 
        car_status = $8, 
        unit_id = $9, 
        location_id = $10,
        username = $11,
        section_id = $12,
        tenant_id = $13,
        author_id = $14,
        doc_status = $15,
        timestamptz = now()
      WHERE id = $16
    `,
      [
        name,
        model,
        gos_number,
        make,
        vin,
        year,
        customer_id,
        car_status,
        unit_id,
        location_id,
        username,
        section_id,
        tenant_id,
        author_id,
        doc_status,
        id,
      ],
    );
  } catch (error) {
    console.error("Не удалось обновить car:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось обновить car: " + String(error),
    );
  }

  revalidatePath("/repair/cars");
}

export async function deleteCar(id: string) {
  try {
    await pool.query(`DELETE FROM cars WHERE id = $1`, [id]);
  } catch (error) {
    console.error("Ошибка удаления car:", error);
    throw new Error(
      "Ошибка базы данных: Не удалось удалить car: " + String(error),
    );
  }
  revalidatePath("/repair/cars");
}

//#endregion

//#region Fetch cars

export async function fetchCar(id: string, current_sections: string) {
  try {
    const data = await pool.query<Car>(
      `
      WITH your_cars AS ( SELECT * FROM cars where section_id = 
        ANY ($1::uuid[]))

      SELECT
        id,
        name, model, gos_number, make, vin, year, customer_id,
        car_status, unit_id, location_id,
        username,
        editing_by_user_id,
        editing_since,
        timestamptz,
        date_created,
        section_id,
        tenant_id,
        author_id,
        editor_id,
        doc_status
      FROM your_cars
      WHERE id = $2
    `,
      [current_sections, id],
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения car по ID:", err);
    throw new Error("Не удалось получить car:" + String(err));
  }
}

export async function fetchCarForm(id: string, current_sections: string) {
  try {
    const data = await pool.query<CarForm>(
      `
      WITH your_cars AS ( SELECT * FROM cars where section_id = 
        ANY ($1::uuid[]))

      SELECT
        cars.id,
        cars.name, cars.name, cars.model, cars.gos_number, cars.make, cars.vin, cars.year,
        cars.customer_id,
        cars.car_status, 
        cars.unit_id, 
        cars.location_id,
        cars.username,
        cars.section_id,
        cars.tenant_id,
        cars.author_id,
        cars.editor_id,
        cars.doc_status,
        cars.editing_by_user_id,
        cars.editing_since,
        cars.timestamptz,
        sections.name AS section_name,
        COALESCE(units.name, '') as unit_name,
        COALESCE(locations.name, '') as location_name,
        COALESCE(customers.name, '') as customer_name
      FROM your_cars cars
      LEFT JOIN sections ON cars.section_id = sections.id
      LEFT JOIN units ON cars.unit_id = units.id
      LEFT JOIN locations ON cars.location_id = locations.id
      LEFT JOIN legal_entities AS customers ON cars.customer_id = customers.id
      WHERE cars.id = $2
    `,
      [current_sections, id],
    );

    return data.rows[0];
  } catch (err) {
    console.error("Ошибка получения формы car:", err);
    throw new Error("Не удалось получить данные формы car: " + String(err));
  }
}

export async function fetchCars(current_sections: string) {
  try {
    const data = await pool.query<Car>(
      `
      WITH your_cars AS ( SELECT * FROM cars where section_id = 
        ANY ($1::uuid[]))

      SELECT
        id,
        name, model, gos_number, make, vin, year, customer_id,
        car_status, unit_id, location_id,
        section_id,
        tenant_id,
        author_id,
        editor_id,
        doc_status,
        username,
        timestamptz,
        date_created
      FROM your_cars
      ORDER BY name ASC
    `,
      [current_sections],
    );

    return data.rows;
  } catch (err) {
    console.error("Ошибка получения списка задач:", err);
    throw new Error("Не удалось загрузить список задач: " + String(err));
  }
}

export async function fetchCarsForm(
  current_sections: string,
  legalEntityId?: string,
) {
  if (!legalEntityId) return [];

  const customerId = legalEntityId ?? null;
  try {
    const data = await pool.query<CarForm>(
      `
      WITH your_cars AS ( SELECT * FROM cars where section_id = 
        ANY ($1::uuid[]))

      SELECT
        cars.id,
        cars.name,
        cars.unit_id,
        cars.location_id,
        cars.car_status,
        cars.model,
        cars.gos_number, cars.make, cars.vin, cars.year, cars.customer_id,
        cars.section_id,
        cars.tenant_id,
        cars.author_id,
        cars.editor_id,
        cars.doc_status,
        cars.date_created,
        cars.username,
        cars.timestamptz,
        sections.name AS section_name,
        COALESCE(units.name, '') as unit_name,
        COALESCE(locations.name, '') as location_name,
        COALESCE(customers.name, '') as customer_name
      FROM your_cars cars
      LEFT JOIN sections ON cars.section_id = sections.id
      LEFT JOIN units ON cars.unit_id = units.id
      LEFT JOIN locations ON cars.location_id = locations.id
      LEFT JOIN legal_entities AS customers ON cars.customer_id = customers.id
      WHERE $2::uuid IS NULL OR cars.customer_id = $2::uuid
      ORDER BY cars.name ASC
      `,
      [current_sections, customerId],
    );

    return customerId ? data.rows : [];
  } catch (err) {
    console.error("Ошибка получения форм cars:", err);
    throw new Error("Не удалось загрузить формы cars:" + String(err));
  }
}

//#endregion

//#region Filtered cars

export async function fetchFilteredCars(
  query: string,
  currentPage: number,
  current_sections: string,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const cars = await pool.query<CarForm>(
      `
      WITH your_cars AS ( SELECT * FROM cars where section_id = 
        ANY ($1::uuid[]))

      SELECT
        cars.id,
        cars.name,
        cars.unit_id,
        cars.location_id,
        cars.car_status,
        cars.model,
        cars.gos_number, cars.make, cars.vin, cars.year, cars.customer_id,
        cars.section_id,
        cars.tenant_id,
        cars.author_id,
        cars.editor_id,
        cars.doc_status,
        cars.username,
        cars.timestamptz,
        sections.name AS section_name,
        COALESCE(units.name, '') as unit_name,
        COALESCE(locations.name, '') as location_name,
        COALESCE(customers.name, '') as customer_name
      FROM your_cars cars
      LEFT JOIN sections ON cars.section_id = sections.id
      LEFT JOIN units ON cars.unit_id = units.id
      LEFT JOIN locations ON cars.location_id = locations.id
      LEFT JOIN legal_entities AS customers ON cars.customer_id = customers.id
      WHERE
        cars.name ILIKE $2 
      -- AND ($5 = 'парк' OR $5 = 'персонал' OR cars.car_status = $5)
      ORDER BY cars.name ASC
      LIMIT $3 OFFSET $4
    `,
      [current_sections, `%${query}%`, ITEMS_PER_PAGE, offset],
    );

    return cars.rows;
  } catch (error) {
    console.error("Ошибка фильтрации Автомобилей(таблица cars):", error);
    throw new Error(
      "Не удалось загрузить отфильтрованные Автомобили: " + String(error),
    );
  }
}

export async function fetchCarsPages(query: string, current_sections: string) {
  try {
    const count = await pool.query(
      `
      WITH your_cars AS ( SELECT * FROM cars where section_id = 
        ANY ($1::uuid[]))

      SELECT COUNT(*) FROM your_cars
      WHERE your_cars.name ILIKE $2
    `,
      [current_sections, `%${query}%`],
    );

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Ошибка подсчёта страниц cars:", error);
    throw new Error(
      "Не удалось определить количество страниц: " + String(error),
    );
  }
}

//#endregion
