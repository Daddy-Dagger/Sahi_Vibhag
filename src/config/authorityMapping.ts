export interface LocalityRule {
  keywords: string[];
  authority: string;
  reason: string;
}

export interface CategoryAuthorityRule {
  authority: string;
  reason: string;
  subcategories?: Record<string, { authority: string; reason: string }>;
  localityRules?: LocalityRule[];
}

export interface StateConfig {
  stateName: string;
  aliases: string[];
  defaultMunicipalityPattern?: string; // e.g. "{city} Municipal Corporation"
  categories: Record<string, CategoryAuthorityRule>;
  defaultAuthority?: {
    authority: string;
    reason: string;
  };
}

export interface AuthorityMappingConfig {
  states: Record<string, StateConfig>;
  categoryAliases: Record<string, string>;
  defaultFallbackState: StateConfig;
}

export const AUTHORITY_MAPPING: AuthorityMappingConfig = {
  // Category normalized key mapping
  categoryAliases: {
    "electricity": "Electricity",
    "power": "Electricity",
    "electricity & street lighting": "Electricity",
    "street lighting": "Streetlights",
    "streetlights": "Streetlights",
    "lights": "Streetlights",
    "roads": "Roads",
    "roads & infrastructure": "Roads",
    "roadways": "Roads",
    "infrastructure": "Roads",
    "potholes": "Roads",
    "water": "Water Supply",
    "water supply": "Water Supply",
    "water & sewage": "Water Supply",
    "drinking water": "Water Supply",
    "sewage": "Water Supply",
    "garbage": "Garbage",
    "waste management": "Garbage",
    "waste management & sanitation": "Garbage",
    "sanitation": "Garbage",
    "waste": "Garbage",
    "traffic": "Traffic",
    "traffic control": "Traffic",
    "traffic & parking": "Traffic",
  },

  states: {
    "punjab": {
      stateName: "Punjab",
      aliases: ["pb", "punjab"],
      defaultMunicipalityPattern: "{city} Municipal Corporation",
      categories: {
        "Electricity": {
          authority: "Punjab State Power Corporation Limited (PSPCL)",
          reason: "Electricity generation, distribution, and power line complaints in Punjab are handled by PSPCL.",
        },
        "Roads": {
          authority: "Public Works Department (PWD Punjab)",
          reason: "State highways, major arterial roads, and infrastructure maintenance in Punjab are governed by PWD Punjab.",
        },
        "Water Supply": {
          authority: "Punjab Water Supply & Sewerage Board",
          reason: "Water supply infrastructure, clean water distribution, and major sewerage networks in Punjab are managed by PWSSB.",
        },
        "Garbage": {
          authority: "Municipal Corporation",
          reason: "Solid waste management, garbage collection, and local sanitation in urban Punjab are handled by the local Municipal Corporation.",
        },
        "Streetlights": {
          authority: "Municipal Corporation",
          reason: "Public street lighting installation and repairs are maintained by the local Municipal Corporation.",
        },
        "Traffic": {
          authority: "Punjab Traffic Police",
          reason: "Traffic management and road safety enforcement in Punjab are managed by Punjab Traffic Police.",
        }
      },
      defaultAuthority: {
        authority: "District Collectorate / Deputy Commissioner Office",
        reason: "General civic grievances in Punjab are routed to the District Deputy Commissioner.",
      }
    },

    "delhi": {
      stateName: "Delhi",
      aliases: ["dl", "delhi", "nct of delhi", "national capital territory of delhi", "new delhi"],
      defaultMunicipalityPattern: "Municipal Corporation of Delhi (MCD)",
      categories: {
        "Electricity": {
          authority: "BSES / TPDDL Delhi",
          reason: "Electricity supply in Delhi is divided geographically: TPDDL covers North/North-West Delhi while BSES covers South, West, Central, and East Delhi.",
          localityRules: [
            {
              keywords: ["north delhi", "north-west delhi", "rohini", "pitampura", "civil lines", "model town", "shalimar bagh", "narela", "jahangirpuri", "wazirabad", "badli", "tis hazari", "kamla nagar"],
              authority: "Tata Power Delhi Distribution Limited (TPDDL)",
              reason: "Electricity supply in North and North-West Delhi localities is powered and maintained by TPDDL."
            },
            {
              keywords: ["south delhi", "west delhi", "central delhi", "east delhi", "saket", "hauz khas", "dwarka", "janakpuri", "laxmi nagar", "preet vihar", "mayur vihar", "lajpat nagar", "kalkaji", "connaught place"],
              authority: "BSES Rajdhani / Yamuna Power Limited (BSES)",
              reason: "Electricity distribution across South, West, Central, and East Delhi is managed by BSES (BRPL/BYPL)."
            }
          ]
        },
        "Roads": {
          authority: "Public Works Department (PWD Delhi)",
          reason: "Major roads (width > 60 ft), flyovers, and arterial transit routes in Delhi are maintained by PWD Delhi.",
        },
        "Garbage": {
          authority: "Municipal Corporation of Delhi (MCD)",
          reason: "Civic waste collection, street sweeping, and sanitation across Delhi zones fall under MCD jurisdiction.",
        },
        "Water Supply": {
          authority: "Delhi Jal Board (DJB)",
          reason: "Drinking water supply, pipeline maintenance, and sewage treatment in Delhi are handled exclusively by Delhi Jal Board.",
        },
        "Streetlights": {
          authority: "Municipal Corporation of Delhi (MCD)",
          reason: "Street lighting infrastructure on municipal roads in Delhi is managed by MCD.",
        },
        "Traffic": {
          authority: "Delhi Traffic Police",
          reason: "Traffic flow control, parking violations, and road signal maintenance in Delhi are enforced by Delhi Traffic Police.",
        }
      },
      defaultAuthority: {
        authority: "Government of NCT of Delhi (Department of Urban Development)",
        reason: "General administrative complaints in Delhi are routed to the Department of Urban Development.",
      }
    },

    "jammu & kashmir": {
      stateName: "Jammu & Kashmir",
      aliases: ["j&k", "jk", "jammu & kashmir", "jammu and kashmir", "jammu", "kashmir"],
      defaultMunicipalityPattern: "{city} Municipal Corporation",
      categories: {
        "Electricity": {
          authority: "Jammu Power Distribution Corporation Limited (JPDCL)",
          reason: "Power distribution, billing, and electrical line maintenance in Jammu region are managed by JPDCL (and KPDCL in Kashmir).",
          localityRules: [
            {
              keywords: ["jammu", "samba", "kathua", "udhampur", "reasi", "rajouri", "poonch", "doda", "ramban", "kishtwar"],
              authority: "Jammu Power Distribution Corporation Limited (JPDCL)",
              reason: "Power distribution across Jammu province is managed by JPDCL."
            },
            {
              keywords: ["srinagar", "anantnag", "baramulla", "pulwama", "ganderbal", "budgam", "kupwara", "kulgam", "shopian", "bandipora"],
              authority: "Kashmir Power Distribution Corporation Limited (KPDCL)",
              reason: "Electricity distribution in Kashmir province is managed by KPDCL."
            }
          ]
        },
        "Roads": {
          authority: "Public Works Department (PWD J&K)",
          reason: "Road networks, bridges, and civil public works in Jammu & Kashmir are managed by PWD (R&B) J&K.",
        },
        "Water Supply": {
          authority: "Jal Shakti Department (PHED J&K)",
          reason: "Public drinking water supply and rural water infrastructure in J&K are governed by Jal Shakti (PHED J&K).",
        },
        "Garbage": {
          authority: "Jammu Municipal Corporation",
          reason: "Urban sanitation, waste collection, and municipal civic services in J&K are handled by local Municipal Corporations.",
          localityRules: [
            {
              keywords: ["srinagar"],
              authority: "Srinagar Municipal Corporation (SMC)",
              reason: "Sanitation and waste management in Srinagar city fall under Srinagar Municipal Corporation (SMC)."
            },
            {
              keywords: ["jammu"],
              authority: "Jammu Municipal Corporation (JMC)",
              reason: "Sanitation and solid waste management in Jammu city are handled by Jammu Municipal Corporation (JMC)."
            }
          ]
        },
        "Streetlights": {
          authority: "Jammu Municipal Corporation",
          reason: "Street lighting installation and power maintenance on municipal roads are managed by the local Municipal Corporation.",
          localityRules: [
            {
              keywords: ["srinagar"],
              authority: "Srinagar Municipal Corporation (SMC)",
              reason: "Street lighting maintenance in Srinagar city is handled by SMC."
            },
            {
              keywords: ["jammu"],
              authority: "Jammu Municipal Corporation (JMC)",
              reason: "Street lighting maintenance in Jammu city is handled by JMC."
            }
          ]
        },
        "Traffic": {
          authority: "J&K Traffic Police",
          reason: "Traffic management and vehicle regulation across J&K highways and cities are enforced by J&K Traffic Police.",
        }
      },
      defaultAuthority: {
        authority: "General Administration Department (GAD J&K)",
        reason: "General civic administrative complaints in J&K are routed to GAD J&K.",
      }
    },

    "haryana": {
      stateName: "Haryana",
      aliases: ["hr", "haryana"],
      defaultMunicipalityPattern: "{city} Municipal Corporation",
      categories: {
        "Electricity": {
          authority: "UHBVN / DHBVN Haryana",
          reason: "Power distribution in Haryana is split between Uttar Haryana Bijli Vitran Nigam (UHBVN) and Dakshin Haryana Bijli Vitran Nigam (DHBVN).",
        },
        "Roads": {
          authority: "Public Works Department (PWD Haryana)",
          reason: "State highways and infrastructure in Haryana are maintained by PWD Haryana.",
        },
        "Water Supply": {
          authority: "Public Health Engineering Department (PHED Haryana)",
          reason: "Water supply and sanitation services in Haryana are managed by PHED Haryana.",
        },
        "Garbage": {
          authority: "Municipal Corporation",
          reason: "Sanitation and waste management are administered by local Municipal Corporations in Haryana.",
        },
        "Streetlights": {
          authority: "Municipal Corporation",
          reason: "Public lighting maintenance is handled by local Municipal Corporations in Haryana.",
        }
      }
    },

    "uttar pradesh": {
      stateName: "Uttar Pradesh",
      aliases: ["up", "uttar pradesh"],
      defaultMunicipalityPattern: "{city} Nagar Nigam",
      categories: {
        "Electricity": {
          authority: "UP Power Corporation Limited (UPPCL)",
          reason: "Power distribution across Uttar Pradesh is governed by UPPCL.",
        },
        "Roads": {
          authority: "Public Works Department (PWD UP)",
          reason: "Road construction and maintenance in Uttar Pradesh are managed by PWD UP.",
        },
        "Water Supply": {
          authority: "UP Jal Nigam",
          reason: "Water supply pipelines and sewage infrastructure in Uttar Pradesh fall under UP Jal Nigam.",
        },
        "Garbage": {
          authority: "Nagar Nigam",
          reason: "Urban sanitation and waste collection in UP are managed by local Nagar Nigams.",
        },
        "Streetlights": {
          authority: "Nagar Nigam",
          reason: "Streetlights in urban UP are maintained by the local Nagar Nigam.",
        }
      }
    }
  },

  // Fallback state config for unrecognized states
  defaultFallbackState: {
    stateName: "India (General Jurisdiction)",
    aliases: ["default"],
    defaultMunicipalityPattern: "{city} Municipal Corporation",
    categories: {
      "Electricity": {
        authority: "State Electricity Board / DISCOM",
        reason: "Electricity issues are routed to the state electricity distribution utility.",
      },
      "Roads": {
        authority: "Public Works Department (PWD)",
        reason: "Road infrastructure grievances are assigned to the state Public Works Department.",
      },
      "Water Supply": {
        authority: "Water Supply & Sewerage Board",
        reason: "Drinking water and sanitation complaints are routed to the state Water Supply Board.",
      },
      "Garbage": {
        authority: "Local Municipal Corporation",
        reason: "Sanitation and solid waste grievances fall under local Municipal Corporation jurisdiction.",
      },
      "Streetlights": {
        authority: "Local Municipal Corporation",
        reason: "Public street lighting issues are managed by local urban local bodies.",
      },
      "Traffic": {
        authority: "Traffic Police Department",
        reason: "Traffic congestion and regulation complaints are routed to local Traffic Police.",
      }
    },
    defaultAuthority: {
      authority: "General Public Grievance Redressal Cell",
      reason: "Grievance assigned to general district public redressal office.",
    }
  }
};
