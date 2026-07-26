import { PrismaClient, Complaint } from "@prisma/client";
import fs from "fs";
import path from "path";
import os from "os";

// Helper to determine if we should use the mock database
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  // If it's the default prisma+postgres local dev URL or empty, treat as not set
  if (url.startsWith("prisma+postgres://") || url.includes("localhost:51213")) {
    return null;
  }
  return url;
};

const hasRealDb = !!getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize real Prisma client if available (singleton pattern for Next.js)
let prismaInstance: PrismaClient | null = null;
if (hasRealDb) {
  try {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
  }
}

// File-based Mock Database Path (using os.tmpdir to prevent Next.js dev reloads)
const MOCK_DB_PATH = path.join(os.tmpdir(), "sahi_vibhag_mock_db.json");
const MOCK_USERS_PATH = path.join(os.tmpdir(), "sahi_vibhag_mock_users.json");

export interface MockUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: "CONSUMER" | "OFFICER";
  department?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const INITIAL_MOCK_USERS: MockUser[] = [
  {
    id: "user-officer-1",
    email: "officer@sahivibhag.gov.in",
    name: "Officer Rajesh Kumar",
    password: "officer123",
    role: "OFFICER",
    department: "Public Works Department (PWD)",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "user-officer-2",
    email: "officer.muni@sahivibhag.gov.in",
    name: "Inspector Suresh Sharma",
    password: "officer123",
    role: "OFFICER",
    department: "Municipal Corporation",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "user-consumer-1",
    email: "citizen@sahivibhag.gov.in",
    name: "Amit Sharma",
    password: "consumer123",
    role: "CONSUMER",
    department: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "user-consumer-2",
    email: "consumer@gmail.com",
    name: "Sonia Gupta",
    password: "consumer123",
    role: "CONSUMER",
    department: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const readMockUsers = (): MockUser[] => {
  if (!fs.existsSync(MOCK_USERS_PATH)) {
    fs.writeFileSync(MOCK_USERS_PATH, JSON.stringify(INITIAL_MOCK_USERS, null, 2), "utf8");
    return INITIAL_MOCK_USERS;
  }
  try {
    const data = fs.readFileSync(MOCK_USERS_PATH, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_MOCK_USERS;
  }
};

const writeMockUsers = (users: MockUser[]) => {
  fs.writeFileSync(MOCK_USERS_PATH, JSON.stringify(users, null, 2), "utf8");
};

// Helper to read/write mock data
const readMockDb = (): Complaint[] => {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    // Seed with some initial realistic complaints for the dashboard
    const initialComplaints: Complaint[] = [
      {
        id: "complaint-1",
        title: "Potholes on Main Road near IIT Jammu",
        description: "There are multiple deep potholes on the main approach road to the IIT Jammu campus. They are causing severe traffic delays and pose a safety risk to bikers at night.",
        translatedDescription: "आईआईटी जम्मू के पास मुख्य सड़क पर कई गहरे गड्ढे हैं। वे गंभीर यातायात देरी का कारण बन रहे हैं और रात में बाइकर्स के लिए सुरक्षा जोखिम पैदा कर रहे हैं।",
        department: "Public Works Department (PWD)",
        status: "PENDING",
        priority: "HIGH",
        category: "Roads & Infrastructure",
        summary: "Potholes on the main road leading to IIT Jammu, causing safety hazards and traffic delays.",
        missingInformation: JSON.stringify(["Specific landmarks near the worst potholes", "Approximate diameter/depth of the potholes"]),
        evidenceChecklist: JSON.stringify([
          { name: "Photograph of the potholes", required: true, submitted: true },
          { name: "Geo-tag/coordinates", required: false, submitted: true }
        ]),
        citizenName: "Amit Sharma",
        citizenPhone: "+91 98765 43210",
        location: "Main Road, Near IIT Jammu Entrance",
        latitude: 32.8028,
        longitude: 74.8871,
        accuracy: 12,
        formattedAddress: "Main Road, Jagti, Nagrota, Jammu, Jammu and Kashmir 181221",
        landmark: "Near IIT Jammu Main Entrance Gate",
        city: "Jammu",
        state: "Jammu and Kashmir",
        pincode: "181221",
        district: "Jammu",
        municipality: "Jammu Municipal Corporation",
        subcategory: "Road Damage",
        assignedAuthority: "Public Works Department (PWD J&K)",
        routingReason: "Road maintenance in J&K is governed by PWD J&K.",
        aiConfidence: 0.96,
        routingConfidence: 0.96,
        locationMapped: true,
        confidence: 0.96,
        audioUrl: null,
        officerNotes: null,
        timeline: JSON.stringify([
          { status: "SUBMITTED", timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), note: "Grievance received and auto-routed by Sahi Vibhag AI." }
        ]),
        createdAt: new Date(Date.now() - 3600000 * 5),
        updatedAt: new Date(Date.now() - 3600000 * 5)
      },
      {
        id: "complaint-2",
        title: "Garbage Pile Up in Channi Himmat Sector 3",
        description: "Municipal waste has not been collected from Sector 3, Channi Himmat for the past 6 days. Stray dogs are scattering it everywhere, causing a terrible smell and health hazards.",
        translatedDescription: "पिछले 6 दिनों से चन्नी हिम्मत सेक्टर 3 से नगर पालिका का कचरा नहीं उठाया गया है। आवारा कुत्ते इसे हर जगह बिखेर रहे हैं, जिससे भयानक बदबू और स्वास्थ्य संबंधी खतरे पैदा हो रहे हैं।",
        department: "Jammu Municipal Corporation",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        category: "Garbage",
        summary: "Uncollected municipal garbage for 6 days in Channi Himmat Sector 3, leading to sanitation and stray animal issues.",
        missingInformation: JSON.stringify([]),
        evidenceChecklist: JSON.stringify([
          { name: "Image of the garbage site", required: true, submitted: true }
        ]),
        citizenName: "Sonia Gupta",
        citizenPhone: "+91 94191 12345",
        location: "Sector 3, Lane 4, Channi Himmat, Jammu",
        latitude: 32.6953,
        longitude: 74.8837,
        accuracy: 15,
        formattedAddress: "Sector 3, Lane 4, Channi Himmat, Jammu, Jammu and Kashmir 180015",
        landmark: "Opposite Community Park",
        city: "Jammu",
        state: "Jammu and Kashmir",
        pincode: "180015",
        district: "Jammu",
        municipality: "Jammu Municipal Corporation",
        subcategory: "Waste Management",
        assignedAuthority: "Jammu Municipal Corporation",
        routingReason: "Sanitation and waste management in Jammu city fall under JMC.",
        aiConfidence: 0.94,
        routingConfidence: 0.94,
        locationMapped: true,
        confidence: 0.94,
        audioUrl: null,
        officerNotes: "Sanitation inspector has been notified to deploy a collection truck immediately.",
        timeline: JSON.stringify([
          { status: "SUBMITTED", timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), note: "Complaint filed." },
          { status: "IN_PROGRESS", timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), note: "Assigned to Ward Inspector Rajesh Kumar." }
        ]),
        createdAt: new Date(Date.now() - 3600000 * 24),
        updatedAt: new Date(Date.now() - 3600000 * 20)
      },
      {
        id: "complaint-3",
        title: "Streetlights not working on Bypass Road",
        description: "The streetlights from Chowadi to Sainik Colony Bypass are completely dark. This has led to two minor accidents in the last week. Please fix them.",
        translatedDescription: null,
        department: "Jammu Power Distribution Corporation Limited (JPDCL)",
        status: "PENDING",
        priority: "URGENT",
        category: "Electricity",
        summary: "Non-functional streetlights on the Bypass Road stretch between Chowadi and Sainik Colony, leading to dark areas and accidents.",
        missingInformation: JSON.stringify(["Specific pole numbers if visible"]),
        evidenceChecklist: JSON.stringify([
          { name: "Photo of the dark road at night", required: true, submitted: false }
        ]),
        citizenName: "Vikram Singh",
        citizenPhone: "+91 99060 98765",
        location: "Chowadi to Sainik Colony Bypass Road, Jammu",
        latitude: 32.6781,
        longitude: 74.9124,
        accuracy: 25,
        formattedAddress: "National Highway 44 Bypass, Chowadi, Jammu, Jammu and Kashmir 180011",
        landmark: "Near Sainik Colony Flyover",
        city: "Jammu",
        state: "Jammu and Kashmir",
        pincode: "180011",
        district: "Jammu",
        municipality: "Jammu Municipal Corporation",
        subcategory: "Street Lighting",
        assignedAuthority: "Jammu Power Distribution Corporation Limited (JPDCL)",
        routingReason: "Power distribution in Jammu region is handled by JPDCL.",
        aiConfidence: 0.98,
        routingConfidence: 0.98,
        locationMapped: true,
        confidence: 0.98,
        audioUrl: null,
        officerNotes: null,
        timeline: JSON.stringify([
          { status: "SUBMITTED", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), note: "Complaint filed and analyzed." }
        ]),
        createdAt: new Date(Date.now() - 3600000 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 2)
      }
    ];
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(initialComplaints, null, 2), "utf8");
    return initialComplaints;
  }
  try {
    const data = fs.readFileSync(MOCK_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const writeMockDb = (data: Complaint[]) => {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), "utf8");
};

