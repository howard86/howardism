import { type NextRequest, NextResponse } from "next/server";

import { resumeSchema } from "@/app/(blog)/profile/resume/schema";
import { requireSessionForRoute } from "@/lib/auth";
import prisma from "@/services/prisma";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Helpers — map form schema fields to Prisma create inputs
// ---------------------------------------------------------------------------

function splitLines(value: string | undefined): string[] {
  return value ? value.split("\n").filter(Boolean) : [];
}

function mapExperienceCreate(e: {
  company: string;
  companyUrl?: string;
  companyDescription?: string;
  location: string;
  title: string;
  size?: string;
  startDate: string;
  endDate?: string;
  items?: string;
  description?: string;
}) {
  return {
    company: e.company,
    location: e.location,
    title: e.title,
    startDate: new Date(e.startDate),
    endDate: e.endDate ? new Date(e.endDate) : null,
    responsibilities: splitLines(e.items),
    companyUrl: e.companyUrl || null,
    companyDescription: e.companyDescription || null,
    size: e.size || null,
    description: e.description || null,
  };
}

function mapProjectCreate(p: {
  title: string;
  subtitle: string;
  ordering?: number;
  items?: string;
  description?: string;
}) {
  return {
    title: p.title,
    subtitle: p.subtitle,
    ordering: p.ordering ?? 0,
    descriptions: splitLines(p.items),
    description: p.description || null,
  };
}

function mapEducationCreate(e: {
  facility: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  items?: string;
  description?: string;
}) {
  return {
    facility: e.facility,
    degree: e.degree,
    location: e.location,
    startDate: new Date(e.startDate),
    endDate: new Date(e.endDate),
    subjects: splitLines(e.items),
    description: e.description || null,
  };
}

function mapSkillCreate(s: {
  title: string;
  ordering?: number;
  items?: string;
}) {
  return {
    title: s.title,
    ordering: s.ordering ?? 0,
    items: splitLines(s.items),
  };
}

function mapLanguageCreate(l: {
  name: string;
  proficiency: string;
  ordering?: number;
}) {
  return {
    name: l.name,
    proficiency: l.proficiency,
    ordering: l.ordering ?? 0,
  };
}

// ---------------------------------------------------------------------------
// POST /api/resume — create a new resume profile
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSessionForRoute();
    if (!authResult.ok) {
      return authResult.response;
    }

    const rawBody = await request.json();
    const parsed = resumeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "Invalid request body",
        },
        { status: 400 }
      );
    }

    const {
      name,
      address,
      phone,
      email,
      github,
      website,
      company,
      position,
      summary,
      experiences,
      projects,
      educations,
      skills,
      languages,
    } = parsed.data;

    // Find-or-create the applicant by the authenticated user's email.
    // The applicant record holds the personal info; profiles hold per-company data.
    const applicant = await prisma.resumeApplicant.upsert({
      where: { email: authResult.session.user.email },
      update: { name, address, phone, email, github, website },
      create: {
        name,
        address,
        phone,
        email: authResult.session.user.email,
        github,
        website,
      },
    });

    const profile = await prisma.resumeProfile.create({
      data: {
        applicantId: applicant.id,
        company,
        position,
        summary,
        experiences: { create: experiences.map(mapExperienceCreate) },
        projects: { create: projects.map(mapProjectCreate) },
        educations: { create: educations.map(mapEducationCreate) },
        skills: { create: skills.map(mapSkillCreate) },
        languages: { create: languages.map(mapLanguageCreate) },
      },
    });

    return NextResponse.json({ success: true, data: profile.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/resume?profileId=xxx — update an existing resume profile
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireSessionForRoute();
    if (!authResult.ok) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Missing profileId parameter" },
        { status: 400 }
      );
    }

    const profile = await prisma.resumeProfile.findUnique({
      where: { id: profileId },
      include: { applicant: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.applicant.email !== authResult.session.user.email) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parsed = resumeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "Invalid request body",
        },
        { status: 400 }
      );
    }

    const {
      name,
      address,
      phone,
      email,
      github,
      website,
      company,
      position,
      summary,
      experiences,
      projects,
      educations,
      skills,
      languages,
    } = parsed.data;

    // Update applicant personal info alongside the profile.
    await prisma.resumeApplicant.upsert({
      where: { email: authResult.session.user.email },
      update: { name, address, phone, email, github, website },
      create: {
        name,
        address,
        phone,
        email: authResult.session.user.email,
        github,
        website,
      },
    });

    await prisma.resumeProfile.update({
      where: { id: profileId },
      data: {
        company,
        position,
        summary,
        experiences: {
          deleteMany: {},
          create: experiences.map(mapExperienceCreate),
        },
        projects: {
          deleteMany: {},
          create: projects.map(mapProjectCreate),
        },
        educations: {
          deleteMany: {},
          create: educations.map(mapEducationCreate),
        },
        skills: {
          deleteMany: {},
          create: skills.map(mapSkillCreate),
        },
        languages: {
          deleteMany: {},
          create: languages.map(mapLanguageCreate),
        },
      },
    });

    return NextResponse.json({ success: true, data: profileId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
