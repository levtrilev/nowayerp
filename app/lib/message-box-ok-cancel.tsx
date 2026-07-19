import React, { FC } from 'react';
// import { setIsCancelButtonPressed, setIsMessageBoxOpen, setIsOKButtonPressed, useIsMessageBoxOpen, useIsShowMessageBoxCancel, useMessageBoxText } from "@/app/store/useMessageBoxStore";
import { setIsCancelButtonPressed, setIsMessageBoxOpen, setIsOKButtonPressed, setMessageBoxText, useMessageBox } from '@/app/store/useDocumentStore';

const MessageBoxOKCancel: FC = () => {
  // const isMessageBoxOpen = useIsMessageBoxOpen();
  // const messageBoxText = useMessageBoxText();
  // const isShowMessageBoxCancel = useIsShowMessageBoxCancel();
  const msgBox = useMessageBox();

  if (!msgBox.isMessageBoxOpen) return null;

  return (
    <div id="message-box" className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <p className="text-lg mb-4 whitespace-pre-line">{String(msgBox.messageBoxText)}</p>
        <div className="flex justify-end space-x-3">
          {msgBox.isShowMessageBoxCancel && <button
            onClick={() => { setIsMessageBoxOpen(false); setIsOKButtonPressed(false); setIsCancelButtonPressed(true) }}
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none"
          >
            Cancel
          </button>}
          <button
            onClick={() => {
              if (msgBox.messageBoxText === 'Документ сохранен.') {
                setIsOKButtonPressed(true);
                setIsCancelButtonPressed(false);
                setMessageBoxText('');
              } else {
                setIsOKButtonPressed(true); 
                setIsCancelButtonPressed(false);
              }
              setIsMessageBoxOpen(false);
            }}
            className="px-4 py-2 bg-red-300 text-white rounded-md hover:bg-red-700 focus:outline-none"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBoxOKCancel;