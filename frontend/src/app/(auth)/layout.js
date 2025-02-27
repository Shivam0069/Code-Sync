"use client";
import Loader from "@/components/Loader";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const AuthLayout = ({ children }) => {
  const { isAuth, isLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!isLoading) {
      if (isAuth) {
        router.push("/profile");
      } else {
        setLoading(false);
      }
    }
  }, [isAuth, isLoading, router]);

  if (isLoading || loading) {
    return <Loader />;
  }

  return <div>{children}</div>;
};

export default AuthLayout;
