# Migracao do Banco de Dados - Supabase para PostgreSQL

## PASSO 1: Criar o banco

```sql
CREATE DATABASE roleplay_vendas;
```

Conecte ao banco:

```sql
\c roleplay_vendas
```

## PASSO 2: Extensoes

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## PASSO 3: Enums (8)

```sql
CREATE TYPE "UserRole" AS ENUM ('admin', 'coach', 'vendedor', 'closer');

CREATE TYPE "ClientProfileType" AS ENUM ('soft', 'hard', 'chato', 'ultra_hard');

CREATE TYPE "RoleplayStatus" AS ENUM ('active', 'finished', 'aborted', 'paused', 'evaluated');

CREATE TYPE "MessageSender" AS ENUM ('user', 'ai');

CREATE TYPE "RadarStatus" AS ENUM ('green', 'yellow', 'red', 'bomb');

CREATE TYPE "VoucherStatus" AS ENUM ('issued', 'redeemed', 'expired', 'canceled');

CREATE TYPE "FaturamentoRange" AS ENUM (
  'nenhum', 'sem_faturamento', 'ate_100_mil',
  '100_mil_a_500_mil', '1_a_5_milhoes', '5_a_10_milhoes',
  '10_a_50_milhoes', '50_a_100_milhoes', 'acima_100_milhoes'
);

CREATE TYPE "TeamSizeRange" AS ENUM (
  'nenhum', 'ate_5', '6_a_10', '11_a_20',
  '21_a_50', '51_a_100', '101_a_300', 'acima_300'
);
```

## PASSO 4: Tabelas (24)

