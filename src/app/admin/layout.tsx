"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "../loading";

const ADMIN_PASSWORD = "psht"; // In a real app, use a secure auth system

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem("silatscorer_admin_verified");
      if (item === "true") {
        setIsVerified(true);
      } else {
        router.replace("/login-admin");
      }
    } catch (error) {
        router.replace("/login-admin");
    } finally {
        setIsLoading(false);
    }
  }, [router]);

  if (isLoading || !isVerified) {
    return <Loading />;
  }

  return <>{children}</>;
}
