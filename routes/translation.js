import { Router } from "express";
import { translateHandler } from "../controllers/translate.js";

const translateRoute = Router();

translateRoute.post("/translate", translateHandler);

export default translateRoute;
