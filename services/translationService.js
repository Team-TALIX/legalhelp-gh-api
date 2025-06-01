import axios from "axios";

export const translateText = async (text, targetLang) => {
  try {
    const response = await axios.post(
      process.env.TRANSLATION_API_URL,
      {
        in: text, 
        lang: targetLang,
      },
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.TRANSLATION_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Translation failed:", error.response?.data || error.message);
    throw new Error("Translation service error");
  }
};
