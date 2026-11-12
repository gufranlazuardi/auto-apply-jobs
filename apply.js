const fs = require("fs");
const path = require("path");
const { sendApplication } = require("./mailer");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RESUME_PATH = path.join(__dirname, "resume", "gufran-lazuardi-resume-ats-revamp.pdf");
const LOG_PATH = path.join(__dirname, "applied.json");
const YOUR_NAME = "Gufran Lazuardi";

function loadAppliedLog() {
    if (!fs.existsSync(LOG_PATH)) return [];
    return JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
}

function saveAppliedLog(log) {
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

function buildEmail(job) {
    const subject = `Application for ${job.title ? job.title : "Software Engineer"} at ${job.company ? job.company : "Your company"}`;
    const text =
        `Hi ${job.company ? job.company : "Your company"}'s Hiring Team,\n\n` +
        `I'm writing to express my interest in the ${job.title ? job.title : "Software Engineer"} role at ${job.company ? job.company : "Your company"}, which I came across on LinkedIn (${job.url ? job.url : ""}).\n\n` +
        // `${rolePitch}\n\n` +
        `A few highlights from my background:\n` +
        `• Built full-stack platforms from scratch—handling API architecture, database optimization, and cloud deployment.\n` +
        `• Previously worked in Fullstack Developer at CKL Cargo, giving me strong cross-functional product sense alongside engineering execution.\n\n` +
        `I've attached my resume for your review and would welcome the chance to discuss how I can contribute to ${job.company ? job.company : "Your company"}'s engineering team.\n\n` +
        `Best regards,\n` +
        `${YOUR_NAME ? YOUR_NAME : "Gufran Lazuardi"}\n`;

    return { subject, text };
}

async function main() {
    if (!fs.existsSync("jobs.json")) {
        console.log("jobs.json nggak ketemu, jalanin scrapping.js dulu");
        return;
    }
    if (!fs.existsSync(RESUME_PATH)) {
        console.log(`Resume nggak ketemu di ${RESUME_PATH}`);
        return;
    }

    const jobs = JSON.parse(fs.readFileSync("jobs.json", "utf-8"));
    const applied = loadAppliedLog();
    const appliedEmails = new Set(applied.map((a) => a.email));

    for (const job of jobs) {
        for (const email of job.emails || []) {
            if (appliedEmails.has(email)) {
                console.log(`- ${email} udah pernah di-apply, skip`);
                continue;
            }

            const { subject, text } = buildEmail(job);
            try {
                await sendApplication({ to: email, subject, text, resumePath: RESUME_PATH });
                console.log(`✓ Terkirim ke ${email} (${job.title} @ ${job.company})`);
                applied.push({ email, title: job.title, company: job.company, sentAt: new Date().toISOString() });
                appliedEmails.add(email);
                saveAppliedLog(applied);
            } catch (e) {
                console.log(`✗ Gagal kirim ke ${email}: ${e.message}`);
            }

            await sleep(5000 + Math.random() * 5000);
        }
    }

    console.log("Selesai apply.");
}

main();
