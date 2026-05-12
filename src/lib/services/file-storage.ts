/**
 * File Storage Service
 * Supports both local filesystem and Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

const USE_SUPABASE_STORAGE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let supabase: ReturnType<typeof createClient> | null = null;

if (USE_SUPABASE_STORAGE) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface UploadResult {
  filePath: string;
  fileUrl: string;
}

export class FileStorageService {
  private bucketName = "resumes";

  /**
   * Upload a file to storage (Supabase or local)
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    folder: "resumes" | "cover-letters" | "portfolios" = "resumes"
  ): Promise<UploadResult> {
    if (USE_SUPABASE_STORAGE && supabase) {
      return this.uploadToSupabase(file, fileName, folder);
    } else {
      return this.uploadToLocal(file, fileName, folder);
    }
  }

  /**
   * Upload to Supabase Storage
   */
  private async uploadToSupabase(
    file: Buffer,
    fileName: string,
    folder: string
  ): Promise<UploadResult> {
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase!.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        contentType: this.getContentType(fileName),
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase!.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return {
      filePath: data.path,
      fileUrl: urlData.publicUrl,
    };
  }

  /**
   * Upload to local filesystem
   */
  private async uploadToLocal(
    file: Buffer,
    fileName: string,
    folder: string
  ): Promise<UploadResult> {
    const uploadDir = path.join(process.cwd(), "uploads", folder);

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, file);

    return {
      filePath: `uploads/${folder}/${fileName}`,
      fileUrl: `/uploads/${folder}/${fileName}`,
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    if (USE_SUPABASE_STORAGE && supabase) {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error("Supabase delete error:", error);
        throw new Error(`Failed to delete from Supabase: ${error.message}`);
      }
    } else {
      const fullPath = path.join(process.cwd(), filePath);
      await fs.unlink(fullPath);
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(filePath: string): string {
    if (USE_SUPABASE_STORAGE && supabase) {
      const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);
      return data.publicUrl;
    } else {
      return `/${filePath}`;
    }
  }

  /**
   * Get content type from file extension
   */
  private getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split(".").pop();
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    return contentTypes[ext || ""] || "application/octet-stream";
  }

  /**
   * Check if using Supabase Storage
   */
  static isUsingSupabase(): boolean {
    return USE_SUPABASE_STORAGE;
  }
}
