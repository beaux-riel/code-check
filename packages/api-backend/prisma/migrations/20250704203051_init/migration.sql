-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "repositoryUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "enabledPlugins" TEXT,
    "rulesets" TEXT,
    "configuration" TEXT,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "infoCount" INTEGER NOT NULL DEFAULT 0,
    "memoryUsage" REAL,
    "cpuUsage" REAL,
    CONSTRAINT "audits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "language" TEXT,
    "linesOfCode" INTEGER NOT NULL DEFAULT 0,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "infoCount" INTEGER NOT NULL DEFAULT 0,
    "complexityScore" REAL,
    "maintainabilityIndex" REAL,
    CONSTRAINT "audit_files_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "fileId" TEXT,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rule" TEXT,
    "category" TEXT,
    "filePath" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "endLine" INTEGER,
    "endColumn" INTEGER,
    "fixable" BOOLEAN NOT NULL DEFAULT false,
    "suggestions" TEXT,
    "codeSnippet" TEXT,
    "cwe" TEXT,
    "cvss" REAL,
    CONSTRAINT "issues_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "issues_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "audit_files" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "metadata" TEXT
);
