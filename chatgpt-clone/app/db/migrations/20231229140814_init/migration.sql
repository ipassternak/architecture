-- CreateEnum
CREATE TYPE "message_role" AS ENUM ('system', 'user', 'assistant');

-- CreateTable
CREATE TABLE "account" (
    "id" SERIAL NOT NULL,
    "login" VARCHAR(50) NOT NULL,
    "password" VARCHAR(1000) NOT NULL,
    "email" VARCHAR(50),
    "phone" VARCHAR(25),
    "name" VARCHAR(25),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "data" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id" UUID NOT NULL,
    "account_id" INTEGER NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" SERIAL NOT NULL,
    "chat_id" UUID NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "role" "message_role" NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_login_key" ON "account"("login");

-- CreateIndex
CREATE UNIQUE INDEX "account_email_key" ON "account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "account_phone_key" ON "account"("phone");

-- CreateIndex
CREATE INDEX "session_expires_idx" ON "session"("expires");

-- CreateIndex
CREATE INDEX "chat_account_id_idx" ON "chat"("account_id");

-- CreateIndex
CREATE INDEX "message_chat_id_idx" ON "message"("chat_id");

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
