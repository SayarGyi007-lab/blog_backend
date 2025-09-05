import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import axios from "axios";

export const summarizeContent = asyncHandler(async (req: Request, res: Response) => {
    const { text, summary_length = "medium", output_language = "en" } = req.body;

  if (!text) {
     res.status(400)
     throw new Error("Text is required for summarization")
  }

  try {
    const response = await axios.post(
      "https://api.apyhub.com/ai/summarize-text",
      {
        text,
        summary_length,
        output_language,
      },
      {
        headers: {
          "apy-token": process.env.AI_API_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    console.log( response.data?.data?.summary);
    
    const summary = response.data?.data?.summary;
    
    

    if (!summary) {
        res.status(500)
        throw new Error("No summary returned from API")
        
    }

    res.json({ summary });
  } catch (error: any) {
    console.error("Summarization API error:", error.response?.data || error.message || error);
    res.status(500).json({ message: "Failed to summarize content", error: error.response?.data || error.message });
  }
})

