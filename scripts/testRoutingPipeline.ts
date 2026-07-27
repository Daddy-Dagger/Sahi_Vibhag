import { analyzeComplaint } from "../src/lib/gemini";

async function runTests() {
  console.log("==================================================");
  console.log("       TESTING NEW LOCATION RESOLUTION PIPELINE    ");
  console.log("==================================================\n");

  const testCases = [
    {
      name: "Test Case 1: Ambiguous Jagti query ('Pani ki problem in Jagti')",
      text: "Pani ki problem in Jagti",
      expectStatus: "AMBIGUOUS_LOCATION",
      checkOptions: ["Jagti, Jammu", "Jagti, Punjab"],
    },
    {
      name: "Test Case 2: Jagti with landmark ('Pani ki problem in Jagti near IIT Jammu')",
      text: "Pani ki problem in Jagti near IIT Jammu",
      expectStatus: "RESOLVED",
      expectedState: "Jammu & Kashmir",
      expectedAuthority: "Jal Shakti Department (PHED J&K)",
    },
    {
      name: "Test Case 3: Ambiguous electricity query ('Bijli nahi aa rahi Jagti')",
      text: "Bijli nahi aa rahi Jagti",
      expectStatus: "AMBIGUOUS_LOCATION",
      checkOptions: ["Jagti, Jammu", "Jagti, Punjab"],
    },
    {
      name: "Test Case 4: Disambiguated after user selection ('Jagti, Jammu')",
      text: "Bijli nahi aa rahi Jagti",
      selectedLocation: "Jagti, Jammu",
      expectStatus: "RESOLVED",
      expectedState: "Jammu & Kashmir",
      expectedAuthority: "Jammu Power Distribution Corporation Limited (JPDCL)",
    },
    {
      name: "Test Case 5: Disambiguated after user selection ('Jagti, Punjab')",
      text: "Bijli nahi aa rahi Jagti",
      selectedLocation: "Jagti, Punjab",
      expectStatus: "RESOLVED",
      expectedState: "Punjab",
      expectedAuthority: "Punjab State Power Corporation Limited (PSPCL)",
    },
    {
      name: "Test Case 6: Browser GPS available (lat 32.808, lon 74.895)",
      text: "Pani ki problem in Jagti",
      latitude: 32.808,
      longitude: 74.895,
      expectStatus: "RESOLVED",
      expectedState: "Jammu & Kashmir",
      expectedAuthority: "Jal Shakti Department (PHED J&K)",
    },
    {
      name: "Test Case 7: Phase 5 Mohali electricity issue",
      text: "Bijli nahi aa rahi Phase 5 Mohali",
      expectStatus: "RESOLVED",
      expectedState: "Punjab",
      expectedAuthority: "Punjab State Power Corporation Limited (PSPCL)",
    },
  ];

  let passed = 0;

  for (const tc of testCases) {
    console.log(`\n--- ${tc.name} ---`);
    console.log(`Input: "${tc.text}"${tc.selectedLocation ? ` | Selected: "${tc.selectedLocation}"` : ""}${tc.latitude ? ` | GPS: (${tc.latitude}, ${tc.longitude})` : ""}`);
    
    const result = await analyzeComplaint(tc.text, {
      selectedLocation: tc.selectedLocation,
      latitude: tc.latitude,
      longitude: tc.longitude,
    });
    
    console.log("Status:              ", result.status);
    console.log("Category:            ", result.category);
    console.log("Extracted Location:  ", result.extractedLocation);
    console.log("Detected State:      ", result.detectedState);
    console.log("Detected District:   ", result.detectedDistrict);
    console.log("Assigned Authority:  ", result.assignedAuthority);
    console.log("Reason for Routing:  ", result.reasonForRouting);
    console.log("Location Confidence: ", result.locationConfidence);
    console.log("Routing Confidence:  ", result.routingConfidence);

    if (tc.expectStatus === "AMBIGUOUS_LOCATION") {
      console.log("Options:             ", result.options);
      const isStatusOk = result.status === "AMBIGUOUS_LOCATION";
      const hasOptions = Array.isArray(result.options) && result.options.length >= 2;
      
      if (isStatusOk && hasOptions) {
        console.log("✅ PASSED (Ambiguity correctly detected, options provided)");
        passed++;
      } else {
        console.log("❌ FAILED ambiguity check");
      }
    } else {
      const isStatusOk = result.status === "RESOLVED";
      const stateMatches = result.detectedState === tc.expectedState;
      const authorityMatches = result.assignedAuthority === tc.expectedAuthority;
      
      if (isStatusOk && stateMatches && authorityMatches) {
        console.log("✅ PASSED");
        passed++;
      } else {
        console.log(`❌ FAILED. Expected Status: ${tc.expectStatus}, State: ${tc.expectedState}, Authority: ${tc.expectedAuthority}. Got: Status: ${result.status}, State: ${result.detectedState}, Authority: ${result.assignedAuthority}`);
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`RESULTS: ${passed}/${testCases.length} Tests Passed`);
  console.log(`==================================================`);

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
