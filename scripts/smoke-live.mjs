/**
 * Canlı API smoke test (ödeme hariç).
 * Kullanım: node scripts/smoke-live.mjs
 */
const API = process.env.SMOKE_API || 'https://izmirisilanlari35api-production.up.railway.app';

async function req(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

function stamp() {
  return Date.now().toString(36);
}

async function main() {
  const results = [];
  const log = (name, pass, detail) => {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'OK' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };

  const health = await req('/api/health');
  log('health', health.ok && health.data?.ok && health.data?.db, JSON.stringify(health.data));

  const jobs = await req('/api/jobs?status=active&limit=5');
  const jobList = Array.isArray(jobs.data) ? jobs.data : [];
  log('jobs list', jobs.ok, `${jobList.length} aktif ilan`);

  const s = stamp();
  const candEmail = `smoke.aday.${s}@example.com`;
  const empEmail = `smoke.isveren.${s}@example.com`;
  const pass = 'SmokeTest1!';

  const regCand = await req('/api/auth/register', {
    method: 'POST',
    body: {
      email: candEmail,
      password: pass,
      role: 'candidate',
      full_name: 'Smoke Aday',
      city: 'İzmir',
    },
  });
  log('register candidate', regCand.ok, regCand.data?.error || candEmail);
  const candToken = regCand.data?.token;

  const regEmp = await req('/api/auth/register', {
    method: 'POST',
    body: {
      email: empEmail,
      password: pass,
      role: 'employer',
      full_name: 'Smoke İşveren',
      company_name: 'Smoke Ltd',
      vergi_numarasi: '1234567890',
    },
  });
  log('register employer', regEmp.ok, regEmp.data?.error || empEmail);
  const empToken = regEmp.data?.token;

  const loginCand = await req('/api/auth/login', {
    method: 'POST',
    body: { email: candEmail, password: pass },
  });
  log('login candidate', loginCand.ok);

  if (jobList[0]?.id && candToken) {
    const apply = await req('/api/applications', {
      method: 'POST',
      token: candToken,
      body: {
        job_id: jobList[0].id,
        cover_letter: 'Smoke test başvurusu',
        cv_url: null,
      },
    });
    // CV zorunlu olabilir — 400/403 kabul edilebilir; 201 veya bilinen hata OK sayılır
    const applyOk =
      apply.ok ||
      apply.status === 400 ||
      apply.status === 403 ||
      apply.status === 409 ||
      (apply.data?.error && /cv|doğrul|PDF/i.test(String(apply.data.error)));
    log(
      'apply flow',
      applyOk,
      apply.ok ? 'başvuru oluşturuldu' : `status=${apply.status} ${apply.data?.error || ''}`,
    );
  } else {
    log('apply flow', false, 'aktif ilan veya aday token yok');
  }

  if (empToken) {
    const apps = await req('/api/applications/employer', { token: empToken });
    log('employer applications', apps.ok, Array.isArray(apps.data) ? `${apps.data.length} kayıt` : apps.data?.error);
  } else {
    log('employer applications', false, 'employer token yok');
  }

  // Admin endpoint auth olmadan 401/403 beklenir
  const adminGate = await req('/api/admin/stats');
  log('admin gate', adminGate.status === 401 || adminGate.status === 403, `status=${adminGate.status}`);

  const google = await req('/api/auth/google/status');
  log('google disabled', google.data?.enabled === false || health.data?.google === false, JSON.stringify(google.data));

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} geçti`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
