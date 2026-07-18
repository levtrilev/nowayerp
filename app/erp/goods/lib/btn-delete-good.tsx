// // Delete Good button.tsx

'use client';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';
import MessageBoxSrv from '@/app/lib/message-box-srv';
// Добавляем импорт fetchGood для получения свежей записи
import { deleteGood, fetchGood } from './goods-actions'; 
import { setIsShowMessageBoxCancel } from '@/app/store/del_useMessageBoxStore';
// Добавляем тип Good (если он называется иначе, поправьте)
import { Good } from '@/app/lib/definitions'; 

export default function BtnDeleteGood({ 
  id, 
  name, 
  userId,               // Добавили
  readonly_permission,  // Добавили
  current_sections,     // Добавили (если нужно для fetchGood, как в складах)
  onDelete 
}: { 
  id: string; 
  name: string; 
  userId: string; 
  readonly_permission: boolean; 
  current_sections: string; 
  onDelete: () => void 
}) {
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [messageBoxText, setMessageBoxText] = useState('');
  const idToDelete = useRef('');

  const askUserForDeleting = (id: string, name: string) => {
    setIsMessageBoxOpen(true);
    idToDelete.current = id;
    setMessageBoxText(`Товар: ${name}\nУдалить товар?`);
  };

  const deleteGoodWithId = askUserForDeleting.bind(null, id, name);

  const handleOK = async () => {
    // 1. Запрашиваем свежую версию записи из БД
    // (Если fetchGood не принимает current_sections, уберите второй аргумент)
    const freshGoodRecord: Good = await fetchGood(idToDelete.current, current_sections);

    // 2. Проверяем права и статус блокировки
    const isDeletable =
      !readonly_permission &&
      (freshGoodRecord.editing_by_user_id === null ||
        (freshGoodRecord.editing_since && new Date(freshGoodRecord.editing_since) < new Date(Date.now() - 30 * 60 * 1000)));

    if (isDeletable) {
      try {
        await deleteGood(idToDelete.current);
        onDelete();
      } catch (error) {
        setMessageBoxText(String(error));
        setIsMessageBoxOpen(true);
        setIsShowMessageBoxCancel(false);
      }
    } else {
      // 3. Формируем специфичное сообщение об ошибке
      const msg = readonly_permission 
        ? 'Недостаточно прав для удаления товара!'
        : freshGoodRecord.editing_by_user_id === userId 
          ? 'Вы редактируете этот документ в другом окне!'
          : freshGoodRecord.editing_since 
            ? 'Документ редактируется другим пользователем!' 
            : 'Что-то пошло не так!';
            
      setMessageBoxText(msg);
      setIsMessageBoxOpen(true);
      setIsShowMessageBoxCancel(false);
    }
  };

  const handleCancel = () => {
    setIsMessageBoxOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="rounded-md border border-gray-200 p-2 h-10 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={deleteGoodWithId}
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5 h-5 text-gray-800" />
      </button>
      <MessageBoxSrv
        isMessageBoxOpen={isMessageBoxOpen}
        messageBoxText={messageBoxText}
        isShowCancel={true}
        isShowOk={true}
        cbOk={handleOK}
        cbCancel={handleCancel}
      />
    </>
  );
}

// import { TrashIcon } from '@heroicons/react/24/outline';
// import { useState, useRef } from 'react';
// import MessageBoxSrv from '@/app/lib/message-box-srv';
// import { deleteGood } from './goods-actions';
// import { setIsShowMessageBoxCancel } from '@/app/store/del_useMessageBoxStore';

// export default function BtnDeleteGood({ id, name, onDelete }: { id: string; name: string; onDelete: () => void }) {
//   const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
//   const [messageBoxText, setMessageBoxText] = useState('');
//   const idToDelete = useRef('');

//   const askUserForDeleting = (id: string, name: string) => {
//     setIsMessageBoxOpen(true);
//     idToDelete.current = id;
//     setMessageBoxText(`Товар: ${name}\nУдалить товар?`);
//   };

//   const deleteGoodWithId = askUserForDeleting.bind(null, id, name);

//   const handleOK = async () => {
//     try {
//       await deleteGood(idToDelete.current);
//       onDelete();
//     } catch (error) {
//       setMessageBoxText(String(error));
//       setIsMessageBoxOpen(true);
//       setIsShowMessageBoxCancel(false);
//     }
//   };

//   const handleCancel = () => {
//     setIsMessageBoxOpen(false);
//   };

//   return (
//     <>
//       <button
//         type="button"
//         className="rounded-md border border-gray-200 p-2 h-10 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         onClick={deleteGoodWithId}
//       >
//         <span className="sr-only">Delete</span>
//         <TrashIcon className="w-5 h-5 text-gray-800" />
//       </button>
//       <MessageBoxSrv
//         isMessageBoxOpen={isMessageBoxOpen}
//         messageBoxText={messageBoxText}
//         isShowCancel={true}
//         isShowOk={true}
//         cbOk={handleOK}
//         cbCancel={handleCancel}
//       />
//     </>
//   );
// }