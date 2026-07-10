// Delete car button.tsx

'use client';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';
import MessageBoxSrv from '@/app/lib/message-box-srv';
import { deleteCar, fetchCar } from './cars-actions';
import { setIsShowMessageBoxCancel } from '@/app/store/useDocumentStore';
import { Car } from '@/app/lib/definitions';

export default function BtnDeleteCar({ id, name, userId, current_sections, readonly_permission, onDelete }
  : { id: string, name: string, userId: string, current_sections: string, readonly_permission: boolean, onDelete: () => void }) {
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [messageBoxText, setMessageBoxText] = useState('');
  const idToDelete = useRef('');

  const askUserForDeleting = (id: string, name: string) => {
    setIsMessageBoxOpen(true);
    idToDelete.current = id;
    setMessageBoxText(`Машина: ${name} \nУдалить мшину?`);
  };

  const deleteTaskWithId = askUserForDeleting.bind(null, id, name);

  const handleOK = async () => {
    const freshRecord: Car = await fetchCar(idToDelete.current, current_sections);
    const isDeletable =
      !readonly_permission &&
      (freshRecord.editing_by_user_id === null ||
        // freshWarehouseRecord.editing_by_user_id === userId ||
        (freshRecord.editing_since && new Date(freshRecord.editing_since) < new Date(Date.now() - 30 * 60 * 1000)));
    if (isDeletable) {
      try {
        await deleteCar(idToDelete.current);
        onDelete();
      } catch (error) {
        setMessageBoxText(String(error));
        setIsMessageBoxOpen(true);
        setIsShowMessageBoxCancel(false);
      }
    } else {
      const msg = readonly_permission ? 'Недостаточно прав для удаления автомобиля!'
        : freshRecord.editing_by_user_id === userId ? 'Вы редактируете этот документ в другом окне!'
          : freshRecord.editing_since ? 'Документ редактируется другим пользователем!' : 'Что-то пошло не так!';
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
        onClick={deleteTaskWithId}
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