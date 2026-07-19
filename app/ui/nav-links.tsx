'use client';

import {
  UserGroupIcon,
  HomeIcon,
  MapPinIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

// Map of links to display in the side navigation.
const links = [
  { name: 'Ремонт', href: '#', icon: HomeIcon },
  { name: 'Главное', href: '/erp', icon: MapPinIcon },
  { name: 'Руководителю', href: '/dashboard', icon: ArrowRightCircleIcon },
  { name: 'Торговля', href: '#', icon: SparklesIcon },
  { name: 'Справочники', href: '#', icon: BookOpenIcon },
  { name: 'Помещения', href: '#', icon: BuildingOfficeIcon }, //premise
  { name: 'Администрирование', href: '/admin', icon: UserGroupIcon },
  // { name: 'Lesson', href: '/dashboard/lesson', icon: HomeIcon },
];
const subMenu = [
  { mainItem: 'Торговля', name: 'Заказы', href: '/erp/vat-invoices' },
  // { mainItem: 'Продажи', name: 'Счета к получению', href: '/erp/invoices' },
  { mainItem: 'Торговля', name: 'Остатки товаров', href: '/ledger/stock' },
  { mainItem: 'Торговля', name: 'Оборот товаров', href: '/ledger/stock/turns' },
  { mainItem: 'Администрирование', name: 'Пользователи', href: '/admin/users' },
  { mainItem: 'Администрирование', name: 'Организации', href: '/admin/tenants' },
  { mainItem: 'Администрирование', name: 'Разделы', href: '/admin/sections' },
  { mainItem: 'Администрирование', name: 'Роли', href: '/admin/roles' },
  { mainItem: 'Администрирование', name: 'Полномочия', href: '/admin/permissions' },
  { mainItem: 'Справочники', name: 'Юридические лица', href: '/erp/legal-entities' },
  { mainItem: 'Справочники', name: 'Регионы', href: '/erp/regions' },
  { mainItem: 'Справочники', name: 'Товары', href: '/erp/goods' },
  { mainItem: 'Справочники', name: 'Автомобили', href: '/erp/cars' },
  { mainItem: 'Справочники', name: 'Склады', href: '/erp/warehouses' },
  { mainItem: 'Справочники', name: 'Локации', href: '/erp/locations' },
  { mainItem: 'Справочники', name: 'Сотрудники', href: '/erp/persons' },
  { mainItem: 'Справочники', name: 'Объекты', href: '/erp/objects' },
  { mainItem: 'Справочники', name: 'Участки', href: '/erp/units' },
  { mainItem: 'Помещения', name: 'Помещения', href: '/erp/premises' },
  { mainItem: 'Помещения', name: 'Планы обслуживания', href: '/erp/task-schedules' },
  { mainItem: 'Помещения', name: 'Задачи обслуживания', href: '/erp/tasks' },
  { mainItem: 'Ремонт', name: 'АРМ', href: '/repair/arm' },
  { mainItem: 'Ремонт', name: 'Объекты', href: '/repair/objects' },
  { mainItem: 'Ремонт', name: 'Участки', href: '/erp/units' },
  { mainItem: 'Ремонт', name: 'Машины', href: '/repair/machines' },
  { mainItem: 'Ремонт', name: 'Заявки', href: '/repair/claims' },
  { mainItem: 'Ремонт', name: 'Наряд-заказы', href: '/repair/workorders' },
  { mainItem: 'Ремонт', name: 'Запчасти', href: '/repair/parts' },
  { mainItem: 'Ремонт', name: 'Системы', href: '/repair/systems' },
  { mainItem: 'Ремонт', name: 'Работы', href: '/repair/works' },
  { mainItem: 'Ремонт', name: 'Операции', href: '/repair/operations' },

  // { mainItem: 'Home', name: 'About', href: '/dashboard' },
  // { mainItem: 'Home', name: 'Contacts', href: '/dashboard' },
  // { mainItem: 'Home', name: 'Support', href: '/dashboard' },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Закрыть подменю при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <div key={link.name} className="relative">
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setActiveMenu(activeMenu === link.name ? null : link.name)}
              // className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
              className={clsx(
                'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
                {
                  'bg-sky-100 text-blue-600': pathname === link.href,
                },
              )}
            >
              <LinkIcon className="w-6" />
              <p className="hidden md:block">{link.name}</p>
            </Link>

            {/* Submenu */}
            {activeMenu === link.name && subMenu.findIndex(obj => obj.mainItem === link.name) !== -1 && (
              <div ref={menuRef}
                className="absolute left-0 top-full mt-2 w-48 rounded-md bg-white shadow-lg hover:bg-sky-100 hover:text-blue-600
                  md:absolute md:left-60 md:top-full md:w-48 md:rounded-md md:shadow-lg
                   sm:absolute sm:left-0 sm:top-0 sm:w-full sm:rounded-none sm:bg-gray-100 sm:shadow-none">

                <ul className="py-2">
                  {subMenu.map((item, index) => (link.name === item.mainItem &&
                    <li key={index}>
                      <Link
                        href={item.href}
                        onClick={() => setActiveMenu(null)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
