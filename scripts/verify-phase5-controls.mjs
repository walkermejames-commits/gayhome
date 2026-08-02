import fs from "node:fs/promises";

const migration=await fs.readFile("migrations/0005_phase5_pilot_operations.sql","utf8");
const down=await fs.readFile("migrations/down/0005_phase5_pilot_operations.down.sql","utf8");
const matrix=JSON.parse(await fs.readFile("docs/phase-5/PILOT_FEATURE_FLAG_MATRIX.json","utf8"));
const register=JSON.parse(await fs.readFile("docs/phase-5/RELEASE_GATE_REGISTER.json","utf8"));
const requiredFlags=["pilot.registration","pilot.accounts","pilot.profiles","pilot.cases","pilot.evidence","pilot.advocates","pilot.professionals","pilot.external_email","pilot.direct_council_submission","pilot.ai_case_summaries","pilot.notifications","pilot.feedback","pilot.analytics","pilot.partner_portal","pilot.provider_correction_portal","production.public_access"];
const requiredGates=["PHASE5-PILOT-001","PHASE5-SUPPORT-001","PHASE5-INCIDENT-001","PHASE5-ANALYTICS-001","PHASE5-PARTNER-001","PHASE5-LAUNCH-001","PHASE5-INTEGRATION-001"];
const failures=[];
for(const flag of requiredFlags){if(!migration.includes(`('${flag}'`))failures.push(`Migration does not seed ${flag}.`);const configured=matrix.flags?.find(item=>item.key===flag);if(!configured)failures.push(`Flag matrix does not contain ${flag}.`);else if(configured.default!==false)failures.push(`${flag} does not default to false.`);}
for(const gate of requiredGates){if(!migration.includes(`('${gate}'`))failures.push(`Migration does not seed ${gate}.`);const configured=register.gates?.find(item=>item.id===gate);if(!configured)failures.push(`Gate register does not contain ${gate}.`);else if(String(configured.status).toLowerCase()==="closed")failures.push(`${gate} was improperly closed automatically.`);}
if(!migration.includes("CHECK (default_state = false)"))failures.push("Database does not constrain flag defaults to false.");
if(!migration.includes("channel = 'in_app' OR enabled = false"))failures.push("External notification channels are not constrained off.");
if(!down.includes("Cannot roll back Phase 5 while a pilot is active or paused")||!down.includes("Cannot roll back Phase 5 while a release record is live"))failures.push("Down migration lacks the active-pilot/release fail-safe.");
if(failures.length){console.error(JSON.stringify({phase5Controls:"failed",failures},null,2));process.exit(1);}
console.log(JSON.stringify({phase5Controls:"verified",flags:requiredFlags.length,gates:requiredGates.length,allDefaultsDisabled:true,humanGatesRemainOpen:true,productionActivation:false},null,2));
