const required=["DATABASE_URL","APP_BASE_URL","SESSION_SECRET","ENCRYPTION_KEY_ID","ENCRYPTION_MASTER_KEY"];
const missing=required.filter(name=>!process.env[name]),production=process.env.APP_ENV==="production";
const phase2=["GOV_001_APPROVED","ACCESS_001_APPROVED","DEPLOY_001_APPROVED","AUTH_001_APPROVED"];
const phase3=["CASE_001_APPROVED","EVIDENCE_001_APPROVED","SHARE_001_APPROVED","MAIL_001_APPROVED","PDF_001_APPROVED","SAFEGUARD_001_APPROVED","RETENTION_001_APPROVED","PENTEST_001_APPROVED"];
const absentApprovals=production?[...phase2,...phase3].filter(name=>process.env[name]!=="true"):[];
const unsafeEvidence=process.env.EVIDENCE_STORAGE_ENABLED==="true"&&(process.env.EVIDENCE_001_APPROVED!=="true"||!process.env.OBJECT_STORAGE_ENDPOINT||!process.env.OBJECT_STORAGE_BUCKET||!process.env.MALWARE_SCANNER_ENDPOINT);
const unsafeMail=process.env.MAIL_SENDING_ENABLED==="true"&&(process.env.MAIL_001_APPROVED!=="true"||!process.env.MAIL_PROVIDER);
const reasons=[missing.length&&"missing configuration",absentApprovals.length&&"missing approvals",production&&!process.env.APP_BASE_URL?.startsWith("https://")&&"production HTTPS required",production&&process.env.AUTH_TEST_MODE==="true"&&"test auth forbidden",unsafeEvidence&&"evidence gate/provider incomplete",unsafeMail&&"mail gate/provider incomplete"].filter(Boolean);
const gates=Object.fromEntries([...phase2,...phase3].map(name=>[name.replaceAll("_","-").replace("-APPROVED",""),process.env[name]==="true"?"approved":"open"]));
if(reasons.length){console.error(JSON.stringify({release:"blocked",missing,absentApprovals,gates,reasons}));process.exit(1)}
console.log(JSON.stringify({release:"configuration-valid",environment:process.env.APP_ENV??"development",gates,evidenceStorageEnabled:process.env.EVIDENCE_STORAGE_ENABLED==="true",mailSendingEnabled:process.env.MAIL_SENDING_ENABLED==="true"}));
