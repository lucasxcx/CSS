const fs = require("fs/promises");
const path = require("path");

const MIME_TYPE_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const parseBase64Image = (rawData) => {
  if (!rawData || typeof rawData !== "string") {
    return null;
  }

  const matches = rawData.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);

  if (!matches) {
    return null;
  }

  return {
    mimeType: matches[1],
    content: matches[2],
  };
};

const saveBase64Image = async (rawData, outputDirectory, filenamePrefix) => {
  const parsed = parseBase64Image(rawData);

  if (!parsed) {
    throw new Error("Formato de imagem inválido. Envie um data URL base64 válido.");
  }

  const extension = MIME_TYPE_TO_EXTENSION[parsed.mimeType] ?? "jpg";
  const fileName = `${filenamePrefix}-${Date.now()}.${extension}`;
  const absoluteOutputDirectory = path.resolve(outputDirectory);
  const absoluteFilePath = path.join(absoluteOutputDirectory, fileName);

  await fs.mkdir(absoluteOutputDirectory, { recursive: true });
  await fs.writeFile(absoluteFilePath, parsed.content, "base64");

  return {
    fileName,
    filePath: absoluteFilePath,
  };
};

module.exports = {
  saveBase64Image,
};
