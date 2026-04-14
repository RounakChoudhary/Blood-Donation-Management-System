const suites = [
  { name: "validation", run: require("./validation.test").run },
  { name: "bloodCompat", run: require("./bloodCompat.test").run },
];

let failures = 0;

for (const suite of suites) {
  try {
    suite.run();
    console.log(`PASS ${suite.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${suite.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log("All tests passed.");
}
