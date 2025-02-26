// components/Register.js
"use client";
import Loader from "@/components/Loader";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const Login = () => {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { userLogin, isAuth, isLoading } = useUser();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isLoading && isAuth) {
      router.push("/profile");
    }
    if (!isLoading && !isAuth) {
      setLoading(false);
    }
  }, [isAuth, isLoading]);
  const router = useRouter();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("User Data:", userData);
    const res = await userLogin({ credentials: userData });
    if (res) {
      router.push("/profile");
    } else {
      toast.error("Error while loging in");
    }
    // You can add your registration logic here
  };
  if (isLoading || loading) {
    return <Loader />;
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1e29] text-[#fff]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#282a36] p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <div className="mb-4">
          <label className="block  text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 font-semibold"
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block  text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 font-semibold"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute top-[50%] -translate-y-[50%] rounded-md right-2 w-16 py-1 flex items-center justify-center text-sm leading-5 bg-gray-600 text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
