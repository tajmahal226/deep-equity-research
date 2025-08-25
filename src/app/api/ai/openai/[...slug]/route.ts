import { NextResponse, type NextRequest } from "next/server";
import { OPENAI_BASE_URL } from "@/constants/urls";
import { isCompletionsModel, getAllowedTemperature, hasTemperatureRestrictions } from "@/utils/model";

export const runtime = "edge";
export const preferredRegion = [
  "cle1",
  "iad1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
];

const API_PROXY_BASE_URL = process.env.OPENAI_API_BASE_URL || OPENAI_BASE_URL;

async function handler(req: NextRequest) {
  let body;
  if (req.method.toUpperCase() !== "GET") {
    body = await req.json();
  }
  const searchParams = req.nextUrl.searchParams;
  const path = searchParams.getAll("slug");
  searchParams.delete("slug");
  const params = searchParams.toString();

  try {
    let url = `${API_PROXY_BASE_URL}/${decodeURIComponent(path.join("/"))}`;
    
    // Handle endpoint routing based on model type
    if (body && body.model) {
      const model = body.model;
      const currentEndpoint = path.join("/");
      
      // Normalize model name for consistent checking
      const normalizedModel = model.toLowerCase().replace(/\s+/g, '-');
      
      // Log model detection for debugging
      console.log(`OpenAI API: Model=${model}, Normalized=${normalizedModel}, Endpoint=${currentEndpoint}, IsCompletions=${isCompletionsModel(model)}, HasTempRestrictions=${hasTemperatureRestrictions(model)}`);
      
      // Handle undefined or missing model names
      if (!model || model === "undefined" || model === "") {
        console.error("OpenAI API: Model name is undefined or empty", { body, path });
        return NextResponse.json(
          { code: 400, message: "Model name is required" },
          { status: 400 }
        );
      }
      
      // Log initial temperature value
      if (body.temperature !== undefined) {
        console.log(`OpenAI API: Initial temperature=${body.temperature} for model=${model}`);
      }
      
      // Check if we need to route o3 models to completions endpoint
      if (isCompletionsModel(model) && currentEndpoint.includes("chat/completions")) {
        // Route to completions endpoint instead
        const newPath = path.map(segment => 
          segment === "chat" ? "" : segment === "completions" ? "completions" : segment
        ).filter(Boolean);
        url = `${API_PROXY_BASE_URL}/${decodeURIComponent(newPath.join("/"))}`;
        
        // Transform chat format to completions format for o3 models
        if (body.messages) {
          // Convert messages to prompt format
          let prompt = "";
          body.messages.forEach((message: any) => {
            if (message.role === "system") {
              prompt += `System: ${message.content}\n\n`;
            } else if (message.role === "user") {
              prompt += `Human: ${message.content}\n\n`;
            } else if (message.role === "assistant") {
              prompt += `Assistant: ${message.content}\n\n`;
            }
          });
          prompt += "Assistant:";
          
          body.prompt = prompt;
          delete body.messages;
        }
      }
      
      // Handle temperature restrictions for GPT-5 and o3 models
      if (hasTemperatureRestrictions(model) || normalizedModel.includes("o3-")) {
        // Models with temperature restrictions require default temperature, remove parameter entirely
        delete body.temperature;
        console.log(`OpenAI API: Removed temperature parameter for model ${model} (has restrictions: ${hasTemperatureRestrictions(model)})`);
      } else if (body.temperature !== undefined) {
        // For other models, apply temperature restrictions
        const allowedTemp = getAllowedTemperature(model, body.temperature);
        if (allowedTemp !== body.temperature) {
          body.temperature = allowedTemp;
          console.log(`OpenAI API: Adjusted temperature from ${body.temperature} to ${allowedTemp} for model ${model}`);
        }
      }
    }
    
    if (params) url += `?${params}`;
    
    // Log final request parameters for debugging
    if (body && body.model) {
      console.log(`OpenAI API: Final request for ${body.model}`, {
        temperature: body.temperature,
        hasTemperature: 'temperature' in body,
        endpoint: url
      });
    }
    
    const payload: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/json",
        Authorization: req.headers.get("Authorization") || "",
      },
    };
    if (body) payload.body = JSON.stringify(body);
    
    const response = await fetch(url, payload);
    return new NextResponse(response.body, response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`OpenAI API Error: ${error.message}`, { body, path });
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500 }
      );
    }
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
