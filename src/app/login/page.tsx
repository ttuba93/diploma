"use client";

import { useRouter } from "next/navigation";
import HeaderSection from "../components/Header";
import { Input, Button } from "antd";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function SignIn() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/token/", {
        username: form.username,
        password: form.password,
      });

      // Сохраняем токен
      localStorage.setItem("token", response.data.access);
      setMessage("Login successful!");
      setError("");

      // Перенаправляем пользователя на страницу профиля
      router.push("/profile");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      setMessage("");
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
          {/* Левая часть (Авторизация) */}
          <div className="w-1/2 p-10 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-[#002D62] mb-4">Sign in to your account</h2>
            <form onSubmit={handleSubmit} className="w-full">
              <Input
                name="username"
                type="text"
                placeholder="Email"
                value={form.username}
                onChange={handleChange}
                className="mb-4 py-2 border border-gray-300 rounded-md"
              />
              <Input.Password
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="mb-4 py-2 border border-gray-300 rounded-md"
              />
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-[#002D62] text-white py-2 font-semibold rounded-md"
              >
                SIGN IN
              </Button>
            </form>
            {message && <p className="text-green-600 mt-2">{message}</p>}
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
          {/* Правая часть (Регистрация) */}
          <div className="w-1/2 p-10 bg-[#002D62] text-white flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4">Create a new account</h2>
            <p className="text-center mb-4">If you don’t have an account</p>
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
