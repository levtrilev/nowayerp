// Role EditForm state wrapper

'use client';

import { useEffect, useState } from "react";
import { Permission, RoleForm, SectionForm, Tenant, UserForm } from "@/app/lib/definitions";
import Link from "next/link";
import BtnTenantsRef from "@/app/admin/tenants/lib/btn-tenants-ref";
import BtnSectionsRef from "@/app/admin/sections/lib/btn-sections-ref";
import { TrashIcon } from "@heroicons/react/24/outline";
import { lusitana } from "@/app/ui/fonts";
import MessageBoxOKCancel from "@/app/lib/message-box-ok-cancel";
import { useRouter } from 'next/navigation';
import {
  setIsCancelButtonPressed, setIsDocumentChanged, setIsMessageBoxOpen,
  setIsOKButtonPressed, setIsShowMessageBoxCancel, setMessageBoxText, useDocumentStore, useIsDocumentChanged,
  useMessageBox
} from "@/app/store/useDocumentStore";
import { updRole } from "../../lib/store/use-role-store";
import PermissionsTable from "@/app/admin/permissions/lib/permissions-table";
import UsersTable from "@/app/admin/users/lib/users-table";
import RoleEditForm from "./role-edit-form";

interface IRoleEditFormProps {
  role: RoleForm,
  role_sections: SectionForm[],
  tenants: Tenant[],
  userSections: SectionForm[],
  role_permissions: Permission[],
  role_users: UserForm[],
}

export default function StateWrap(props: IRoleEditFormProps) {
    useDocumentStore.getState().setUserSections(props.userSections);
  return <RoleEditForm {...props} />;
}