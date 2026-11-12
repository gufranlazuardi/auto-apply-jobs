const jobList = [
    "frontend developer",
    "fullstack developer",
    "software engineer"
]

const locationList = ["Indonesia", "Malaysia"]


const cheerio = require("cheerio");
const fs = require("fs");

const JOBS_PATH = "jobs.json";

function loadSavedJobs() {
    if (!fs.existsSync(JOBS_PATH)) return [];
    return JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8"));
}

function saveJobs(jobs) {
    fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => 15000 + Math.random() * 15000; // 15-30 detik

async function fetchWithRetry(fetchFn, maxRetries = 5) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fetchFn();
        } catch (e) {
            if (e.message.includes("429") || e.message.includes("Rate limited")) {
                const wait = 10000 * (attempt + 1) + Math.random() * 10000;
                console.log(`Rate limited, wait ${Math.round(wait / 1000)}s before retry (${attempt + 1}/${maxRetries})...`);
                await sleep(wait);
                continue;
            }
            throw e;
        }
    }
    throw new Error("Masih rate limited setelah beberapa retry, berhenti");
}

const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
};

async function fetchJobList(keywords, location, start = 0) {
    const url =
        "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search" +
        `?keywords=${encodeURIComponent(keywords)}` +
        `&location=${encodeURIComponent(location)}` +
        `&start=${start}`;

    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429) throw new Error("Rate limited, berhenti dulu");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const jobs = [];
    $("li").each((_, el) => {
        const link = $(el).find("a.base-card__full-link").attr("href");
        if (!link) return;
        jobs.push({
            id: link.match(/-(\d+)\?/)?.[1] || null,
            title: $(el).find(".base-search-card__title").text().trim(),
            company: $(el).find(".base-search-card__subtitle").text().trim(),
            location: $(el).find(".job-search-card__location").text().trim(),
            posted: $(el).find("time").attr("datetime"),
            url: link.split("?")[0],
        });
    });
    return jobs;
}

async function fetchJobDetail(jobId) {
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429) throw new Error("Rate limited, berhenti dulu");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const $ = cheerio.load(await res.text());
    const description = $(".show-more-less-html__markup").text().trim();
    const emails = description.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [];
    return { description, emails: [...new Set(emails)] };
}

async function main() {
    const allJobs = [];

    for (const keyword of jobList) {
        for (const location of locationList) {
            for (let start = 0; start < 30; start += 10) {
                const jobs = await fetchWithRetry(() => fetchJobList(keyword, location, start));
                if (jobs.length === 0) break;
                allJobs.push(...jobs);
                await sleep(randomDelay());
            }
        }
    }

    console.log(`Dapat ${allJobs.length} job`);

    const withEmail = loadSavedJobs();
    const seenIds = new Set(withEmail.map((j) => j.id));

    for (const job of allJobs) {
        if (!job.id || seenIds.has(job.id)) continue;
        try {
            const detail = await fetchWithRetry(() => fetchJobDetail(job.id));
            if (detail.emails.length > 0) {
                withEmail.push({ ...job, ...detail });
                seenIds.add(job.id);
                saveJobs(withEmail);
                console.log(`✓ ${job.title} @ ${job.company} -> ${detail.emails}`);
            }
        } catch (e) {
            console.log(`✗ ${job.id}: ${e.message}`);
        }
        await sleep(randomDelay());
    }

    console.log(`Tersimpan ${withEmail.length} job yang ada emailnya`);
}

main();