import { resolveJurisdictionAndRoute } from "../src/lib/jurisdictionEngine";
import { analyzeComplaint } from "../src/lib/gemini";

async function runTests() {
  console.log("==================================================");
  console.log("       TESTING STAGE 1 AI & STAGE 2 ROUTING       ");
  console.log("==================================================\n");

  const testCases = [
    {
      name: "Test Case 1: Citizen wrote 'Bijli nahi aa rahi Phase 5 Mohali'",
      text: "Bijli nahi aa rahi Phase 5 Mohali",
      expectedAuthority: "Punjab State Power Corporation Limited (PSPCL)",
      expectedState: "Punjab",
      expectedDistrict: "SAS Nagar",
    },
    {
      name: "Test Case 2: Citizen wrote 'Pothole on main road Phase 7 Mohali'",
      text: "Pothole on main road Phase 7 Mohali",
      expectedAuthority: "Public Works Department (PWD Punjab)",
      expectedState: "Punjab",
    },
    {
      name: "Test Case 3: Delhi South Electricity (BSES)",
      text: "Power cut in Saket South Delhi since morning",
      expectedAuthority: "BSES Rajdhani / Yamuna Power Limited (BSES)",
      expectedState: "Delhi",
    },
    {
      name: "Test Case 4: Delhi North Electricity (TPDDL)",
      text: "Sparking in transformer near Rohini North West Delhi",
      expectedAuthority: "Tata Power Delhi Distribution Limited (TPDDL)",
      expectedState: "Delhi",
    },
    {
      name: "Test Case 5: J&K Power outage in Jammu",
      text: "Power outage in Gandhi Nagar Jammu",
      expectedAuthority: "Jammu Power Distribution Corporation Limited (JPDCL)",
      expectedState: "Jammu & Kashmir",
    },
    {
      name: "Test Case 6: J&K Water issue",
      text: "Dirty water coming from tap in Jammu",
      expectedAuthority: "Jal Shakti Department (PHED J&K)",
      expectedState: "Jammu & Kashmir",
    },
    {
      name: "Test Case 7: Ambiguous complaint with no place details",
      text: "Road issue",
      expectedMapped: false,
    }
  ];

  let passed = 0;

  for (const tc of testCases) {
    console.log(`\n--- ${tc.name} ---`);
    console.log(`Input: "${tc.text}"`);
    
    const result = await analyzeComplaint(tc.text);
    
    console.log("Category:            ", result.category);
    console.log("Extracted Location:  ", result.extractedLocation);
    console.log("Detected State:      ", result.detectedState);
    console.log("Detected District:   ", result.detectedDistrict);
    console.log("Detected Municipality:", result.detectedMunicipality);
    console.log("Assigned Authority:  ", result.assignedAuthority);
    console.log("Reason for Routing:  ", result.reasonForRouting);
    console.log("AI Confidence:       ", result.confidence);
    console.log("Routing Confidence:  ", result.routingConfidence);
    console.log("Location Mapped:     ", result.locationMapped);

    if (tc.expectedMapped !== undefined) {
      if (result.locationMapped === tc.expectedMapped) {
        console.log("✅ PASSED (Location ambiguity correctly detected)");
        console.log("Suggestions: ", result.locationSuggestions);
        passed++;
      } else {
        console.log("❌ FAILED ambiguity check");
      }
    } else {
      const authorityMatches = result.assignedAuthority === tc.expectedAuthority;
      const stateMatches = result.detectedState === tc.expectedState;
      
      if (authorityMatches && stateMatches) {
        console.log("✅ PASSED");
        passed++;
      } else {
        console.log(`❌ FAILED. Expected Authority: '${tc.expectedAuthority}', Got: '${result.assignedAuthority}'`);
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`RESULTS: ${passed}/${testCases.length} Tests Passed`);
  console.log(`==================================================`);
}

runTests().catch(console.error);
