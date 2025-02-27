"use client";
import Loader from "@/components/Loader";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ProfileLayout = ({ children }) => {
  const { isAuth, isLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!isAuth && !isLoading) {
      router.push("/login");
    }
    if (isAuth && !isLoading) {
      setLoading(false);
    }
  }, [isAuth, isLoading]);

  if (isLoading || loading) {
    return <Loader />;
  }

  return <div>{children}</div>;
};

export default ProfileLayout;
