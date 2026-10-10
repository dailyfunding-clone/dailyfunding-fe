"use server";

import { updateTag } from "next/cache";

export const revalidateProducts = async () => {
  updateTag("products");
};
