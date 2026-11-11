import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
try {
  const page = await browser.newPage();
  await page.goto(new URL('/dev-preview/', process.env.APP_URL || 'http://127.0.0.1:5173').href);
  for (const [button,field] of [['일정 작성','title'],['투두 작성','content']]) {
    await page.getByRole('button',{name:button}).click();
    const input = page.locator('input[name="'+field+'"]');
    await input.fill('예시');
    await page.getByRole('button',{name:'저장',exact:true}).click();
    await page.waitForFunction(name => document.activeElement?.getAttribute('name') === name && document.activeElement?.getAttribute('aria-invalid') === 'true',field);
    assert.equal(await input.inputValue(),'예시');
    assert.equal(await input.evaluate(el => document.getElementById(el.getAttribute('aria-describedby')).textContent),'다른 내용으로 입력해 주세요.');
    await input.fill('새 예시');
    await page.getByRole('button',{name:'저장',exact:true}).click();
    await page.getByText('다시 저장하기에 성공했어요.',{exact:false}).waitFor();
  }
  console.log('PASS: event and todo field errors, focus, input retention and retry');
} finally { await browser.close(); }
