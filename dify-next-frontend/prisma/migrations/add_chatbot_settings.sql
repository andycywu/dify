-- CreateTable
CREATE TABLE IF NOT EXISTS "chatbot_settings" (
    "id" SERIAL NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "apiKey" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "chatbot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_settings_department_key" ON "chatbot_settings"("department");
