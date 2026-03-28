import { tavily } from "@tavily/core";
import dotenv from "dotenv";

dotenv.config();


const client = tavily({ apiKey: process.env.TVLY_API_KEY });


export async function searchWeb({query}) {
    return await client.search(query, {
        searchDepth: "advanced",
        includeWebPages: true,
        webPagesCount: 5,
        includeRelatedSearches: true,
        relatedSearchesCount: 3,
    });
}