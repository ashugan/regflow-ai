import express from "express";
import cors from "cors";
import { db, initializeDatabase } from "./db.js";
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import multer from "multer";

// OpenAI client used for AI-powered regulatory review generation.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(cors());
app.use(express.json());

// Multer middleware handles multipart/form-data uploads for request documents.
const upload = multer({
    dest: "uploads/",
});

// Generates a structured AI compliance/regulatory review using OpenAI.
// Fallback responses are returned if AI generation fails.
async function generateAIReview(title: string, risk: string) {
    try {
        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: `
Return ONLY valid JSON. No markdown.

Create an AI regulatory review for:
Title: ${title}
Risk: ${risk}

Use this exact JSON shape:
{
  "executiveSummary": "brief summary",
  "riskAssessment": "brief risk assessment",
  "missingInformation": ["item 1", "item 2"],
  "recommendedActions": ["action 1", "action 2"]
}
`,
        });

        console.log("AI raw response:", response.output_text);

        const cleanedText = response.output_text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(cleanedText);
    } catch (err) {
        console.error("AI review failed:", err);

        return {
            executiveSummary: `${title} has been submitted for regulatory review.`,
            riskAssessment: `${risk} risk request requiring compliance review.`,
            missingInformation: [
                "Validation protocol attachment missing",
                "QA approval not included",
            ],
            recommendedActions: [
                "Perform compliance review",
                "Notify validation team",
                "Schedule approval meeting",
            ],
        };
    }
}

// Simple health-check endpoint used to verify backend availability.
app.get("/", (req, res) => {
    res.send("Backend is running");
});

// Returns all workflow requests ordered by newest first.
app.get("/requests", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM requests ORDER BY id DESC"
        );

        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Creates a new workflow request, generates AI review content,
// persists request state, and records audit history.
app.post("/requests", async (req, res) => {
    try {
        const { title, risk } = req.body;

        const aiReview = await generateAIReview(title, risk);
        const aiReviewJson = JSON.stringify(aiReview);

        const requestResult = await db.query(
            `
            INSERT INTO requests (title, status, risk, ai_review)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [title, "Submitted", risk, aiReviewJson]
        );

        const newRequest = requestResult.rows[0];

        await db.query(
            `
            INSERT INTO audit_logs (request_id, action)
            VALUES ($1, $2)
            `,
            [
                newRequest.id,
                `Request submitted and AI review generated: ${title}`,
            ]
        );

        res.status(201).json(newRequest);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Returns global audit history across all workflow requests.
app.get("/audit-logs", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM audit_logs ORDER BY timestamp DESC"
        );

        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Updates workflow status and records status transition events
// for compliance/audit visibility.
app.patch("/requests/:id/status", async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status } = req.body;

        await db.query(
            `
            UPDATE requests
            SET status = $1
            WHERE id = $2
            `,
            [status, requestId]
        );

        await db.query(
            `
            INSERT INTO audit_logs (request_id, action)
            VALUES ($1, $2)
            `,
            [requestId, `Status updated to: ${status}`]
        );

        res.json({
            id: Number(requestId),
            status,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Returns request-specific activity history for workflow traceability.
app.get("/requests/:id/audit-logs", async (req, res) => {
    try {
        const requestId = req.params.id;

        const result = await db.query(
            `
            SELECT * FROM audit_logs
            WHERE request_id = $1
            ORDER BY timestamp DESC
            `,
            [requestId]
        );

        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Administrative utility endpoint used during development/testing
// to clear workflow and audit data.
app.delete("/requests", async (req, res) => {
    try {
        await db.query("DELETE FROM documents");
        await db.query("DELETE FROM audit_logs");
        await db.query("DELETE FROM requests");

        res.json({
            message: "All requests and audit logs deleted",
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Uploads supporting documentation and associates it with a workflow request.
app.post(
    "/requests/:id/documents",
    upload.single("document"),
    async (req, res) => {
        try {
            const requestId = req.params.id;

            if (!req.file) {
                res.status(400).json({
                    error: "No file uploaded",
                });
                return;
            }

            const result = await db.query(
                `
                INSERT INTO documents
                (request_id, filename, original_name, mime_type)
                VALUES ($1, $2, $3, $4)
                RETURNING *
                `,
                [
                    requestId,
                    req.file.filename,
                    req.file.originalname,
                    req.file.mimetype,
                ]
            );

            await db.query(
                `
                INSERT INTO audit_logs (request_id, action)
                VALUES ($1, $2)
                `,
                [
                    requestId,
                    `Document uploaded: ${req.file.originalname}`,
                ]
            );

            res.status(201).json(result.rows[0]);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);

// Streams uploaded documents back to the client for download access.
app.get("/documents/:id/download", async (req, res) => {
    try {
        const documentId = req.params.id;

        const result = await db.query(
            `
            SELECT * FROM documents
            WHERE id = $1
            `,
            [documentId]
        );

        const row = result.rows[0];

        if (!row) {
            res.status(404).json({
                error: "Document not found",
            });
            return;
        }

        res.download(
            `uploads/${row.filename}`,
            row.original_name
        );
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/requests/:id/documents", async (req, res) => {
    try {
        const requestId = req.params.id;

        const result = await db.query(
            `
      SELECT * FROM documents
      WHERE request_id = $1
      ORDER BY uploaded_at DESC
      `,
            [requestId]
        );

        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Deletes document metadata and records deletion activity in audit history.
app.delete("/documents/:id", async (req, res) => {
    try {
        const documentId = req.params.id;

        const documentResult = await db.query(
            `
            SELECT * FROM documents
            WHERE id = $1
            `,
            [documentId]
        );

        const document = documentResult.rows[0];

        if (!document) {
            res.status(404).json({
                error: "Document not found",
            });
            return;
        }

        await db.query(
            `
            DELETE FROM documents
            WHERE id = $1
            `,
            [documentId]
        );

        await db.query(
            `
            INSERT INTO audit_logs (request_id, action)
            VALUES ($1, $2)
            `,
            [
                document.request_id,
                `Document deleted: ${document.original_name}`,
            ]
        );

        res.json({
            message: "Document deleted",
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});