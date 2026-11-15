"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import type { OrderStatus } from "@/generated/prisma/enums";
import { parseProductCsv, type ImportResult } from "@/lib/csv";
import { getDb } from "@/lib/db";
import { storage } from "@/lib/storage";
import {
  fieldErrors, productInputSchema, shopBasicsSchema, shopContactSchema, shopHoursSchema,
} from "@/lib/validation";
import { NotFoundError, UserError } from "@/server/errors";
import { setOrderStatus } from "@/server/orders";
import { makeCoverPhoto, removeProductPhoto, replaceShopImage } from "@/server/photos";
import {
  createProduct, deleteProduct, importProducts, setProductInStock, updateProduct,
} from "@/server/products";
import { requireOwnerId } from "@/server/session";
import {
  isSlugFree, markProductsStepDone, openShop, saveShopBasics, saveShopContact, saveShopHours, setShopPaused,
} from "@/server/shops";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string>; values?: Record<string, string> };

/** Turns expected failures into a message for the form; anything else is a real bug and is rethrown. */
function failure(error: unknown): FormState {
  if (error instanceof UserError) return { errors: { [error.field ?? "form"]: error.message } };
  if (error instanceof NotFoundError) return { errors: { form: error.message } };
  throw error;
}

function inSetup(form: FormData): boolean {
  return form.get("mode") === "setup";
}

export async function saveBasicsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const ownerId = await requireOwnerId();
  const parsed = shopBasicsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  try {
    await saveShopBasics(getDb(), ownerId, parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/dashboard", "layout");
  if (inSetup(form)) redirect("/dashboard/setup?step=2");
  return { ok: true, message: "Signboard saved" };
}

export async function checkSlugAction(slug: string): Promise<boolean> {
  const ownerId = await requireOwnerId();
  return isSlugFree(getDb(), slug.trim().toLowerCase(), ownerId);
}

export async function saveContactAction(_prev: FormState, form: FormData): Promise<FormState> {
  const ownerId = await requireOwnerId();
  const parsed = shopContactSchema.safeParse({
    whatsapp: form.get("whatsapp") ?? "", address: form.get("address") ?? "", mapUrl: form.get("mapUrl") ?? "",
    pickup: form.get("pickup") ?? "", delivery: form.get("delivery") ?? "", deliveryNote: form.get("deliveryNote") ?? "",
  });
  if (!parsed.success) {
    const values = Object.fromEntries(["whatsapp", "address", "mapUrl", "pickup", "delivery", "deliveryNote"].map((k) => [k, String(form.get(k) ?? "")]));
    return { errors: fieldErrors(parsed.error), values };
  }
  try {
    await saveShopContact(getDb(), ownerId, parsed.data);
  } catch (error) {
    return failure(error);
  }
  if (inSetup(form)) redirect("/dashboard/setup?step=3");
  return { ok: true, message: "Contact details saved" };
}

export async function saveHoursAction(hours: unknown, mode: "setup" | "settings"): Promise<FormState> {
  const ownerId = await requireOwnerId();
  const parsed = shopHoursSchema.safeParse(hours);
  if (!parsed.success) return { errors: { form: "Check the times. Use the clock picker for each day." } };
  try {
    await saveShopHours(getDb(), ownerId, parsed.data);
  } catch (error) {
    return failure(error);
  }
  if (mode === "setup") redirect("/dashboard/setup?step=5");
  return { ok: true, message: "Hours saved" };
}

export async function finishProductsStepAction() {
  const ownerId = await requireOwnerId();
  await markProductsStepDone(getDb(), ownerId);
  redirect("/dashboard/setup?step=4");
}

export async function openShopAction(): Promise<{ ok: true; slug: string } | { ok: false; message: string }> {
  const ownerId = await requireOwnerId();
  const result = await openShop(getDb(), ownerId);
  if (result.ok) {
    revalidatePath("/dashboard", "layout");
    return result;
  }
  const messages = {
    "no-whatsapp": "Add your WhatsApp number first (step 02).",
    "no-products": "Add at least one product first (step 03).",
    "taken-down": "This stall was taken down by Stall. Write to us if you think that's a mistake.",
  } as const;
  return { ok: false, message: messages[result.problem] };
}

export async function setPausedAction(paused: boolean): Promise<FormState> {
  const ownerId = await requireOwnerId();
  await setShopPaused(getDb(), ownerId, paused);
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: paused ? "Stall closed for now" : "Stall open again" };
}

export async function saveProductAction(raw: unknown, productId: string | null): Promise<FormState & { id?: string }> {
  const ownerId = await requireOwnerId();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  try {
    if (productId) {
      await updateProduct(getDb(), ownerId, productId, parsed.data);
      revalidatePath("/dashboard/products");
      return { ok: true, message: "Product saved", id: productId };
    }
    const product = await createProduct(getDb(), ownerId, parsed.data);
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Product added", id: product.id };
  } catch (error) {
    return failure(error);
  }
}

export async function toggleStockAction(productId: string, inStock: boolean): Promise<FormState> {
  const ownerId = await requireOwnerId();
  try {
    await setProductInStock(getDb(), ownerId, productId, inStock);
    revalidatePath("/dashboard/products");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteProductAction(productId: string): Promise<FormState> {
  const ownerId = await requireOwnerId();
  try {
    const keys = await deleteProduct(getDb(), ownerId, productId);
    await Promise.allSettled(keys.map((k) => storage().remove(k)));
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Product removed" };
}

export async function removePhotoAction(photoId: string): Promise<FormState> {
  const ownerId = await requireOwnerId();
  try {
    await removeProductPhoto(getDb(), storage(), ownerId, photoId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function coverPhotoAction(photoId: string): Promise<FormState> {
  const ownerId = await requireOwnerId();
  try {
    await makeCoverPhoto(getDb(), ownerId, photoId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function removeShopImageAction(kind: "logo" | "banner"): Promise<FormState> {
  const ownerId = await requireOwnerId();
  await replaceShopImage(getDb(), storage(), ownerId, kind, null);
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function setOrderStatusAction(orderId: string, status: OrderStatus): Promise<FormState> {
  const ownerId = await requireOwnerId();
  try {
    await setOrderStatus(getDb(), ownerId, orderId, status);
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function previewCsvAction(text: string): Promise<ImportResult> {
  await requireOwnerId();
  return parseProductCsv(text);
}

export async function importCsvAction(text: string): Promise<FormState & { added?: number; skipped?: number }> {
  const ownerId = await requireOwnerId();
  const { rows, errors } = parseProductCsv(text);
  if (errors.length) return { errors: { form: "Fix the rows marked in red, then try again." } };
  try {
    const result = await importProducts(getDb(), ownerId, rows);
    revalidatePath("/dashboard", "layout");
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
