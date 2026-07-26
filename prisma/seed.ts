import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    id: "user-officer-1",
    email: "officer@sahivibhag.gov.in",
    name: "Officer Rajesh Kumar",
    password: "officer123",
    role: "OFFICER" as const,
    department: "Public Works Department (PWD)",
  },
  {
    id: "user-officer-2",
    email: "officer.muni@sahivibhag.gov.in",
    name: "Inspector Suresh Sharma",
    password: "officer123",
    role: "OFFICER" as const,
    department: "Municipal Corporation",
  },
  {
    id: "user-consumer-1",
    email: "citizen@sahivibhag.gov.in",
    name: "Amit Sharma",
    password: "consumer123",
    role: "CONSUMER" as const,
    department: null,
  },
  {
    id: "user-consumer-2",
    email: "consumer@gmail.com",
    name: "Sonia Gupta",
    password: "consumer123",
    role: "CONSUMER" as const,
    department: null,
  },
];

const complaints = [
  {
    id: "complaint-1",
    title: "Potholes on Main Road near IIT Jammu",
    description:
      "There are multiple deep potholes on the main approach road to the IIT Jammu campus. They are causing severe traffic delays and pose a safety risk to bikers at night.",
    translatedDescription:
      "आईआईटी जम्मू के पास मुख्य सड़क पर कई गहरे गड्ढे हैं। वे गंभीर यातायात देरी का कारण बन रहे हैं और रात में बाइकर्स के लिए सुरक्षा जोखिम पैदा कर रहे हैं।",
    department: "Public Works Department (PWD)",
    status: "PENDING",
    priority: "HIGH",
    category: "Roads & Infrastructure",
    summary:
      "Potholes on the main road leading to IIT Jammu, causing safety hazards and traffic delays.",
    missingInformation: [
      "Specific landmarks near the worst potholes",
      "Approximate diameter/depth of the potholes",
    ],
    evidenceChecklist: [
      { name: "Photograph of the potholes", required: true, submitted: true },
      { name: "Geo-tag/coordinates", required: false, submitted: true },
    ],
    citizenName: "Amit Sharma",
    citizenPhone: "+91 98765 43210",
    location: "Main Road, Near IIT Jammu Entrance",
    latitude: 32.8028,
    longitude: 74.8871,
    accuracy: 12,
    formattedAddress:
      "Main Road, Jagti, Nagrota, Jammu, Jammu and Kashmir 181221",
    landmark: "Near IIT Jammu Main Entrance Gate",
    city: "Jammu",
    state: "Jammu and Kashmir",
    pincode: "181221",
    confidence: 0.96,
    audioUrl: null,
    officerNotes: null,
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        note: "Grievance received and auto-routed by Sahi Vibhag AI.",
      },
    ],
  },
  {
    id: "complaint-2",
    title: "Garbage Pile Up in Channi Himmat Sector 3",
    description:
      "Municipal waste has not been collected from Sector 3, Channi Himmat for the past 6 days. Stray dogs are scattering it everywhere, causing a terrible smell and health hazards.",
    translatedDescription:
      "पिछले 6 दिनों से चन्नी हिम्मत सेक्टर 3 से नगर पालिका का कचरा नहीं उठाया गया है। आवारा कुत्ते इसे हर जगह बिखेर रहे हैं, जिससे भयानक बदबू और स्वास्थ्य संबंधी खतरे पैदा हो रहे हैं।",
    department: "Municipal Corporation",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "Waste Management",
    summary:
      "Uncollected municipal garbage for 6 days in Channi Himmat Sector 3, leading to sanitation and stray animal issues.",
    missingInformation: [],
    evidenceChecklist: [
      { name: "Image of the garbage site", required: true, submitted: true },
    ],
    citizenName: "Sonia Gupta",
    citizenPhone: "+91 94191 12345",
    location: "Sector 3, Lane 4, Channi Himmat, Jammu",
    latitude: 32.6953,
    longitude: 74.8837,
    accuracy: 15,
    formattedAddress:
      "Sector 3, Lane 4, Channi Himmat, Jammu, Jammu and Kashmir 180015",
    landmark: "Opposite Community Park",
    city: "Jammu",
    state: "Jammu and Kashmir",
    pincode: "180015",
    confidence: 0.94,
    audioUrl: null,
    officerNotes:
      "Sanitation inspector has been notified to deploy a collection truck immediately.",
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        note: "Complaint filed.",
      },
      {
        status: "IN_PROGRESS",
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
        note: "Assigned to Ward Inspector Rajesh Kumar.",
      },
    ],
  },
  {
    id: "complaint-3",
    title: "Streetlights not working on Bypass Road",
    description:
      "The streetlights from Chowadi to Sainik Colony Bypass are completely dark. This has led to two minor accidents in the last week. Please fix them.",
    translatedDescription: null,
    department: "Electricity Department (PDD)",
    status: "PENDING",
    priority: "URGENT",
    category: "Street Lighting",
    summary:
      "Non-functional streetlights on the Bypass Road stretch between Chowadi and Sainik Colony, leading to dark areas and accidents.",
    missingInformation: ["Specific pole numbers if visible"],
    evidenceChecklist: [
      {
        name: "Photo of the dark road at night",
        required: true,
        submitted: false,
      },
    ],
    citizenName: "Vikram Singh",
    citizenPhone: "+91 99060 98765",
    location: "Chowadi to Sainik Colony Bypass Road, Jammu",
    latitude: 32.6781,
    longitude: 74.9124,
    accuracy: 25,
    formattedAddress:
      "National Highway 44 Bypass, Chowadi, Jammu, Jammu and Kashmir 180011",
    landmark: "Near Sainik Colony Flyover",
    city: "Jammu",
    state: "Jammu and Kashmir",
    pincode: "180011",
    confidence: 0.98,
    audioUrl: null,
    officerNotes: null,
    timeline: [
      {
        status: "SUBMITTED",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        note: "Complaint filed and analyzed.",
      },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  for (const user of users) {
    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: user.password,
        role: user.role,
        department: user.department,
      },
      create: user,
    });
    console.log(`User seeded: ${upsertedUser.email} (${upsertedUser.role})`);
  }

  for (const complaint of complaints) {
    const upsertedComplaint = await prisma.complaint.upsert({
      where: { id: complaint.id },
      update: {},
      create: complaint,
    });
    console.log(`Complaint seeded: ${upsertedComplaint.id} - ${upsertedComplaint.title}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
