"use client";

import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Home = () => {
  const { userData, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (userData._id) {
      router.push("/profile");
    } else {
      router.push("/login");
    }
  }, [userData, router]); // Dependency array ensures it runs only when `userData` changes
  if (isLoading) return <div className="text-white">Loading...</div>; // Prevents unnecessary rendering
};

export default Home;