```sql
-- 1. USERS (substitui auth.users do Supabase)
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  email_confirmed     BOOLEAN NOT NULL DEFAULT false,
  raw_user_meta_data  JSONB NOT NULL DEFAULT '{}',
  reset_token         TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. REFRESH_TOKENS
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- 3. ORGANIZATIONS
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PROFILES
CREATE TABLE profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_id      UUID REFERENCES organizations(id),
  name                 TEXT NOT NULL,
  email                TEXT NOT NULL,
  team                 TEXT,
  phone                TEXT,
  hire_date            TEXT,
  specialties          TEXT[] NOT NULL DEFAULT '{}',
  notes                TEXT,
  status               TEXT DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT false,
  visited_pages        JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);

-- 5. USER_ROLES
CREATE TABLE user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role       "UserRole" NOT NULL DEFAULT 'vendedor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. LEADS_PLATAFORMA
CREATE TABLE leads_plataforma (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  email        TEXT NOT NULL,
  cargo        TEXT NOT NULL DEFAULT '',
  telefone     TEXT,
  site_empresa TEXT,
  faturamento  "FaturamentoRange" NOT NULL DEFAULT 'nenhum',
  tamanho_time "TeamSizeRange" NOT NULL DEFAULT 'nenhum',
  user_created BOOLEAN NOT NULL DEFAULT false,
  user_id      UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SEGMENTS
CREATE TABLE segments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT,
  prompt_context TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. CLIENT_PROFILES
CREATE TABLE client_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            "ClientProfileType" NOT NULL,
  display_name    TEXT NOT NULL,
  objection_style TEXT NOT NULL,
  tone_params     JSONB NOT NULL DEFAULT '{}',
  whatsapp_style  BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ROLEPLAYS
CREATE TABLE roleplays (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(user_id),
  organization_id UUID REFERENCES organizations(id),
  segment_id      UUID NOT NULL REFERENCES segments(id),
  profile_id      UUID NOT NULL REFERENCES client_profiles(id),
  status          "RoleplayStatus" NOT NULL DEFAULT 'active',
  message_count   INTEGER NOT NULL DEFAULT 0,
  message_limit   INTEGER NOT NULL DEFAULT 50,
  guided_mode     BOOLEAN DEFAULT false,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_roleplays_user_id ON roleplays(user_id);
CREATE INDEX idx_roleplays_organization_id ON roleplays(organization_id);
CREATE INDEX idx_roleplays_status ON roleplays(status);
CREATE INDEX idx_roleplays_created_at ON roleplays(created_at);

-- 10. MESSAGES
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roleplay_id UUID NOT NULL REFERENCES roleplays(id) ON DELETE CASCADE,
  sender      "MessageSender" NOT NULL,
  content     TEXT NOT NULL,
  turn_number INTEGER NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_roleplay_id ON messages(roleplay_id);
CREATE INDEX idx_messages_turn_number ON messages(turn_number);

-- 11. REPORTS
CREATE TABLE reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roleplay_id           UUID NOT NULL UNIQUE REFERENCES roleplays(id),
  organization_id       UUID REFERENCES organizations(id),
  score_overall         DOUBLE PRECISION NOT NULL,
  close_probability     DOUBLE PRECISION NOT NULL,
  scores                JSONB NOT NULL DEFAULT '{}',
  radar                 "RadarStatus" NOT NULL,
  html_report           TEXT NOT NULL,
  feedback_geral        TEXT,
  pontos_fortes         JSONB,
  areas_melhoria        JSONB,
  proximos_passos       JSONB,
  feedback_competencias JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_roleplay_id ON reports(roleplay_id);
CREATE INDEX idx_reports_organization_id ON reports(organization_id);

-- 12. VOUCHERS
CREATE TABLE vouchers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(user_id),
  roleplay_id UUID NOT NULL REFERENCES roleplays(id),
  code        TEXT NOT NULL UNIQUE,
  status      "VoucherStatus" NOT NULL DEFAULT 'issued',
  metadata    JSONB NOT NULL DEFAULT '{}',
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);

-- 13. PROMPT_TEMPLATES
CREATE TABLE prompt_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  type            TEXT NOT NULL,
  template        TEXT NOT NULL,
  variables       JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. NINJA_RANKS
CREATE TABLE ninja_ranks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level              INTEGER NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  emoji              TEXT NOT NULL,
  color              TEXT NOT NULL,
  description        TEXT,
  xp_to_next_level   INTEGER,
  required_roleplays INTEGER,
  required_avg_score DOUBLE PRECISION,
  required_streak    INTEGER,
  required_vouchers  INTEGER,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- 15. USER_NINJA_PROGRESS
CREATE TABLE user_ninja_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE,
  current_level   INTEGER DEFAULT 1,
  current_xp      INTEGER DEFAULT 0,
  total_xp        INTEGER DEFAULT 0,
  total_roleplays INTEGER DEFAULT 0,
  avg_score       DOUBLE PRECISION DEFAULT 0,
  best_streak     INTEGER DEFAULT 0,
  total_vouchers  INTEGER DEFAULT 0,
  level_up_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 16. USER_STREAKS
CREATE TABLE user_streaks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL UNIQUE,
  current_streak     INTEGER NOT NULL DEFAULT 0,
  longest_streak     INTEGER NOT NULL DEFAULT 0,
  last_activity_date TEXT,
  streak_updated_at  TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- 17. USER_GOALS
CREATE TABLE user_goals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL,
  organization_id    UUID REFERENCES organizations(id),
  roleplays_per_week INTEGER,
  min_score          DOUBLE PRECISION,
  vouchers_per_month INTEGER,
  set_by             UUID,
  notes              TEXT,
  is_active          BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_organization_id ON user_goals(organization_id);

-- 18. PRIZES
CREATE TABLE prizes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID REFERENCES organizations(id),
  name               TEXT NOT NULL,
  description        TEXT,
  image_url          TEXT,
  vouchers_required  INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER,
  category           TEXT,
  is_active          BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_prizes_organization_id ON prizes(organization_id);
CREATE INDEX idx_prizes_is_active ON prizes(is_active);

-- 19. PRIZE_REDEMPTIONS
CREATE TABLE prize_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  prize_id        UUID NOT NULL REFERENCES prizes(id),
  organization_id UUID REFERENCES organizations(id),
  voucher_ids     UUID[] NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 20. EXPORTED_REPORTS
CREATE TABLE exported_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  report_type     TEXT NOT NULL,
  title           TEXT NOT NULL,
  date_from       TEXT NOT NULL,
  date_to         TEXT NOT NULL,
  report_data     JSONB NOT NULL DEFAULT '{}',
  filters         JSONB,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. PERFORMANCE_SNAPSHOTS
CREATE TABLE performance_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  snapshot_date   TEXT NOT NULL,
  roleplays_count INTEGER NOT NULL DEFAULT 0,
  average_score   DOUBLE PRECISION,
  best_score      DOUBLE PRECISION,
  vouchers_earned INTEGER,
  rapport_avg     DOUBLE PRECISION,
  escuta_avg      DOUBLE PRECISION,
  clareza_avg     DOUBLE PRECISION,
  persuasao_avg   DOUBLE PRECISION,
  objecoes_avg    DOUBLE PRECISION,
  fechamento_avg  DOUBLE PRECISION,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_snapshots_user_date ON performance_snapshots(user_id, snapshot_date);
CREATE INDEX idx_snapshots_org_date ON performance_snapshots(organization_id, snapshot_date);

-- 22. AUDIT_LOG
CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action     TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id    UUID,
  timestamp  TIMESTAMPTZ DEFAULT now()
);

-- 23. SYSTEM_CONFIG
CREATE TABLE system_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24. SYSTEM_SETTINGS
CREATE TABLE system_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## PASSO 5: Dados iniciais (Seed)

```sql
-- System Settings
INSERT INTO system_settings (registration_enabled) VALUES (true);

