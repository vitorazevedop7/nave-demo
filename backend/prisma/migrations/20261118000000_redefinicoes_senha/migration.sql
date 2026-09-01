BEGIN;

ALTER TABLE "public"."usuarios"
ADD COLUMN "versao_token" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "public"."redefinicoes_senha" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expira_em" TIMESTAMP(6) NOT NULL,
    "usado_em" TIMESTAMP(6),
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redefinicoes_senha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redefinicoes_senha_token_hash_key"
ON "public"."redefinicoes_senha"("token_hash");

CREATE INDEX "redefinicoes_senha_usuario_id_idx"
ON "public"."redefinicoes_senha"("usuario_id");

CREATE INDEX "redefinicoes_senha_expira_em_idx"
ON "public"."redefinicoes_senha"("expira_em");

ALTER TABLE "public"."redefinicoes_senha"
ADD CONSTRAINT "redefinicoes_senha_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "public"."redefinicoes_senha" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."redefinicoes_senha" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "public"."redefinicoes_senha" FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "public"."redefinicoes_senha" FROM authenticated;
  END IF;
END
$$;

COMMIT;
