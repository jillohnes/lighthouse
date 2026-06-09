import { NextRequest, NextResponse } from "next/server";
import { getProgramSettings, saveProgramSettings } from "@/lib/queries/settings";
import {
  ACTIVATION_TYPES,
  DEFAULT_PROGRAM_SETTINGS,
  type ActivationTypeSettings,
  type ProgramSettings,
} from "@/lib/settings";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function isValidSettings(body: unknown): body is ProgramSettings {
  if (!body || typeof body !== "object") return false;
  const settings = body as ProgramSettings;
  if (!settings.activationTypes || typeof settings.activationTypes !== "object") {
    return false;
  }

  for (const type of ACTIVATION_TYPES) {
    const config = settings.activationTypes[type];
    if (!config) return false;
    const fields: (keyof ActivationTypeSettings)[] = [
      "reach",
      "impact",
      "result",
      "budget",
    ];
    for (const field of fields) {
      if (typeof config[field] !== "number" || Number.isNaN(config[field])) {
        return false;
      }
    }
  }

  if (
    !settings.content ||
    typeof settings.content.organicEmv !== "number" ||
    Number.isNaN(settings.content.organicEmv)
  ) {
    return false;
  }

  return true;
}

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const settings = await getProgramSettings();
      return NextResponse.json({ source: "supabase", settings });
    }
    return NextResponse.json({
      source: "default",
      settings: DEFAULT_PROGRAM_SETTINGS,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { source: "error", settings: DEFAULT_PROGRAM_SETTINGS },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidSettings(body)) {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 },
      );
    }

    const settings = await saveProgramSettings(body);
    return NextResponse.json({ source: "supabase", settings });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
