import express from "express";
import cors from "cors";
import { db } from "./db.js";
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
app.get("/requests", (req, res) => {
    db.all("SELECT * FROM requests ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json(rows);
    });
});

// Creates a new workflow request, generates AI review content,
// persists request state, and records audit history.
app.post("/requests", async (req, res) => {
    const { title, risk } = req.body;

    const aiReview = await generateAIReview(title, risk);
    const aiReviewJson = JSON.stringify(aiReview);

    db.run(
        "INSERT INTO requests (title, status, risk, ai_review) VALUES (?, ?, ?, ?)",
        [title, "Submitted", risk, aiReviewJson],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const requestId = this.lastID;

            db.run(
                "INSERT INTO audit_logs (request_id, action) VALUES (?, ?)",
                [requestId, `Request submitted and AI review generated: ${title}`],
                (auditErr) => {
                    if (auditErr) {
                        res.status(500).json({ error: auditErr.message });
                        return;
                    }

                    res.status(201).json({
                        id: requestId,
                        title,
                        status: "Submitted",
                        risk,
                        ai_review: aiReviewJson,
                    });
                }
            );
        }
    );
});

// Returns global audit history across all workflow requests.
app.get("/audit-logs", (req, res) => {
    db.all("SELECT * FROM audit_logs ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json(rows);
    });
});

app.post("/ai-review", (req, res) => {
    const { title, risk } = req.body;

    const review = generateAIReview(title, risk);

    res.json(review);
});

// Updates workflow status and records status transition events
// for compliance/audit visibility.
app.patch("/requests/:id/status", (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;

    db.run(
        "UPDATE requests SET status = ? WHERE id = ?",
        [status, requestId],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            db.run(
                "INSERT INTO audit_logs (request_id, action) VALUES (?, ?)",
                [requestId, `Status updated to: ${status}`],
                (auditErr) => {
                    if (auditErr) {
                        res.status(500).json({ error: auditErr.message });
                        return;
                    }

                    res.json({
                        id: Number(requestId),
                        status,
                    });
                }
            );
        }
    );
});

// Returns request-specific activity history for workflow traceability.
app.get("/requests/:id/audit-logs", (req, res) => {
    const requestId = req.params.id;

    db.all(
        "SELECT * FROM audit_logs WHERE request_id = ? ORDER BY timestamp DESC",
        [requestId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            res.json(rows);
        }
    );
});

// Administrative utility endpoint used during development/testing
// to clear workflow and audit data.
app.delete("/requests", (req, res) => {
    db.run("DELETE FROM requests", [], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        db.run("DELETE FROM audit_logs", [], (auditErr) => {
            if (auditErr) {
                res.status(500).json({ error: auditErr.message });
                return;
            }

            res.json({
                message: "All requests and audit logs deleted",
            });
        });
    });
});

// Uploads supporting documentation and associates it with a workflow request.
app.post("/requests/:id/documents", upload.single("document"), (req, res) => {
    const requestId = req.params.id;

    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }

    db.run(
        `
      INSERT INTO documents (request_id, filename, original_name, mime_type)
      VALUES (?, ?, ?, ?)
    `,
        [requestId, req.file.filename, req.file.originalname, req.file.mimetype],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            db.run(
                "INSERT INTO audit_logs (request_id, action) VALUES (?, ?)",
                [requestId, `Document uploaded: ${req.file?.originalname}`]
            );

            res.status(201).json({
                id: this.lastID,
                request_id: Number(requestId),
                filename: req.file?.filename,
                original_name: req.file?.originalname,
                mime_type: req.file?.mimetype,
            });
        }
    );
});

app.get("/requests/:id/documents", (req, res) => {
    const requestId = req.params.id;

    db.all(
        "SELECT * FROM documents WHERE request_id = ? ORDER BY uploaded_at DESC",
        [requestId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            res.json(rows);
        }
    );
});

// Streams uploaded documents back to the client for download access.
app.get("/documents/:id/download", (req, res) => {
    const documentId = req.params.id;

    db.get(
        "SELECT * FROM documents WHERE id = ?",
        [documentId],
        (err, row: any) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (!row) {
                res.status(404).json({ error: "Document not found" });
                return;
            }

            res.download(`uploads/${row.filename}`, row.original_name);
        }
    );
});

// Deletes document metadata and records deletion activity in audit history.
app.delete("/documents/:id", (req, res) => {
    const documentId = req.params.id;

    db.get(
        "SELECT * FROM documents WHERE id = ?",
        [documentId],
        (err, row: any) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (!row) {
                res.status(404).json({ error: "Document not found" });
                return;
            }

            db.run(
                "DELETE FROM documents WHERE id = ?",
                [documentId],
                (deleteErr) => {
                    if (deleteErr) {
                        res.status(500).json({ error: deleteErr.message });
                        return;
                    }

                    db.run(
                        "INSERT INTO audit_logs (request_id, action) VALUES (?, ?)",
                        [
                            row.request_id,
                            `Document deleted: ${row.original_name}`,
                        ]
                    );

                    res.json({
                        message: "Document deleted",
                    });
                }
            );
        }
    );
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});