// Mock Client Implementation mimicking Prisma Client API
const mockDb = {
  user: {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      const users = readMockUsers();
      if (args.where.id) return users.find((u) => u.id === args.where.id) || null;
      if (args.where.email) return users.find((u) => u.email.toLowerCase() === args.where.email?.toLowerCase()) || null;
      return null;
    },
    findFirst: async (args?: { where?: any }) => {
      const users = readMockUsers();
      if (!args?.where) return users[0] || null;
      return users.find((u) => {
        for (const key in args.where) {
          if (key === "email" && u.email.toLowerCase() !== args.where.email?.toLowerCase()) return false;
          if (key === "role" && u.role !== args.where.role) return false;
        }
        return true;
      }) || null;
    },
    findMany: async () => readMockUsers(),
    create: async (args: { data: any }) => {
      const users = readMockUsers();
      const newUser: MockUser = {
        id: args.data.id || `user-${Date.now()}`,
        email: args.data.email,
        name: args.data.name,
        password: args.data.password,
        role: args.data.role || "CONSUMER",
        department: args.data.department || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.push(newUser);
      writeMockUsers(users);
      return newUser;
    },
  },
  complaint: {
    findMany: async (args?: {
      orderBy?: { [key: string]: "asc" | "desc" };
      where?: any;
    }) => {
      let data = readMockDb();

      // Apply filtering if where is defined
      if (args?.where) {
        data = data.filter((item) => {
          for (const key in args.where) {
            const condition = args.where[key];
            if (typeof condition === "object" && condition !== null) {
              if ("equals" in condition && item[key as keyof Complaint] !== condition.equals) {
                return false;
              }
            } else if (item[key as keyof Complaint] !== condition) {
              return false;
            }
          }
          return true;
        });
      }

      // Apply ordering
      if (args?.orderBy) {
        const orderKey = Object.keys(args.orderBy)[0];
        const orderDir = args.orderBy[orderKey];
        data.sort((a: any, b: any) => {
          const valA = new Date(a[orderKey]).getTime() || a[orderKey];
          const valB = new Date(b[orderKey]).getTime() || b[orderKey];
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;
          if (valA < valB) return orderDir === "asc" ? -1 : 1;
          if (valA > valB) return orderDir === "asc" ? 1 : -1;
          return 0;
        });
      }
      return data;
    },

    findUnique: async (args: { where: { id: string } }) => {
      const data = readMockDb();
      return data.find((item) => item.id === args.where.id) || null;
    },

    create: async (args: { data: any }) => {
      const data = readMockDb();
      const newComplaint: Complaint = {
        id: args.data.id || `complaint-${Date.now()}`,
        title: args.data.title || "",
        description: args.data.description || "",
        translatedDescription: args.data.translatedDescription || null,
        department: args.data.department || "General Administration",
        status: args.data.status || "PENDING",
        priority: args.data.priority || "MEDIUM",
        category: args.data.category || "General",
        summary: args.data.summary || "",
        missingInformation: typeof args.data.missingInformation === "string" 
          ? args.data.missingInformation 
          : JSON.stringify(args.data.missingInformation || []),
        evidenceChecklist: typeof args.data.evidenceChecklist === "string" 
          ? args.data.evidenceChecklist 
          : JSON.stringify(args.data.evidenceChecklist || []),
        citizenName: args.data.citizenName || null,
        citizenPhone: args.data.citizenPhone || null,
        location: args.data.location || null,
        latitude: args.data.latitude !== undefined ? args.data.latitude : null,
        longitude: args.data.longitude !== undefined ? args.data.longitude : null,
        accuracy: args.data.accuracy !== undefined ? args.data.accuracy : null,
        formattedAddress: args.data.formattedAddress || null,
        landmark: args.data.landmark || null,
        city: args.data.city || null,
        state: args.data.state || null,
        pincode: args.data.pincode || null,
        district: args.data.district || null,
        municipality: args.data.municipality || null,
        subcategory: args.data.subcategory || null,
        assignedAuthority: args.data.assignedAuthority || args.data.department || null,
        routingReason: args.data.routingReason || null,
        aiConfidence: args.data.aiConfidence !== undefined ? args.data.aiConfidence : 1.0,
        routingConfidence: args.data.routingConfidence !== undefined ? args.data.routingConfidence : 1.0,
        locationMapped: args.data.locationMapped !== undefined ? Boolean(args.data.locationMapped) : true,
        confidence: args.data.confidence !== undefined ? args.data.confidence : 1.0,
        audioUrl: args.data.audioUrl || null,
        officerNotes: args.data.officerNotes || null,
        timeline: typeof args.data.timeline === "string" 
          ? args.data.timeline 
          : JSON.stringify(args.data.timeline || []),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      data.push(newComplaint);
      writeMockDb(data);
      return newComplaint;
    },

    update: async (args: { where: { id: string }; data: any }) => {
      const data = readMockDb();
      const index = data.findIndex((item) => item.id === args.where.id);
      if (index === -1) {
        throw new Error(`Record to update not found: ${args.where.id}`);
      }

      const existing = data[index];
      
      // Update values
      const updated: Complaint = {
        ...existing,
        ...args.data,
        missingInformation: args.data.missingInformation !== undefined
          ? (typeof args.data.missingInformation === "string" ? args.data.missingInformation : JSON.stringify(args.data.missingInformation))
          : existing.missingInformation,
        evidenceChecklist: args.data.evidenceChecklist !== undefined
          ? (typeof args.data.evidenceChecklist === "string" ? args.data.evidenceChecklist : JSON.stringify(args.data.evidenceChecklist))
          : existing.evidenceChecklist,
        timeline: args.data.timeline !== undefined
          ? (typeof args.data.timeline === "string" ? args.data.timeline : JSON.stringify(args.data.timeline))
          : existing.timeline,
        updatedAt: new Date(),
      };

      data[index] = updated;
      writeMockDb(data);
      return updated;
    },

    delete: async (args: { where: { id: string } }) => {
      const data = readMockDb();
      const index = data.findIndex((item) => item.id === args.where.id);
      if (index === -1) {
        throw new Error(`Record to delete not found: ${args.where.id}`);
      }
      const deleted = data.splice(index, 1)[0];
      writeMockDb(data);
      return deleted;
    },

    count: async () => {
      return readMockDb().length;
    }
  },
};

// Export the real Prisma client if DATABASE_URL is set, otherwise fall back to our mock client
export const db = hasRealDb && prismaInstance ? prismaInstance : (mockDb as any as PrismaClient);
export const isMockDb = !hasRealDb;

console.log(
  `[Sahi Vibhag AI DB] Using ${isMockDb ? "local JSON File Mock Database (temporary storage)" : "Neon PostgreSQL Server"}`
);

