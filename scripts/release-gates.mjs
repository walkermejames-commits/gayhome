const required=["DATABASE_URL","APP_BASE_URL","SESSION_SECRET","ENCRYPTION_KEY_ID","ENCRYPTION_MASTER_KEY"];
const missing=required.filter(name=>!process.env[name]);
const production=process.env.APP_ENV==="production";
const approvals=["GOV_001_APPROVED","ACCESS_001_APPROVED","DEPLOY_001_APPROVED","AUTH_001_APPROVED"];
const absentApprovals=production?approvals.filter(name=>process.env[name]!=="true"):[];
if(missing.length||absentApprovals.length||production&&!process.env.APP_BASE_URL?.startsWith("https://")||production&&process.env.AUTH_TEST_MODE==="true"){console.error(JSON.stringify({release:"blocked",missing,absentApprovals,reason:"Required configuration or authorised approvals are absent."}));process.exit(1)}
console.log(JSON.stringify({release:"configuration-valid",environment:process.env.APP_ENV??"development"}));
