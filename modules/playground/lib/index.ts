import { TemplateFile, TemplateFolder } from "./path-to-json";

export function findFilePath(
  file: TemplateFile,
  folder: TemplateFolder,
  pathSoFar: string[] = []
): string | null {
  for (const item of folder.items) {
    if ("folderName" in item) {
      const res = findFilePath(file, item, [...pathSoFar, item.folderName]);
      if (res) return res;
    } else {
      if (
        item.filename === file.filename &&
        item.fileExtension === file.fileExtension
      ) {
        return [
          ...pathSoFar,
          item.filename + (item.fileExtension ? "." + item.fileExtension : ""),
        ].join("/");
      }
    }
  }
  return null;
}

/**
 * Updates (in place) the content of the file at `filePath` inside `folder`.
 * `filePath` is the same format findFilePath returns, e.g. "src/App.tsx".
 * Returns true if the file was found and updated.
 */
export function updateFileContentByPath(
  folder: TemplateFolder,
  filePath: string,
  content: string
): boolean {
  const parts = filePath.split("/").filter(Boolean);
  if (parts.length === 0) return false;

  let current: TemplateFolder = folder;
  for (const part of parts.slice(0, -1)) {
    const next = current.items.find(
      (item): item is TemplateFolder =>
        "folderName" in item && item.folderName === part
    );
    if (!next) return false;
    current = next;
  }

  const fullName = parts[parts.length - 1];
  const target = current.items.find(
    (item): item is TemplateFile =>
      !("folderName" in item) &&
      item.filename + (item.fileExtension ? "." + item.fileExtension : "") ===
        fullName
  );
  if (!target) return false;

  target.content = content;
  return true;
}

/**
 * Generates a unique file ID based on file location in folder structure
 * @param file The template file
 * @param rootFolder The root template folder containing all files
 * @returns A unique file identifier including full path
 */
export const generateFileId = (file: TemplateFile, rootFolder: TemplateFolder): string => {
  // Find the file's path in the folder structure
  const path = findFilePath(file, rootFolder)?.replace(/^\/+/, '') || '';
  
  // Handle empty/undefined file extension
  const extension = file.fileExtension?.trim();
  const extensionSuffix = extension ? `.${extension}` : '';

  // Combine path and filename
  return path
    ? `${path}/${file.filename}${extensionSuffix}`
    : `${file.filename}${extensionSuffix}`;
}