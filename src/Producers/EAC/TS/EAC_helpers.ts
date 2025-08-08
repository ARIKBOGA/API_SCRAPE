import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import * as path from "path";
import * as fs from "fs";

export function createDocxDocument(...values: string[]) {
    const sections = values.map((value) => ({
        children: [
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [new TextRun({
                    text: value,        // Enter the text
                    size: 12,           // Enter dobled of the required font size (size = 22 for 11pt)
                    font: "Times New Roman",    // Enter the name of the required font
                    color: "000000",    // Enter the hex color code
                })],
            }),
        ],
    }));

    return new Document({
        sections,
    });
}

export function writeToWord(documents: {document: Document; filename: string;}[]) {
    documents.forEach((doc) => {
        const outputPath = path.resolve(__dirname, `../data/documents/docx/${doc.filename}.docx`);
        Packer.toBuffer(doc.document).then((buffer) => {
            fs.writeFileSync(outputPath, buffer);
        });
    })
}
