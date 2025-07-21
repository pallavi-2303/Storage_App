"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { avatarPlaceholderUrl } from "@/constants";
import { generateOTP, parseStringify } from "../utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { error } from "console";
import { sendOTPViaEmailJs } from "../email/sendClientOtp";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])]
  );
  return result.total > 0 ? result.documents[0] : null;
};
const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};
// server-safe
export const generateAndStoreOtp = async ({ email }: { email: string }) => {
  const otp = generateOTP();

  (await cookies()).set(`otp-${email}`, otp, {
    path: "/",
    httpOnly: true,
    secure: true,
    maxAge: 15 * 60, // 15 minutes
  });

  return otp;
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
    const existingUser=await getUserByEmail(email);
  const otp = await generateAndStoreOtp({ email });
      if(!existingUser){
    const { databases } = await createAdminClient();
    const newAccountId=ID.unique();
    await databases.createDocument(appwriteConfig.databaseId,appwriteConfig.usersCollectionId,newAccountId,{
       fullName,
        email,
        avatarImage: avatarPlaceholderUrl,
        accountId:newAccountId,  
    }) 
    return parseStringify({ accountId: newAccountId ,otp});     
      }
return parseStringify({accountId:existingUser.accountId,otp});
};
export const verifySecret=async({
  email,
otp
}:{email:string,otp:string})=>{
    try {
  const storedOtp = (await cookies()).get(`otp-${email}`)?.value;
console.log(storedOtp);
console.log(otp);
  if (!storedOtp || storedOtp !== otp) {
    throw new Error("Invalid or expired OTP");
  }
(await cookies()).delete(`otp-${email}`);
const sessionToken = `sess_${crypto.randomUUID()}`;
  (await cookies()).set("appwrite-session", sessionToken, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 1 day
  });
//Store sessionToken
const {databases}=await createAdminClient();
const user = await getUserByEmail(email);
if (user) {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        user.$id, // 👈 Not accountId
        { sessionToken }
      );
    }
   return { sessionId: sessionToken };
    } catch (error) {
       handleError(error, "Failed to verify OTP");   
    }
}
export const getCurrentUser=async()=>{
    try {
  const sessionToken = (await cookies()).get("appwrite-session")?.value;
  if (!sessionToken) return null;   
  const {databases} =await createSessionClient();
  const result=await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("sessionToken",sessionToken)],
  )  ;
  if(result.total<=0)  return null;
  console.log(result.documents[0]);
  return parseStringify(result.documents[0]);
    } catch (error) {
      console.log(error);   
    }
};
export const signOutUser=async()=>{
 const {account} =await createSessionClient();
 try {
  (await cookies()).delete("appwrite-session");
 } catch (error) {
    handleError(error, "Failed to sign out user");
 }  
 finally {
    redirect("/sign-in");
  }
}
export const signInUser=async({email}:{email:string})=>{
    try {
    const existingUser=await getUserByEmail(email);
    if(existingUser){
      const otp = await generateAndStoreOtp({ email });
        return parseStringify({accountId:existingUser.accountId,email,otp});
    }  
    return parseStringify({accountId:null,error:"User not Found"}) ; 
    } catch (error) {
    handleError(error, "Failed to sign in user");     
    }
}
export const resendOtp = async ({ email }: { email: string }) => {
  const otp = await generateAndStoreOtp({ email }); 
  return parseStringify({ otp });
};
