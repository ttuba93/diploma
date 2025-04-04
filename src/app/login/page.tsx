"use client";

import { useRouter } from "next/navigation";
import HeaderSection from "../components/Header";
import { Input, Button, message as antMessage } from "antd";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function SignIn() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Login request
      const response = await axios.post("http://127.0.0.1:8000/api/login/", {
        username: form.username,
        password: form.password,
      });

      // Save token
      localStorage.setItem("token", response.data.access);

      // Get user info from response
      const userData = {
        message: response.data.message || "Login successful",
        username: response.data.username,
        user_id: response.data.user_id,
        role: response.data.role,
      };

      // Store complete user object in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      console.log("Login successful, user data:", userData);

      // Show success message
      antMessage.success("Login successful!");

      // Redirect user based on role
      if (userData.role === "student") {
        router.push("/profile"); // Student profile page
      } else if (userData.role === "dean manager") {
        router.push("/manager/profile"); // Dean Manager profile page
      } else {
        // Fallback if no known role is found
        antMessage.error("Unknown user role");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (axios.isAxiosError(err) && err.response) {
        // Get specific error message from API if available
        const errorMsg =
          err.response.data.detail ||
          err.response.data.error ||
          "Login failed. Please check your credentials.";
        setError(errorMsg);
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col"
      style={{ backgroundImage: "url('/images/kbtu1.jpg')" }}
    >
      <HeaderSection />
      <div className="flex justify-center items-center flex-grow">
        <div className="flex max-w-4xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Left side (Login) */}
          <div className="w-1/2 p-10 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-[#002D62] mb-4">Sign in to your account</h2>
            <form onSubmit={handleSubmit} className="w-full">
              <Input
                name="username"
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                className="mb-4 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
              <Input.Password
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="mb-4 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-[#002D62] text-white py-2 font-semibold rounded-md"
                loading={loading}
              >
                SIGN IN
              </Button>
            </form>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
          {/* Right side (Registration) */}
          <div className="w-1/2 p-10 bg-[#002D62] text-white flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4">Create a new account</h2>
            <p className="text-center mb-4">If you don't have an account</p>
            <Link href="/registration">
              <Button className="w-full bg-white text-[#002D62] py-2 font-semibold rounded-md">
                SIGN UP
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
