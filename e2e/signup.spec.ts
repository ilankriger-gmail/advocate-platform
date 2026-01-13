import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  approveLeadDirectly,
  cleanupTestData,
  checkLeadExists,
  getLeadStatus,
} from './fixtures/test-utils';

/**
 * Teste E2E do fluxo completo de inscrição
 *
 * Fluxo: Landing Page NPS → Formulário NPS → Aprovação → Registro → Conta Criada
 */
test.describe('Fluxo de Inscrição NPS', () => {
  // Email único para este teste
  let testEmail: string;

  test.beforeAll(async () => {
    testEmail = generateTestEmail();
    console.log(`Email de teste: ${testEmail}`);
  });

  test.afterAll(async () => {
    // Limpar dados de teste
    try {
      await cleanupTestData(testEmail);
    } catch (error) {
      console.warn('Erro na limpeza:', error);
    }
  });

  test('completa inscrição via NPS e registro', async ({ page }) => {
    // Configurar timeout mais longo para este teste
    test.setTimeout(120000);

    // ==========================================
    // PARTE 1: Formulário NPS em /seja-arena
    // ==========================================

    // 1. Acessa a landing page NPS
    await page.goto('/seja-arena');
    await expect(page).toHaveURL(/seja-arena/);

    // Aguardar formulário carregar
    await page.waitForSelector('text=De 0 a 10', { timeout: 10000 });

    // 2. Step 1: Seleciona nota NPS (nota 10)
    // Os botões de score são números de 0-10
    const scoreButton = page.locator('button').filter({ hasText: '10' }).first();
    await scoreButton.click();

    // O formulário auto-avança para step 2 após selecionar score
    await page.waitForTimeout(500);

    // 3. Step 2: Preenche o motivo
    await expect(page.locator('text=Por que você deu a nota')).toBeVisible();

    // Encontrar o textarea ativo (que está focado ou visível no step atual)
    const reasonTextarea = page.locator('textarea[id="reason"]');
    await reasonTextarea.fill('Teste automatizado E2E - excelente experiência com a plataforma');

    // Usar Enter para avançar (mais confiável que clicar em botão)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // 4. Step 3: Preenche o nome
    await expect(page.locator('text=Qual seu nome')).toBeVisible();

    const nameInput = page.locator('input[id="name"]');
    await nameInput.fill('Usuário Teste E2E');

    // Usar Enter para avançar
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // 5. Step 4: Preenche o email
    await expect(page.locator('text=Qual seu email')).toBeVisible();

    const emailInput = page.locator('input[id="email"]');
    await emailInput.fill(testEmail);

    // Usar Enter para avançar
    await page.keyboard.press('Enter');

    // Aguardar verificação de email (async check)
    await page.waitForTimeout(2000);

    // 6. Step 5: WhatsApp (opcional) - preencher ou pular
    await expect(page.locator('text=Qual seu WhatsApp')).toBeVisible();

    // 7. Aceitar termos LGPD
    // Localizar o checkbox de LGPD diretamente (não pelo label que tem links)
    const lgpdCheckbox = page.locator('input[type="checkbox"]').first();
    await lgpdCheckbox.check({ force: true });
    await page.waitForTimeout(300);

    // 8. Interceptar navegação externa (o form redireciona para outro domínio)
    // Vamos capturar a requisição antes do redirect
    const [response] = await Promise.all([
      // Aguardar a requisição de submit
      page.waitForResponse(
        (resp) =>
          resp.url().includes('supabase') ||
          resp.request().method() === 'POST',
        { timeout: 15000 }
      ).catch(() => null),
      // Usar Enter para enviar (ou clicar no botão Enviar)
      page.keyboard.press('Enter'),
    ]);

    // Aguardar um pouco para garantir que o lead foi criado
    await page.waitForTimeout(2000);

    // 9. Verificar que o lead foi criado no banco
    const leadExists = await checkLeadExists(testEmail);
    expect(leadExists).toBe(true);

    // Verificar status do lead (deve ser 'pending')
    const leadStatus = await getLeadStatus(testEmail);
    expect(leadStatus).toBe('pending');

    console.log('Lead criado com sucesso!');

    // ==========================================
    // PARTE 2: Aprovação do Lead (simulada)
    // ==========================================

    // 10. Aprovar o lead diretamente no banco (simula ação de admin)
    await approveLeadDirectly(testEmail);

    // Verificar que foi aprovado
    const approvedStatus = await getLeadStatus(testEmail);
    expect(approvedStatus).toBe('approved');

    console.log('Lead aprovado!');

    // ==========================================
    // PARTE 3: Registro com email aprovado
    // ==========================================

    // 11. Ir para página de registro com email pre-preenchido
    await page.goto(`/registro?email=${encodeURIComponent(testEmail)}`);
    await expect(page).toHaveURL(/registro/);

    // Aguardar formulário carregar
    await page.waitForSelector('form', { timeout: 10000 });

    // 12. Verificar que o email está pre-preenchido
    const registroEmailInput = page.locator('input[name="email"], input[id="email"]');
    await expect(registroEmailInput).toHaveValue(testEmail);

    // 13. Preencher nome
    const registroNameInput = page.locator('input[name="name"], input[id="name"]');
    await registroNameInput.fill('Usuário Teste E2E');

    // 14. Preencher senha
    const passwordInput = page.locator('input[name="password"], input[id="password"]');
    await passwordInput.fill('TesteSenha123!');

    // 15. Confirmar senha
    const confirmPasswordInput = page.locator(
      'input[name="confirmPassword"], input[id="confirmPassword"]'
    );
    await confirmPasswordInput.fill('TesteSenha123!');

    // 16. Confirmar idade (13+)
    const ageCheckbox = page.locator('input[name="ageConfirmed"], input[id="ageConfirmed"]');
    await ageCheckbox.check();

    // 17. Submeter formulário
    await page.locator('button[type="submit"]').click();

    // 18. Aguardar resultado
    await page.waitForTimeout(3000);

    // 19. Verificar sucesso - deve mostrar mensagem de confirmação ou sucesso
    // O RegisterForm mostra "Conta criada com sucesso!" ou "confirme seu email"
    const successMessage = page.locator('text=/sucesso|criada|confirme.*email/i');
    await expect(successMessage).toBeVisible({ timeout: 15000 });

    console.log('Registro concluído com sucesso!');
  });
});

