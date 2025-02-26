"use client";

import Loader from "@/components/Loader";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Home = () => {
  const { isAuth, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuth) {
        router.push("/profile");
      } else {
        router.push("/login");
      }
    }
  }, [userData, router, isLoading]); // Dependency array ensures it runs only when `userData` changes
  if (isLoading) {
    return <Loader />;
  }
  return null;
};

export default Home;
