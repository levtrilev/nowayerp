
'use client';


import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder, initialQuery }: { placeholder: string; initialQuery?: string }) {
  const pathname = usePathname();
  const { replace } = useRouter();

  // Инициализируем напрямую из пропсов. 
  // Сервер и клиент сгенерируют одинаковый HTML, ошибки гидратации не будет.
  const [searchTerm, setSearchTerm] = useState(initialQuery || '');

  const handleSearch = useDebouncedCallback((term) => {
    // Читаем текущие параметры safely через window
    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        id="search"
        className="peer block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500
        py-[9px] pl-10 text-sm placeholder:text-gray-500 outline-none transition-colors"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          handleSearch(e.target.value);
        }}
        // --- ЗАЩИТА ОТ ОШИБОК ГИДРАТАЦИИ ---
        // 1. Говорит React игнорировать различия в атрибутах этого конкретного тега
        suppressHydrationWarning 
        // 2. Отключает автозаполнение браузера, которое ломает DOM
        autoComplete="off"
        // 3. Специфичные атрибуты, чтобы менеджеры паролей и Grammarly не лезли в input
        data-lpignore="true"
        data-form-type="other"
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}

// import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
// import { useSearchParams, usePathname, useRouter } from 'next/navigation';
// import { useDebouncedCallback } from 'use-debounce';

// export default function Search({ placeholder }: { placeholder: string }) {

//   const searchParams = useSearchParams();
//   const pathname = usePathname();
//   const { replace } = useRouter();

//   const handleSearch = useDebouncedCallback((term) => {
//     // console.log(`Searching... ${term}`);
//     const params = new URLSearchParams(searchParams);
//     params.set('page', '1');
//     if (term) {
//       params.set('query', term);
//     } else {
//       params.delete('query');
//     }
//     replace(`${pathname}?${params.toString()}`);
//   }, 300);

//   return (
//     <div className="relative flex flex-1 flex-shrink-0">
//       <label htmlFor="search" className="sr-only">
//         Search
//       </label>
//       <input
//         id='search'
//         className="peer block w-full h-10 rounded-md border border-gray-300 group-focus-within:border-blue-500
//         py-[9px] pl-10 text-sm placeholder:text-gray-500"
//         placeholder={placeholder}
//         onChange={(e) => {
//           handleSearch(e.target.value);
//         }}
//         onFocus={(e) => e.target.style.borderColor = '#3b82f6'} // blue-500
//         onBlur={(e) => e.target.style.borderColor = '#d2d6dc'}  // gray-300
//         defaultValue={searchParams.get('query')?.toString()}
//       />
//       <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
//     </div>
//   );
// }
