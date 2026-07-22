import crypto from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors";

const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const PRODUCT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const PROFILE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "profiles");

const allowedImageTypes = {
  "image/jpeg": {
    extension: "jpg",
    isValidSignature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    isValidSignature: (bytes: Uint8Array) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  "image/webp": {
    extension: "webp",
    isValidSignature: (bytes: Uint8Array) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  },
} satisfies Record<string, {
  extension: string;
  isValidSignature: (bytes: Uint8Array) => boolean;
}>;

export type StoredProductImage = {
  url: string;
  size: number;
  mimeType: string;
};

type UploadTarget = {
  directory: string;
  publicPath: string;
};

const productUploadTarget = {
  directory: PRODUCT_UPLOAD_DIR,
  publicPath: "/uploads/products",
} satisfies UploadTarget;

const profileUploadTarget = {
  directory: PROFILE_UPLOAD_DIR,
  publicPath: "/uploads/profiles",
} satisfies UploadTarget;

async function validateImageFile(file: File) {
  if (file.size <= 0) {
    throw new AppError("업로드할 이미지 파일을 선택해 주세요.", 400);
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    throw new AppError("이미지는 5MB 이하 파일만 업로드할 수 있습니다.", 400);
  }

  const imageType = allowedImageTypes[file.type as keyof typeof allowedImageTypes];

  if (!imageType) {
    throw new AppError("jpg, png, webp 이미지 파일만 업로드할 수 있습니다.", 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (!imageType.isValidSignature(bytes)) {
    throw new AppError("이미지 파일 형식이 올바르지 않습니다.", 400);
  }

  return {
    bytes,
    extension: imageType.extension,
  };
}

async function storeImage(file: File, target: UploadTarget): Promise<StoredProductImage> {
  const { bytes, extension } = await validateImageFile(file);

  await mkdir(target.directory, { recursive: true });

  const filename = `${crypto.randomUUID()}.${extension}`;
  const filepath = path.join(target.directory, filename);

  await writeFile(filepath, bytes);

  return {
    url: `${target.publicPath}/${filename}`,
    size: file.size,
    mimeType: file.type,
  };
}

export async function storeProductImage(file: File): Promise<StoredProductImage> {
  return storeImage(file, productUploadTarget);
}

export async function storeProfileImage(file: File): Promise<StoredProductImage> {
  return storeImage(file, profileUploadTarget);
}

export async function deleteLocalProfileImage(url: string | null | undefined) {
  if (!url?.startsWith(`${profileUploadTarget.publicPath}/`)) {
    return;
  }

  const filename = path.basename(url);

  if (filename !== url.slice(profileUploadTarget.publicPath.length + 1)) {
    return;
  }

  try {
    await unlink(path.join(profileUploadTarget.directory, filename));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }
}
