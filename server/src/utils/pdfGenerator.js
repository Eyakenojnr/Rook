import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from 'fs';
import path from "path";


/**
 * Generate an elegant landscape PDF certificate of completion.
 * @param {string} studentName - The full name of the student.
 * @param {string} courseTitle - The title of the completed course.
 * @param {string} certificateId - The unique databse verification ID.
 * @returns {Promise<string>} - The relative public file path of the saved PDF.
 */
export const generateCertificatePDF = async (studentName, courseTitle, certificateId) => {
    // Create a blank PDF in landscape orientation (Standard A4 dimensions: 842 x 595 points)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    // Load standard built-in fonts
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontTimesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

    // Draw a sophisticated background and decorative borders
    // Outer border => Navy Blue
    page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0.12, 0.23, 0.35),  // Navy Blue
        borderWidth: 5,
        color: rgb(0.98, 0.98, 0.98),  // gray background
    });

    // Inner Border (Gold/Bronze accent)
    page.drawRectangle({
        x: 30,
        y: 30,
        width: width - 60,
        height: height - 60,
        borderColor: rgb(0.72, 0.53, 0.04),  // bronze gold
        borderWidth: 2,
    });

    // Helper function to programmatically calculate and draw horizontally centered text.
    const drawCenteredText = (text, y, fontSize, font, color=rgb(0.12, 0.23, 0.35)) => {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const x = (width - textWidth) / 2;  // Center alignment maths
        page.drawText(text, { x, y, size: fontSize, font, color });
    };

    // Draw header titles
    drawCenteredText("CERTIFICATE OF COMPLETION", height - 100, 30, fontHelveticaBold, rgb(0.12, 0.23, 0.35));
    drawCenteredText("THIS IS PROUDLY PRESENTED TO", height - 145, 12, fontHelvetica, rgb(0.4, 0.4, 0.4));

    // Draw student's name (large, bold, and capitalized in gold)
    drawCenteredText(studentName.toUpperCase(), height - 225, 34, fontHelveticaBold, rgb(0.72, 0.53, 0.04));

    // Draw fulfillment text
    drawCenteredText('for successfully completing the curriculum and requirements of the course', height - 200, 12, fontHelvetica, rgb(0.4, 0.4, 0.4));

    // Draw Course Title (times bold italic)
    drawCenteredText(`"${courseTitle}"`, height - 340, 24, fontTimesBoldItalic, rgb(0.12, 0.23, 0.35));

    // Generate dynamic date stamp
    const currentDate = new Date().toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Draw date (left-aligned)
    page.drawText(`Date Issued: ${currentDate}`, {
        x: 60,
        y: 80,
        size: 10,
        font: fontHelvetica,
        color: rgb(0.3, 0.3, 0.3),
    });

    // Draw unique verification ID (right-aligned)
    const verificationText = `Certificate ID: ${certificateId}`;
    const verificationTextWidth = fontHelvetica.widthOfTextAtSize(verificationText, 10);
    page.drawText(verificationText, {
        x: width - 60 - verificationTextWidth,
        y: 80,
        size: 10,
        font: fontHelvetica,
        color: rgb(0.3, 0.3, 0.3),
    });

    // Compile and save the PDF bytes to local disk storage
    const pdfBytes = await pdfDoc.save();

    // Create "public/certificates" directory path
    const dirPath = path.resolve('public/certificates');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });  // Ensures directories are created recursively
    }

    const filePath = path.join(dirPath, `cert_${certificateId}.pdf`);
    fs.writeFileSync(filePath, pdfBytes);

    // Return public URI that is stored in the database
    return `/certificates/cert_${certificateId}.pdf`;
};