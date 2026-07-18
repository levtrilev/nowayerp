// Delete Person button.tsx

'use client';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';
import MessageBoxSrv from '@/app/lib/message-box-srv';
import { deletePerson, fetchPerson } from './persons-actions';
import { setIsShowMessageBoxCancel } from '@/app/store/del_useMessageBoxStore';
import { DocUserPermissions, Person } from '@/app/lib/definitions';
import { checkReadonly } from '@/app/lib/common-utils';

export default function BtnDeletePerson({ id, name, user_id, readonly_permission, current_sections }
: { id: string; name: string; user_id: string; readonly_permission: boolean; current_sections: string }) {
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [messageBoxText, setMessageBoxText] = useState('');
  const idToDelete = useRef('');

  const askUserForDeleting = (id: string, name: string) => {
    setIsMessageBoxOpen(true);
    idToDelete.current = id;
    setMessageBoxText(`Сотрудник: ${name}\nУдалить сотрудника?`);
  };

  const deletePersonWithId = askUserForDeleting.bind(null, id, name);

  const handleOK = async () => {
    const freshPersonRecord: Person = await fetchPerson(idToDelete.current, current_sections);

    const isDeletable =
      !readonly_permission &&
      (freshPersonRecord.editing_by_user_id === null ||
      // freshPersonRecord.editing_by_user_id === user_id ||
      (freshPersonRecord.editing_since && new Date(freshPersonRecord.editing_since) < new Date(Date.now() - 30 * 60 * 1000)));

    if (isDeletable) {
      try {
        await deletePerson(idToDelete.current);
      } catch (error) {
        setMessageBoxText(String(error));
        setIsMessageBoxOpen(true);
        setIsShowMessageBoxCancel(false);
      }
    } else {
      const msg = readonly_permission ? 'Недостаточно прав для удаления сотрудника!'
        : freshPersonRecord.editing_by_user_id === user_id ? 'Вы редактируете этот документ в другом окне!'
        : freshPersonRecord.editing_since ? 'Документ редактируется другим пользователем!' : 'Что-то пошло не так!';

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
        onClick={deletePersonWithId}
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

// 'use client';
// import { TrashIcon } from '@heroicons/react/24/outline';
// import { useState, useRef } from 'react';
// import MessageBoxSrv from '@/app/lib/message-box-srv';
// import { deletePerson } from './persons-actions';

// export default function BtnDeletePerson({ id, name }: { id: string, name: string }) {
//   const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
//   const [messageBoxText, setMessageBoxText] = useState('');
//   const idToDelete = useRef('');

//   const askUserForDeleting = (id: string, name: string) => {
//     setIsMessageBoxOpen(true);
//     idToDelete.current = id;
//     setMessageBoxText(`Сотрудник: ${name} \nУдалить сотрудника?`);
//   };

//   const deleteTaskWithId = askUserForDeleting.bind(null, id, name);

//   const handleOK = () => {
//     deletePerson(idToDelete.current);
//     setIsMessageBoxOpen(false);
//   };

//   const handleCancel = () => {
//     setIsMessageBoxOpen(false);
//   };

//   return (
//     <>
//       <button
//         type="button"
//         className="rounded-md border border-gray-200 p-2 h-10 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         onClick={deleteTaskWithId}
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