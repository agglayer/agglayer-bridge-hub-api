import { z } from "zod";

export const networkIdsSchema = z
    .string()
    .transform((val) => val.split(",").map((v) => Number(v)))
    .refine((arr) => arr.every((n) => Number.isInteger(n) && n >= 0), {
        message: "Network IDs must be non-negative integers",
    });
