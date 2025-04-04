import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FacebookOutlined, InstagramOutlined, LinkedinOutlined, YoutubeOutlined } from "@ant-design/icons";

export const Footer = () => {
  return (
    <footer className="bg-[#002F6C] text-gray-300 text-sm py-10">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
        {/* Logo and Description */}
        <div className="flex flex-col items-center md:items-start">
          <Image src="/images/logo_white.png" alt="KBTU Logo" width={150} height={50} className="h-auto" />
          <p className="mt-4 leading-6 text-gray-400">Smart routes and convenient planning</p>
          <p className="mt-4 text-[#FFD700] font-semibold hover:underline cursor-pointer">
            <a href="#hero">Learn more</a>
          </p>
        </div>

        {/* Navigation */}
        <nav>
          <h4 className="text-white text-lg font-semibold mb-4 border-b pb-2 border-[#FFD700]">
            Navigation
          </h4>
          <ul className="space-y-3">
            <li><Link href="/about" className="hover:text-[#FFD700] transition duration-300">About Us</Link></li>
            <li><Link href="/manager/faq" className="hover:text-[#FFD700] transition duration-300">FAQ</Link></li>
            <li><Link href="/manager/documents" className="hover:text-[#FFD700] transition duration-300">Documents</Link></li>
            <li><Link href="/manager/e-queue" className="hover:text-[#FFD700] transition duration-300">E-queue</Link></li>
            <li><Link href="/manager/requests" className="hover:text-[#FFD700] transition duration-300">Requests</Link></li>
          </ul>
        </nav>

        {/* Contacts */}
        <div>
          <h4 className="text-white text-lg font-semibold mb-4 border-b pb-2 border-[#FFD700]">Contacts</h4>
          <p className="leading-6"><span className="font-semibold">Address:</span> Almaty, Tole Bi 59</p>
          <p className="mt-4">
            <span className="font-semibold">Email:</span>
            <a href="mailto:info@example.com" className="hover:text-[#FFD700] transition duration-300"> info@example.com</a>
          </p>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="text-white text-lg font-semibold mb-4 border-b pb-2 border-[#FFD700]">Follow Us</h4>
          <div className="flex justify-center md:justify-start gap-6">
            <a href="#" className="hover:text-[#FFD700] transition duration-300"><FacebookOutlined className="text-2xl" /></a>
            <a href="#" className="hover:text-[#FFD700] transition duration-300"><InstagramOutlined className="text-2xl" /></a>
            <a href="#" className="hover:text-[#FFD700] transition duration-300"><LinkedinOutlined className="text-2xl" /></a>
            <a href="#" className="hover:text-[#FFD700] transition duration-300"><YoutubeOutlined className="text-2xl" /></a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-[#FFD700] mt-8 pt-4 text-center text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} All rights reserved.
      </div>
    </footer>
  );
};
