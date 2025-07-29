import { useEffect, useState } from "react";

export const useCurrentUser=()=>{
   const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);  
  useEffect(()=>{
const getUser=async()=>{
   try {
        const res = await fetch("/api/user");
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  },[]);
  return {user,loading};
}