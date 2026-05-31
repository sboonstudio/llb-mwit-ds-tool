"use server";

import { signOut } from "@/auth";

export async function signOutUser() {
  await signOut({ redirectTo: "/api/jupyter/logout" });
}
