const urls = [
  "https://dating-app-sandy-delta.vercel.app/staff",
  "https://dating-e5rtjzqpp-amplify-rec.vercel.app/staff",
  "https://dating-b2dee2m2o-amplify-rec.vercel.app/staff",
];

async function checkStaff(url) {
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  const chunkPaths = [
    ...html.matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g),
  ].map((m) => m[0]);

  let foundAppointment = false;
  let foundPlainEdit = false;

  for (const path of chunkPaths) {
    const chunkUrl = new URL(path, url).href;
    const chunkRes = await fetch(chunkUrl);
    const js = await chunkRes.text();
    if (js.includes("Edit Appointment")) foundAppointment = true;
    if (js.includes("Edit") && !js.includes("Edit Appointment")) {
      foundPlainEdit = true;
    }
  }

  return {
    url,
    status: res.status,
    chunks: chunkPaths.length,
    editAppointment: foundAppointment,
    hasEditWithoutAppointment: foundPlainEdit,
  };
}

(async () => {
  for (const url of urls) {
    try {
      const result = await checkStaff(url);
      console.log(JSON.stringify(result));
    } catch (err) {
      console.log(JSON.stringify({ url, error: String(err) }));
    }
  }
})();
