"use client";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const UserDataContext = createContext();

const UserContext = ({ children }) => {
  const [userData, setUserData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/profile`,
          { withCredentials: true }
        );
        if (response.status === 200) {
          setUserData(response.data);
        } else {
          toast.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // toast.error("An error occurred while fetching user data");
      } finally {
        setIsLoading(false); // Set loading to false regardless of success or failure
      }
    };

    getUserData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const userLogin = async ({ credentials }) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login`,
        credentials, // Send credentials in the request body
        { withCredentials: true } // Enable sending and receiving cookies with the request
      );

      if (response.status === 200 && response.data) {
        // Login successful
        const userData = response.data; // Assuming the response contains user data
        setUserData(userData); // Update the userData state
        return true; // Return true for successful login
      } else {
        // Login failed
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false; // Return false for any errors
    } finally {
      setIsLoading(false);
    }
  };

  const userRegister = async ({ credentials }) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/register`,
        credentials,
        { withCredentials: true } // Send credentials in the request body
      );

      if (response.status === 200 && response.data) {
        // Login successful
        const userData = response.data; // Assuming the response contains user data
        setUserData(userData); // Update the userData state
        return true; // Return true for successful login
      } else {
        // Login failed
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false; // Return false for any errors
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async ({ fileId }) => {
    try {
      setIsLoading(true);
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/files/delete/${fileId}`,
        { withCredentials: true }
      );

      if (response.status === 200) {
        setUserData(response.data.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Delete file error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = { userData, isLoading, userLogin, userRegister, deleteFile };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUser = () => useContext(UserDataContext);

export default UserContext;
