"use client";

import { Layout, Menu, Button, Dropdown } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BellOutlined, UserOutlined, GlobalOutlined, LogoutOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const { Header } = Layout;

const languageMenu = (
  <Menu>
    <Menu.Item key="en">
      <Link href="?lang=en">English</Link>
    </Menu.Item>
    <Menu.Item key="ru">
      <Link href="?lang=ru">Русский</Link>
    </Menu.Item>
    <Menu.Item key="kz">
      <Link href="?lang=kz">Қазақша</Link>
    </Menu.Item>
  </Menu>
);

export default function HeaderSection() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // Делаем тип any, чтобы принимать все данные
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Получаем имя пользователя с бэкенда
        const fetchUserData = async () => {
          try {
            const res = await fetch(`http://127.0.0.1:8000/api/students/user/${parsedUser.user_id}`);
            if (!res.ok) throw new Error('Failed to fetch user data');
            const data = await res.json();
            setUserName(data.first_name); // Обновляем состояние с именем пользователя
          } catch (err) {
            console.error("Error fetching user data", err);
          }
        };

        fetchUserData();
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <>
      <Header className="bg-white flex justify-between items-center px-8 shadow-md h-18">
        <Link href="/">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="KBTU Logo" width={250} height={125} />
          </div>
        </Link>
        <Menu mode="horizontal" className="flex-1 justify-center border-none" selectedKeys={[pathname]}>
          <Menu.Item key="/">
            <Link href="/">HOME</Link>
          </Menu.Item>
          <Menu.Item key="/documents">
            <Link href="/documents">Documents</Link>
          </Menu.Item>
          <Menu.Item key="/e-queue">
            <Link href="/e-queue">E-queue</Link>
          </Menu.Item>
          <Menu.Item key="/requests">
            <Link href="/requests">Requests</Link>
          </Menu.Item>
        </Menu>
        <div className="flex gap-4 items-center">
          {/* <Dropdown overlay={languageMenu} placement="bottomRight">
            <GlobalOutlined className="text-xl cursor-pointer text-[#002F6C]" />
          </Dropdown>
          <Link href="/notifications">
            <BellOutlined className="text-xl cursor-pointer text-[#002F6C]" />
          </Link> */}
          {user && (
            <span className="text-[#002F6C] font-semibold">{user.first_name} {user.last_name}</span>
          )}
          {user ? (
            <>
              <Link href="/profile">
                <UserOutlined className="text-xl cursor-pointer text-[#002F6C]" />
              </Link>
              <LogoutOutlined className="text-xl cursor-pointer text-[#002F6C]" onClick={handleLogout} />
            </>
          ) : (
            <Link href="/login">
              <UserOutlined className="text-xl cursor-pointer text-[#002F6C]" />
            </Link>
          )}
          <Dropdown overlay={languageMenu} placement="bottomRight">
            <GlobalOutlined className="text-xl cursor-pointer text-[#002F6C]" />
          </Dropdown>
          <Link href="/notifications">
            <BellOutlined className="text-xl cursor-pointer text-[#002F6C]" />
          </Link>
        </div>
      </Header>
      <div style={{ borderBottom: "2px solid #002F6C" }}></div>
    </>
  );
}
