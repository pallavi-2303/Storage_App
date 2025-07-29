"use client";
import { Models } from "node-appwrite";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionType } from "@/types";
import Image from "next/image";
import { actionsDropdownItems } from "@/constants";
import Link from "next/link";
import { constructDownloadUrl } from "@/lib/utils";
import { Input } from "./ui/input";
import {FileDetails} from "./ActionModal";
import {ShareInput} from "./ActionModal";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { deleteFile, renameFile, updatedFileUsers } from "@/lib/actions/files.actions";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
const ActionDropdown = ({ file }: { file: Models.Document }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const path=usePathname();
  const {user,loading}=useCurrentUser();
  const {toast}=useToast();
  const closeAllModals=()=>{
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(file.name); 
  }
 const handleAction=async()=>{
 if(!action)  return ;
 setIsLoading(true);
 let success=false;
 const isOwner=user?.$id===file.owner?.$id;
 const actions={
  rename:()=>
    renameFile({fileId:file.$id,name,extension:file.extension,path}),
  share:()=>updatedFileUsers({fileId:file.$id,emails,path}),
  delete:async()=>{
  if(isOwner){
return await deleteFile({ fileId: file.$id, bucketFileId: file.bucketFileId, path })
  }
  else {
 const updatedUsers = file.users.filter((email: string) => email !== user?.email);
        return await updatedFileUsers({
          fileId: file.$id,
          emails: updatedUsers,
          path,
        });
  }
 
  }
    
    };
 success=await actions[action.value as keyof typeof actions]();
 if(success){
  toast({
    title:`${action.label} successfull`,
    description:`File "${file.name}" ${action.value}d successfully.`,
  });
   closeAllModals();
 }
  else {
   toast({
      variant: "destructive",
      title: `${action.label} failed`,
      description: `Something went wrong while trying to ${action.value} the file.`,
    }); 
  }
 
 setIsLoading(false);
 } 
 const handleRemoveUser=async(email:string)=>{
  const updatedEmails=emails.filter((e)=>e!== email);
  const success=await updatedFileUsers({
   fileId: file.$id,
      emails: updatedEmails,
      path,  
  })
   if (success) setEmails(updatedEmails);
    closeAllModals();
 }
const renderDialogContent=()=>{
  if(!action) return null;
  const {value,label}=action;
  return (
  
  <DialogContent className="shad-dialog button">
    <DialogHeader className="flex flex-col gap-3">
      <DialogTitle className="text-center text-light-100">{label}</DialogTitle>
      {value==="rename" && (
        <Input type="text" value={name} onChange={(e)=>setName(e.target.value)}/>
      )}
      {value==="details" && <FileDetails file={file}/>}
      {value==="share" && (
        <ShareInput file={file} onInputChange={setEmails} onRemove={handleRemoveUser}/>
      )}
      {value==="delete" && (
        <p className="delete-confirmation"> Are you sure you want to delete{` `}
              <span className="delete-file-name">{file.name}</span>?</p>
      )}
    </DialogHeader>
    {["rename", "delete", "share"].includes(value) && (
      <DialogFooter className="flex flex-col gap-3 md:flex-row">
        <Button onClick={closeAllModals} className="modal-cancel-button">Cancel</Button>
        <Button onClick={handleAction} className="modal-submit-button">
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
      </DialogFooter>
    )}
  </DialogContent>
 
  )
}
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/assets/icons/dots.svg"
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionsDropdownItems.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="shad-dropdown-item"
              onClick={() => {
                setAction(actionItem);
                if (
                  ["rename", "share", "delete", "details"].includes(
                    actionItem.value
                  )
                ) {
                  setIsModalOpen(true);
                }
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={constructDownloadUrl(file.bucketFileId)}
                  download={file.name}
                  className="flex items-center gap-2"
                >
                  {" "}
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                </Link>
              ) : (
                <div className="flex-items center gap-2">
                  {" "}
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {renderDialogContent()}
    </Dialog>
  );
};

export default ActionDropdown;
