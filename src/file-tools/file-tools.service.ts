import { Injectable } from '@nestjs/common';
import { PDFDocument, degrees } from 'pdf-lib';
import sharp from 'sharp';
// archiver's type defs don't expose the callable factory; require the module.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver = require('archiver');

// A4 in PDF points.
const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 20;

@Injectable()
export class FileToolsService {
  /** Parse a page spec like "2, 5-7" into a sorted unique 1-based list. */
  parsePages(spec: string, max: number): number[] {
    const set = new Set<number>();
    for (const part of spec.split(',')) {
      const p = part.trim();
      if (!p) continue;
      const range = p.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        let a = parseInt(range[1], 10);
        let b = parseInt(range[2], 10);
        if (a > b) [a, b] = [b, a];
        for (let i = a; i <= b; i++) if (i >= 1 && i <= max) set.add(i);
      } else if (/^\d+$/.test(p)) {
        const n = parseInt(p, 10);
        if (n >= 1 && n <= max) set.add(n);
      }
    }
    return [...set].sort((a, b) => a - b);
  }

  async pdfPageCount(pdf: Buffer): Promise<number> {
    const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
    return doc.getPageCount();
  }

  /** Combine images into a single PDF (one image per A4 page, centered). */
  async imagesToPdf(images: Buffer[]): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    for (const img of images) {
      const jpgBuf = await sharp(img).rotate().jpeg({ quality: 85 }).toBuffer();
      const embedded = await pdf.embedJpg(jpgBuf);
      const page = pdf.addPage([A4.w, A4.h]);
      const scale = Math.min(
        (A4.w - MARGIN * 2) / embedded.width,
        (A4.h - MARGIN * 2) / embedded.height,
        1,
      );
      const w = embedded.width * scale;
      const h = embedded.height * scale;
      page.drawImage(embedded, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h });
    }
    return Buffer.from(await pdf.save());
  }

  async mergePdfs(pdfs: Buffer[]): Promise<Buffer> {
    const out = await PDFDocument.create();
    for (const p of pdfs) {
      const src = await PDFDocument.load(p, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((pg) => out.addPage(pg));
    }
    return Buffer.from(await out.save());
  }

  /** Keep only the given 1-based pages. */
  async extractPages(pdf: Buffer, pages: number[]): Promise<Buffer> {
    const src = await PDFDocument.load(pdf, { ignoreEncryption: true });
    const out = await PDFDocument.create();
    const indices = pages.map((p) => p - 1).filter((i) => i >= 0 && i < src.getPageCount());
    const copied = await out.copyPages(src, indices);
    copied.forEach((pg) => out.addPage(pg));
    return Buffer.from(await out.save());
  }

  /** Remove the given 1-based pages. */
  async deletePages(pdf: Buffer, pages: number[]): Promise<Buffer> {
    const src = await PDFDocument.load(pdf, { ignoreEncryption: true });
    const remove = new Set(pages);
    const keep: number[] = [];
    for (let i = 1; i <= src.getPageCount(); i++) if (!remove.has(i)) keep.push(i - 1);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, keep);
    copied.forEach((pg) => out.addPage(pg));
    return Buffer.from(await out.save());
  }

  /** Rotate every page by 90/180/270 degrees (added to current rotation). */
  async rotatePages(pdf: Buffer, deg: number): Promise<Buffer> {
    const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
    doc.getPages().forEach((pg) => {
      const cur = pg.getRotation().angle || 0;
      pg.setRotation(degrees((cur + deg) % 360));
    });
    return Buffer.from(await doc.save());
  }

  /** Resize + re-encode an image as a smaller JPG. */
  async compressImage(image: Buffer, maxWidth = 1600, quality = 70): Promise<Buffer> {
    return sharp(image)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  /** Render PDF pages -> nothing (kept out; needs poppler). */

  async zipFiles(files: { name: string; buffer: Buffer }[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];
      archive.on('data', (c: Buffer) => chunks.push(c));
      archive.on('error', reject);
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      files.forEach((f) => archive.append(f.buffer, { name: f.name }));
      void archive.finalize();
    });
  }
}