/**
 * Teste isolado do formulário NPS (sem registro)
 */
test.describe('Formulário NPS Isolado', () => {
  let testEmail: string;

  test.beforeEach(async () => {
    testEmail = generateTestEmail();
  });

  test.afterEach(async () => {
    try {
      await cleanupTestData(testEmail);
    } catch {
      // Ignora erros de limpeza
    }
  });

  test('carrega página inicial do NPS', async ({ page }) => {
    await page.goto('/seja-arena');

    // Deve mostrar a pergunta inicial do NPS
    await expect(page.locator('text=De 0 a 10')).toBeVisible();

    // Deve mostrar os botões de 0 a 10
    await expect(page.locator('button').filter({ hasText: '0' }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '10' }).first()).toBeVisible();
  });

  test('selecionar nota avança para próximo step', async ({ page }) => {
    await page.goto('/seja-arena');

    // Selecionar nota 8
    await page.locator('button').filter({ hasText: '8' }).first().click();
    await page.waitForTimeout(800);

    // Deve estar no step 2 (pergunta sobre o motivo)
    await expect(page.locator('text=Por que você deu a nota')).toBeVisible();
  });

  test('navegação entre steps funciona', async ({ page }) => {
    await page.goto('/seja-arena');

    // Selecionar nota
    await page.locator('button').filter({ hasText: '8' }).first().click();
    await page.waitForTimeout(800);

    // Deve estar no step 2
    await expect(page.locator('text=Por que você deu a nota')).toBeVisible();

    // Clicar no primeiro botão Voltar visível
    await page.locator('button:has-text("Voltar")').first().click();
    await page.waitForTimeout(300);

    // Deve voltar para step 1
    await expect(page.locator('text=De 0 a 10')).toBeVisible();
  });
});

/**
 * Teste isolado do formulário de registro
 */
test.describe('Formulário de Registro Isolado', () => {
  test('exibe campos do formulário', async ({ page }) => {
    await page.goto('/registro');

    // Verificar campos existem
    await expect(page.locator('input[name="name"], input[id="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"], input[id="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[id="password"]')).toBeVisible();
    await expect(
      page.locator('input[name="confirmPassword"], input[id="confirmPassword"]')
    ).toBeVisible();
  });

  test('pre-preenche email da query string', async ({ page }) => {
    const email = 'teste@exemplo.com';
    await page.goto(`/registro?email=${encodeURIComponent(email)}`);

    const emailInput = page.locator('input[name="email"], input[id="email"]');
    await expect(emailInput).toHaveValue(email);
  });

  test('botão Google OAuth está presente', async ({ page }) => {
    await page.goto('/registro');

    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });
});
