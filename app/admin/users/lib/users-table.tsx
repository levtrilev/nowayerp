'use client';
import { formatDateToLocal } from "@/app/lib/common-utils";
import { UserForm } from '@/app/lib/definitions';
import { BtnEditUserLink } from "./users-buttons";
import { useEffect, useState } from "react";
import { setIsCancelButtonPressed, setIsDocumentChanged, setIsMessageBoxOpen, setIsOKButtonPressed, setIsShowMessageBoxCancel, setMessageBoxText, useMessageBox } from "@/app/store/useDocumentStore";
import { delUser, fillUsers, useUsers } from "./store/useUserStore";
import { TrashIcon } from "@heroicons/react/24/outline";
import MessageBoxOKCancel from "@/app/lib/message-box-ok-cancel";

interface IUsersTableProps {
    users: UserForm[],
    admin: boolean,
    allowDelete: boolean,
}
export const UsersTable: React.FC<IUsersTableProps> = (props: IUsersTableProps) => {

    const datePlaceHolder = "01.01.2025";
    const items = props.users.length !== 0 ? props.users : [];
    const users = useUsers();
    const msgBox = useMessageBox();
    const [userToDelete, setUserToDelete] = useState<UserForm>({} as UserForm);
    const handleDelete = (user: UserForm) => {
        setMessageBoxText(`Пользователь: ${user.email} \nУдалить Пользователя?`);
        setIsShowMessageBoxCancel(true);
        setIsMessageBoxOpen(true);
        setUserToDelete(user);
    }
    useEffect(
        () => {
            fillUsers(items);
            setIsShowMessageBoxCancel(false);
        },
        []
    );
    useEffect(() => {
        if (msgBox.isOKButtonPressed && msgBox.messageBoxText.includes('Удалить Пользователя?')) {
            delUser(userToDelete);
            // delRole(roleToDelete);
            setIsCancelButtonPressed(false);
            setIsShowMessageBoxCancel(false);
            setIsDocumentChanged(false);
            setIsMessageBoxOpen(false);
        }
        setIsOKButtonPressed(false);

    }, [msgBox.isOKButtonPressed, msgBox.messageBoxText, userToDelete]);
    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                    <div className="md:hidden">
                        {users?.map((user) => (
                            <div
                                key={user.id}
                                className="mb-2 w-full rounded-md bg-white p-4"
                            >
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div>
                                        <div className="mb-2 flex items-center">

                                            <p>{user.tenant_id}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex w-full items-center justify-between pt-4">
                                    <div>
                                        <p className="text-xl font-medium">
                                            {user.is_admin?.toString()}
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        {/* <DeleteInvoice id={invoice.id} /> */}
                                        <p className="text-xl font-medium">
                                            Delete User
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <table className="hidden min-w-full text-gray-900 md:table">
                        <thead className="rounded-lg text-left text-gray-400 text-sm font-normal">
                            <tr>
                                <th scope="col" className="w-5/16 px-3 py-5 font-medium">
                                    Email
                                </th>
                                <th scope="col" className="w-2/8 px-4 py-5 font-medium sm:pl-6">
                                    Организация
                                </th>
                                <th scope="col" className="w-2/8 px-3 py-5 font-medium">
                                    admin?
                                </th>
                                <th scope="col" className="w-1/8 px-3 py-5 font-medium">
                                    Дата создания
                                </th>
                                <th scope="col" className="w-1/8 px-3 py-5 font-medium">
                                    
                                </th>
                                {/* <th scope="col" className="relative py-3 pl-6 pr-3">
                                    <span className="sr-only">Edit</span>
                                </th> */}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="w-full border-b border-gray-200 py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                                >
                                    {/* <td className="whitespace-nowrap px-3 py-3">
                                        {user.email}
                                    </td> */}
                                    <td className="w-5/16 overflow-hidden whitespace-nowrap text-ellipsis bg-white py-1 pl-0 text-left  
                      pr-3 text-sm text-black group-first-of-type:rounded-md group-last-of-type:rounded-md sm:pl-6">
                                        <div className="flex items-left gap-3">
                                            {props.admin && !user.is_superadmin ? <a

                                                href={"/admin/users/" + user.id}
                                                className="text-blue-800 underline"
                                            >{user.email.substring(0, 30)}</a> :
                                                <p>{user.email.substring(0, 30)}</p>}
                                        </div>
                                    </td>
                                    <td className="w-2/8 whitespace-nowrap py-3 pl-6 pr-3">
                                        <div className="flex items-center gap-3">
                                            <p>{user.tenant_name}</p>
                                        </div>
                                    </td>
                                    <td className="w-2/8 whitespace-nowrap px-3 py-3">
                                        {user.is_superadmin ? "super" : user.is_admin ? "admin" : " -- "}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">
                                        {formatDateToLocal(datePlaceHolder)}
                                    </td>
                                    <td className="w-1/8 whitespace-nowrap py-3 pl-6 pr-3">
                                        <div className="flex justify-end gap-3">
                                            {/* {props.admin && !user.is_superadmin && <BtnDeleteUser id={user.id} />} */}
                                            {props.allowDelete && props.admin && !user.is_superadmin && <button className="rounded-md border border-gray-200 p-2 h-10 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onClick={() => {
                                                    // delUser(user.email);
                                                    handleDelete(user);
                                                }}>
                                                <TrashIcon className="w-5 h-5 text-gray-800" />
                                            </button>}                                            
                                            {/* {props.admin && !user.is_superadmin && <BtnEditUserLink id={user.id} />} */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <MessageBoxOKCancel />
        </div>
    );
}

export default UsersTable;