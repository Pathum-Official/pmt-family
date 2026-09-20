export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "10a03292e7917f2f93356e666c8c4bd7";
  if (!apiKey) {
    throw new Error("ImgBB API key is not configured");
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || "Failed to upload image to ImgBB");
    }
  } catch (error) {
    console.error("Error uploading to ImgBB:", error);
    throw error;
  }
}
