const { execFileSync } = require("child_process");
const path = require("path");

function run(script) {
    console.log(`\n=== Jalanin ${script} ===\n`);
    execFileSync(process.execPath, ["--env-file=.env", path.join(__dirname, script)], {
        stdio: "inherit",
    });
}

run("scrapping.js");
run("apply.js");
