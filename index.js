const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const multerMemoryStorage = multer.memoryStorage();
const upload = multer({ storage: multerMemoryStorage });

const app = express();
app.use(cors());


const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Endpoint to handle FormData with attachments
app.post("/", upload.any(), async (req, res) => {
    try {
        // Parse the JSON part of FormData
        const emailData = JSON.parse(req.body.emailData);
        console.log("Email Data:", emailData);

        // Parse the attachments
        const attachments = req.files.map((file) => ({
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            content: file.buffer, // This is the actual file content
        }));

        attachments.forEach((attachment) => {
            const filePath = `./uploads/${attachment.filename}`;
            fs.writeFileSync(filePath, attachment.content);
        });

        console.log("Attachments:", attachments);

        // Respond with success, sending back the attachments
        const response = {
            message: `API Response: ${emailData.body}`,
            attachments: attachments.map(({ filename, mimeType, size }) => ({
                filename,
                mimeType,
                size,
            })),
        };
        
        // Set up response headers for binary data
        res.status(200)
            .contentType("application/json")
            .send({
                data: response,
                attachments: attachments.map(({ content, ...rest }) => ({
                    ...rest,
                    content: content.toString("base64"), // Send attachment as Base64 for compatibility
                })),
            });
    } catch (error) {
        console.error("Error processing form data:", error.message);
        res.status(500).send({ error: "Failed to process the request." });
    }
});

app.listen(8080, () => {
    console.log("Server is running on http://localhost:8080");
});
