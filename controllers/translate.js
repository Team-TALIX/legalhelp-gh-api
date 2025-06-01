import { translateText } from "../services/translationService.js";

export const translateHandler = async (req, res, next) => {

  if (!req.body.in || !req.body.lang) {
    return res
      .status(400)
      .json({ message: "Text and targetLang are required" });
  }

  try {
    const translated = await translateText(req.body.in, req.body.lang);
    res.json({ translated });
  } catch (error) {
    next(error);
  }
};
