'use client';
import { Permission, RoleForm } from '@/app/lib/definitions';
import MessageBoxOKCancel from '@/app/lib/message-box-ok-cancel';
import { useEffect, useState } from 'react';
import { setIsCancelButtonPressed, setIsDocumentChanged, setIsMessageBoxOpen, setIsOKButtonPressed, setIsShowMessageBoxCancel, setMessageBoxText, useMessageBox } from '@/app/store/useDocumentStore';
import { TrashIcon } from '@heroicons/react/24/outline';
import { deletePermission } from './permissios-actions';
import { useRoles, fillRoles } from '../../roles/lib/store/use-role-store';

interface IDoctypeTableProps {
    permissions: Permission[];
    admin: boolean | undefined;
    allRoles: RoleForm[];
}
export const PermissionsTable: React.FC<IDoctypeTableProps> = (props: IDoctypeTableProps) => {
    const datePlaceHolder = "01.01.2025";
    const permissions = props.permissions.length !== 0 ? props.permissions : [];
    const [idToDelete, setIdToDelete] = useState<string>('');
    const msgBox = useMessageBox();
    const handleDelete = (perm: Permission) => {
        setMessageBoxText(`Тип документа: ${perm.doctype_name} \nРоль: ${perm.role_name} \nУдалить Полномочия?`);
        setIsShowMessageBoxCancel(true);
        setIsMessageBoxOpen(true);
        setIdToDelete(perm.id);
    }
    useEffect(
        () => {
            setIsShowMessageBoxCancel(false);
            fillRoles(props.allRoles);
        },
        []
    );
    useEffect(() => {
        if (msgBox.isOKButtonPressed && msgBox.messageBoxText.includes('Удалить Полномочия?')) {
            deletePermission(idToDelete);
            setIsCancelButtonPressed(false);
            setIsShowMessageBoxCancel(false);
            setIsDocumentChanged(false);
            setIsMessageBoxOpen(false);
        }
        setIsOKButtonPressed(false);

    }, [msgBox.isOKButtonPressed, msgBox.messageBoxText]);
    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                    {/* Таблица для больших экранов */}
                    <table className="table-fixed hidden w-full rounded-md text-gray-900 md:table">
                        <thead className="rounded-md bg-gray-50 text-left text-gray-400 text-sm font-normal">
                            <tr>
                                <th scope="col" className="w-3/16 overflow-hidden px-0 py-5 font-medium sm:pl-6">
                                    Тип документа
                                </th>
                                <th scope="col" className="w-2/8 px-3 py-5 font-medium">
                                    Роль
                                </th>
                                <th scope="col" className="w-2/8 px-3 py-5 font-medium">
                                    Полномочия
                                </th>
                                <th scope="col" className="w-3/8 px-3 py-5 font-medium">
                                    Организация
                                </th>
                                <th scope="col" className="w-1/8 px-3 py-5 font-medium">

                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-900">
                            {permissions.map((perm) => (
                                <tr key={perm.id} className="group">
                                    <td className="w-3/16 overflow-hidden whitespace-nowrap text-ellipsis bg-white py-1 
                                    pl-0 text-left pr-3 text-sm text-black group-first-of-type:rounded-md 
                                    group-last-of-type:rounded-md sm:pl-6">
                                        <div className="flex items-left gap-3">
                                            {props.admin ? <a href={"/admin/permissions/" + perm.id + "/edit"}
                                                className="text-blue-800 underline"
                                            >{perm.doctype_name.substring(0, 20)}</a> :
                                                <p>{(perm.doctype_name + "(" + perm.doctype + ")").substring(0, 20)}</p>}
                                        </div>
                                    </td>
                                    <td className="w-2/8 overflow-hidden whitespace-nowrap bg-white px-4 py-1 text-sm">
                                        {perm.role_name}
                                    </td>
                                    <td className="w-3/8 overflow-hidden whitespace-nowrap bg-white px-4 py-1 text-sm">
                                        {perm.full_access ? ' Полный доступ'
                                            : perm.editor ? ' Редактор'
                                                : perm.author ? ' Автор'
                                                    : perm.reader ? ' Читатель'
                                                        : ''}
                                        {perm.can_delete && !perm.full_access && (perm.editor || perm.author) ? '(+физ.удаление)'
                                            : ''}
                                        {perm.author && perm.reader && !perm.full_access && !perm.editor ? ',Читатель' : ''}
                                    </td>
                                    <td className="w-2/8 overflow-hidden whitespace-nowrap bg-white px-4 py-1 text-sm">
                                        {perm.tenant_name}
                                    </td>
                                    <td className="w-1/16 whitespace-nowrap pl-4 py-1 pr-3">
                                        <div className="flex justify-end gap-3">
                                            {/* {props.admin && <BtnDeleteRole id={role.id} />} */}
                                            {props.admin && <button className="rounded-md border border-gray-200 p-2 h-10 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onClick={() => {
                                                    handleDelete(perm);
                                                    // delRole(role.id, role.tenant_id);
                                                }}>
                                                <TrashIcon className="w-5 h-5 text-gray-800" />
                                            </button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>


                    {/* Карточки для мобильных устройств */}
                    <div className="block md:hidden">
                        {props.permissions.map((perm) => (
                            <div key={perm.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium text-gray-700">Роль:{"  "}</span>
                                            {props.admin ? (
                                                <a
                                                    href={"/admin/permissions/" + perm.id + "/edit"}
                                                    className="text-blue-800 underline font-bold"
                                                >
                                                    {perm.doctype_name.substring(0, 20)}
                                                </a>
                                            ) : (
                                                <span>{perm.doctype_name.substring(0, 20)}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            {/* {props.admin && <BtnDeleteRole id={role.id} />} */}
                                            {props.admin && <button className="rounded-md border border-gray-200 p-2 h-10 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onClick={() => {
                                                    handleDelete(perm);
                                                }}>
                                                <TrashIcon className="w-5 h-5 text-gray-800" />
                                            </button>}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Организация:{"  "}</span>
                                        <span className="font-bold">{perm.tenant_id}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Описание:</span>
                                        <p className="font-bold">{perm.role_id}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Разделы:</span>
                                        <p className="font-bold">{perm.role_name}</p>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <MessageBoxOKCancel />
        </div>
    );
}

export default PermissionsTable;
