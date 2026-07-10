import { CarForm } from "@/app/lib/definitions";
import BtnDeleteCar from "./btn-delete-car";
import { BtnEditCarLink } from "./cars-buttons";

export default function CarsTableNaked({ cars, showDeleteButton = false, loadCars, userId, current_sections, readonly_permission }:
  { cars: CarForm[], showDeleteButton?: boolean, loadCars?: () => Promise<void>, userId: string, current_sections: string, readonly_permission: boolean }) {
  return (
    <div className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              {/* Таблица для больших экранов */}
              <table className="table-fixed hidden w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium sm:pl-6">Автомобиль</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium sm:pl-6">Клиент</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium sm:pl-6">Марка</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium sm:pl-6">Модель</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium sm:pl-6">Год выпуска</th>
                    <th scope="col" className="w-2/12 px-4 py-5 font-medium sm:pl-6">Гос.номер</th>
                    <th scope="col" className="w-1/12 px-4 py-5 font-medium"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {cars.map((car) => (
                    <tr key={car.id} className="group">
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        <a
                          href={`/erp/cars/${car.id}/edit`}
                          className="text-blue-800 underline"
                        >
                          {car.name}
                        </a>
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {car.customer_name}
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {car.make}
                      </td>
                      <td className="w-2/16 overflow-hidden whitespace-nowrap bg-white px-4 py-1 text-sm">
                        {car.model}
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {car.year}
                      </td>
                      <td className="w-2/12 overflow-hidden whitespace-nowrap bg-white py-2 pl-6 pr-3 text-sm text-black">
                        {car.gos_number}
                      </td>
                      <td className="w-1/12 whitespace-nowrap py-2 pr-3">
                        <div className="flex justify-end gap-3">
                          {showDeleteButton && <BtnDeleteCar
                            id={car.id}
                            name={car.name}
                            userId={userId}
                            current_sections={current_sections}
                            readonly_permission={readonly_permission}
                            onDelete={loadCars ?? (() => { })} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Карточки для мобильных устройств */}
              <div className="md:hidden">
                {cars.map((car) => (
                  <div
                    key={car.id}
                    className="mb-4 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-blue-800 underline">
                        <a href={`/erp/cars/${car.id}/edit`}>
                          {car.name}
                        </a>
                      </h3>
                      <div className="flex gap-2">
                        <BtnEditCarLink id={car.id} />
                        {showDeleteButton && <BtnDeleteCar
                          id={car.id}
                          name={car.name}
                          userId={userId}
                          current_sections={current_sections}
                          readonly_permission={readonly_permission}
                          onDelete={loadCars ?? (() => { })} />}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}