// Delete LegalEntity button.tsx

'use client';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';
import MessageBoxSrv from '@/app/lib/message-box-srv';
import { deleteLegalEntity, fetchLegalEntity } from './legal-entities-actions';
import { setIsShowMessageBoxCancel } from '@/app/store/del_useMessageBoxStore';
import { DocUserPermissions, LegalEntity } from '@/app/lib/definitions';
import { checkReadonly } from '@/app/lib/common-utils';

export default function BtnDeleteLegalEntity({ id, name, userId, readonly_permission, current_sections, onDelete }
: { id: string; name: string; userId: string; readonly_permission: boolean; current_sections: string; onDelete: () => void }) {
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [messageBoxText, setMessageBoxText] = useState('');
  const idToDelete = useRef('');

  const askUserForDeleting = (id: string, name: string) => {
    setIsMessageBoxOpen(true);
    idToDelete.current = id;
    setMessageBoxText(`Юрлицо: ${name}\nУдалить юрлицо?`);
  };

  const deleteLegalEntityWithId = askUserForDeleting.bind(null, id, name);

  const handleOK = async () => {
    const freshLegalEntityRecord: LegalEntity = await fetchLegalEntity(idToDelete.current, current_sections);

    const isDeletable =
      !readonly_permission &&
      (freshLegalEntityRecord.editing_by_user_id === null ||
      // freshLegalEntityRecord.editing_by_user_id === userId ||
      (freshLegalEntityRecord.editing_since && new Date(freshLegalEntityRecord.editing_since) < new Date(Date.now() - 30 * 60 * 1000)));

    if (isDeletable) {
      try {
        await deleteLegalEntity(idToDelete.current);
        onDelete();
      } catch (error) {
        setMessageBoxText(String(error));
        setIsMessageBoxOpen(true);
        setIsShowMessageBoxCancel(false);
      }
    } else {
      const msg = readonly_permission ? 'Недостаточно прав для удаления юрлица!'
        : freshLegalEntityRecord.editing_by_user_id === userId ? 'Вы редактируете этот документ в другом окне!'
        : freshLegalEntityRecord.editing_since ? 'Документ редактируется другим пользователем!' : 'Что-то пошло не так!';

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
        onClick={deleteLegalEntityWithId}
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
// import { deleteLegalEntity } from './legal-entities-actions';
// import { setIsShowMessageBoxCancel } from '@/app/store/del_useMessageBoxStore';

// export default function BtnDeleteLegalEntity({ id, name, onDelete }: { id: string; name: string; onDelete: () => void }) {
//   const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
//   const [messageBoxText, setMessageBoxText] = useState('');
//   const idToDelete = useRef('');

//   const askUserForDeleting = (id: string, name: string) => {
//     setIsMessageBoxOpen(true);
//     idToDelete.current = id;
//     setMessageBoxText(`Юрлицо: ${name}\nУдалить юрлицо?`);
//   };

//   const deleteLegalEntityWithId = askUserForDeleting.bind(null, id, name);

//   const handleOK = async () => {
//     try {
//       await deleteLegalEntity(idToDelete.current);
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
//         onClick={deleteLegalEntityWithId}
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