-- Ninja Ranks (12 niveis)
INSERT INTO ninja_ranks (level, name, emoji, color, required_roleplays, required_avg_score, required_streak, required_vouchers, xp_to_next_level, description) VALUES
(1,  'Aspirante',       '🔰', '#9CA3AF', 0,   0,  0,  0,  100,  'Voce deu o primeiro passo na jornada ninja.'),
(2,  'Aprendiz',        '📜', '#6B7280', 3,   50, 0,  0,  250,  'Comecou a dominar as tecnicas basicas.'),
(3,  'Genin',           '⚔️', '#22C55E', 10,  55, 3,  0,  500,  'Ninja iniciante com habilidades promissoras.'),
(4,  'Genin Avancado',  '🗡️', '#16A34A', 20,  60, 5,  1,  750,  'Suas tecnicas estao mais afiadas.'),
(5,  'Chunin',          '🛡️', '#3B82F6', 35,  65, 7,  2,  1000, 'Lider de equipe com experiencia.'),
(6,  'Chunin Elite',    '⚡',  '#2563EB', 50,  70, 10, 3,  1500, 'Elite entre os Chunins.'),
(7,  'Jounin',          '🔥', '#F97316', 75,  75, 14, 5,  2000, 'Mestre em tecnicas avancadas.'),
(8,  'Jounin Especial', '💎', '#EA580C', 100, 78, 18, 7,  2500, 'Especialista reconhecido.'),
(9,  'ANBU',            '🦅', '#8B5CF6', 150, 80, 21, 10, 3500, 'Forca especial de elite.'),
(10, 'Capitao ANBU',    '👑', '#7C3AED', 200, 82, 25, 15, 5000, 'Lider das forcas especiais.'),
(11, 'Mestre Ninja',    '🏆', '#EAB308', 300, 85, 30, 20, 7500, 'Maestria suprema em vendas.'),
(12, 'Lenda Ninja',     '⭐', '#FBBF24', 500, 90, 45, 30, NULL, 'Lenda viva. Sua fama transcende geracoes.');

