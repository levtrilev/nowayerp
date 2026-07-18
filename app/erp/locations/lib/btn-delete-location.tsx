
// Delete Location button.tsx

'use client';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';
import MessageBoxSrv from '@/app/lib/message-box-srv';
import { deleteLocation, fetchLocation } from './locations-actions';
import { setIsShowMessageBoxCancel } from '@/app/store/del_useMessageBoxStore';
import { DocUserPermissions, Location } from '@/app/lib/definitions';
import { checkReadonly } from '@/app/lib/common-utils';

export default function BtnDeleteLocation({ id, name, userId, readonly_permission, current_sections }
: { id: string; name: string; userId: string; readonly_permission: boolean; current_sections: string }) {
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [messageBoxText, setMessageBoxText] = useState('');
  const idToDelete = useRef('');

  const askUserForDeleting = (id: string, name: string) => {
    setIsMessageBoxOpen(true);
    idToDelete.current = id;
    setMessageBoxText(`Локация: ${name}\nУдалить локацию?`);
  };

  const deleteLocationWithId = askUserForDeleting.bind(null, id, name);

  const handleOK = async () => {
    const freshLocationRecord: Location = await fetchLocation(idToDelete.current, current_sections);

    const isDeletable =
      !readonly_permission &&
      (freshLocationRecord.editing_by_user_id === null ||
      // freshLocationRecord.editing_by_user_id === userId ||
      (freshLocationRecord.editing_since && new Date(freshLocationRecord.editing_since) < new Date(Date.now() - 30 * 60 * 1000)));

    if (isDeletable) {
      try {
        await deleteLocation(idToDelete.current);
      } catch (error) {
        setMessageBoxText(String(error));
        setIsMessageBoxOpen(true);
        setIsShowMessageBoxCancel(false);
      }
    } else {
      const msg = readonly_permission ? 'Недостаточно прав для удаления локации!'
        : freshLocationRecord.editing_by_user_id === userId ? 'Вы редактируете этот документ в другом окне!'
        : freshLocationRecord.editing_since ? 'Документ редактируется другим пользователем!' : 'Что-то пошло не так!';

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
        onClick={deleteLocationWithId}
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
// import { deleteLocation } from './locations-actions';

// export default function BtnDeleteLocation({ id, name }: { id: string; name: string }) {
//   const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
//   const [messageBoxText, setMessageBoxText] = useState('');
//   const idToDelete = useRef('');

//   const askUserForDeleting = (id: string, name: string) => {
//     setIsMessageBoxOpen(true);
//     idToDelete.current = id;
//     setMessageBoxText(`Локация: ${name} \nУдалить локацию?`);
//   };

//   const deleteLocationWithId = askUserForDeleting.bind(null, id, name);

//   const handleOK = () => {
//     deleteLocation(idToDelete.current);
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
//         onClick={deleteLocationWithId}
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