-- Segmentos exemplo
INSERT INTO segments (name, description, prompt_context) VALUES
('E-commerce',      'Lojas virtuais e marketplaces',        'Voce gerencia uma loja online com faturamento entre R$100k-500k/mes. Busca aumentar conversao e reduzir CAC.'),
('SaaS B2B',        'Empresas de software como servico',    'Voce e gestor de uma startup SaaS com 50-200 clientes. Precisa de ferramentas para escalar vendas.'),
('Agencia Digital', 'Agencias de marketing e publicidade',  'Voce dirige uma agencia com 10-30 funcionarios. Busca automatizar processos e melhorar entrega.'),
('Consultoria',     'Empresas de consultoria empresarial',  'Voce lidera uma consultoria especializada. Quer expandir para novos mercados com eficiencia.'),
('Educacao Online', 'Infoprodutores e plataformas EAD',     'Voce tem cursos online com 1000+ alunos. Busca melhorar retencao e aumentar LTV.');

-- Client Profiles (4 perfis)
INSERT INTO client_profiles (name, display_name, objection_style, tone_params, whatsapp_style) VALUES
('soft',       'Cliente Receptivo',     'Faz poucas objecoes, e aberto a novas solucoes',    '{"warmth": 0.8, "patience": 0.9, "skepticism": 0.2}', true),
('hard',       'Cliente Desafiador',    'Questiona bastante, precisa de provas concretas',    '{"warmth": 0.4, "patience": 0.5, "skepticism": 0.7}', true),
('chato',      'Cliente Detalhista',    'Quer saber todos os detalhes, e meticuloso',         '{"warmth": 0.5, "patience": 0.3, "skepticism": 0.6}', true),
('ultra_hard', 'Cliente Muito Dificil', 'Altamente cetico, dificil de convencer',             '{"warmth": 0.2, "patience": 0.2, "skepticism": 0.9}', true);
```

---

## Resumo das Tabelas

| # | Tabela | Colunas | Finalidade |
|---|--------|---------|-----------|
| 1 | `users` | 9 | Usuarios e autenticacao (substitui auth.users) |
| 2 | `refresh_tokens` | 5 | Tokens de refresh JWT |
| 3 | `organizations` | 5 | Organizacoes multi-tenant |
| 4 | `profiles` | 15 | Perfil do usuario (nome, time, status) |
| 5 | `user_roles` | 4 | Role do usuario (admin/coach/vendedor/closer) |
| 6 | `leads_plataforma` | 11 | Leads pre-cadastro |
| 7 | `segments` | 6 | Segmentos de mercado para roleplay |
| 8 | `client_profiles` | 8 | Perfis de cliente simulado (soft/hard/etc) |
| 9 | `roleplays` | 13 | Sessoes de roleplay |
| 10 | `messages` | 7 | Mensagens do chat roleplay |
| 11 | `reports` | 14 | Avaliacoes de performance |
| 12 | `vouchers` | 9 | Vouchers ganhos |
| 13 | `prompt_templates` | 7 | Templates de prompt IA por org |
| 14 | `ninja_ranks` | 11 | Definicao dos 12 niveis ninja |
| 15 | `user_ninja_progress` | 11 | Progresso do usuario no sistema ninja |
| 16 | `user_streaks` | 6 | Streak de dias consecutivos |
| 17 | `user_goals` | 10 | Metas individuais |
| 18 | `prizes` | 10 | Catalogo de premios |
| 19 | `prize_redemptions` | 8 | Resgates de premios |
| 20 | `exported_reports` | 10 | Relatorios exportados |
| 21 | `performance_snapshots` | 14 | Snapshots diarios de performance |
| 22 | `audit_log` | 6 | Log de auditoria |
| 23 | `system_config` | 5 | Configuracoes chave-valor |
| 24 | `system_settings` | 4 | Config global (registro habilitado) |

---

## Ordem de execucao

Executar na ordem exata listada acima (enums primeiro, depois tabelas 1-24, depois seed). As foreign keys dependem da ordem.
