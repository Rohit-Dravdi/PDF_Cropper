export type Field = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'range';
  default?: string;
  options?: [string, string][];
};

export type Category = 'Organize' | 'Edit' | 'Convert';

export type Tool = {
  slug: string;
  name: string;
  icon: string;
  category: Category;
  short: string;
  accept: 'pdf' | 'image';
  multi?: boolean;
  min?: number;
  fields: Field[];
  about: string;
  steps: string[];
  faq: [string, string][];
};

const pages = (label = 'Pages (e.g. 1-3,5,8-)', d = ''): Field => ({ key: 'pages', label, type: 'text', default: d });

export const tools: Tool[] = [
  {
    slug: 'merge-pdf', name: 'Merge PDF', icon: '🔗', category: 'Organize', accept: 'pdf', multi: true, min: 2, fields: [],
    short: 'Combine several PDFs into one file.',
    about: 'Join contracts, scans, invoices or chapters into a single PDF. Add your files, put them in the order you want with the arrows, and download one merged document.',
    steps: ['Add two or more PDF files.', 'Use the arrows to set the order.', 'Select Merge PDF and download the result.'],
    faq: [['Is there a page limit?', 'No fixed limit. Very large files depend on your device memory because everything runs in your browser.']],
  },
  {
    slug: 'split-pdf', name: 'Split PDF', icon: '✂️', category: 'Organize', accept: 'pdf',
    fields: [
      { key: 'mode', label: 'Mode', type: 'select', options: [['range', 'Extract pages into one PDF'], ['each', 'Save every page as its own PDF (ZIP)']] },
      pages('Pages to extract (e.g. 1-3,5,8-)', '1'),
    ],
    short: 'Extract pages or split every page into its own file.',
    about: 'Pull out the pages you need, or break a document into single-page PDFs delivered as a ZIP.',
    steps: ['Add a PDF.', 'Choose a mode and enter page numbers.', 'Select Split PDF and download.'],
    faq: [['How do I write page ranges?', 'Use commas and dashes: 1-3,5,8- means pages 1 to 3, page 5, and page 8 to the end.']],
  },
  {
    slug: 'crop-pdf', name: 'Crop PDF', icon: '📐', category: 'Edit', accept: 'pdf',
    fields: [
      { key: 'top', label: 'Trim from top', type: 'range', default: '0' },
      { key: 'bottom', label: 'Trim from bottom', type: 'range', default: '0' },
      { key: 'left', label: 'Trim from left', type: 'range', default: '0' },
      { key: 'right', label: 'Trim from right', type: 'range', default: '0' },
    ],
    short: 'Trim margins from every page.',
    about: 'Remove white borders or unwanted edges from every page. The dashed box on the previews shows the area that will be kept.',
    steps: ['Add a PDF.', 'Drag the sliders until the dashed box frames the content.', 'Select Crop PDF and download.'],
    faq: [['Does cropping delete the hidden content?', 'It hides it by resizing the visible page area. Do not rely on cropping to redact sensitive data.']],
  },
  {
    slug: 'rotate-pdf', name: 'Rotate PDF', icon: '🔄', category: 'Organize', accept: 'pdf',
    fields: [
      { key: 'angle', label: 'Rotate clockwise by', type: 'select', options: [['90', '90°'], ['180', '180°'], ['270', '270°']] },
      pages('Pages (leave blank for all pages)'),
    ],
    short: 'Rotate all pages or only the ones you choose.',
    about: 'Fix sideways or upside-down scans. Rotate the whole document or only specific pages.',
    steps: ['Add a PDF.', 'Choose the angle and pages.', 'Select Rotate PDF and download.'],
    faq: [['Can I rotate just one page?', 'Yes. Type its number in the pages box, for example 4.']],
  },
  {
    slug: 'delete-pages', name: 'Delete Pages', icon: '🗑️', category: 'Organize', accept: 'pdf',
    fields: [pages('Pages to delete (e.g. 2,4-6)')],
    short: 'Remove unwanted pages from a PDF.',
    about: 'Use the page previews to spot the pages you do not need, then list their numbers and remove them in one step.',
    steps: ['Add a PDF.', 'Enter the page numbers to remove.', 'Select Delete Pages and download.'],
    faq: [['Can I undo a deletion?', 'Your original file is never changed. Only the downloaded copy has the pages removed.']],
  },
  {
    slug: 'add-pages', name: 'Add Pages', icon: '➕', category: 'Organize', accept: 'pdf', multi: true,
    fields: [
      { key: 'at', label: 'Insert after page (0 = at the start)', type: 'number', default: '1' },
      { key: 'cnt', label: 'Number of blank pages (used when no second PDF is added)', type: 'number', default: '1' },
    ],
    short: 'Insert blank pages or pages from another PDF.',
    about: 'Add blank pages, or add a second PDF and insert all of its pages at any position in your main document.',
    steps: ['Add your main PDF first.', 'Optionally add a second PDF to insert.', 'Choose the position and download.'],
    faq: [['Which file is the main document?', 'The first file in the list. Use the arrows to change the order.']],
  },
  {
    slug: 'reorder-pages', name: 'Reorder Pages', icon: '↕️', category: 'Organize', accept: 'pdf',
    fields: [pages('New page order (e.g. 3,1,2,4-6)')],
    short: 'Change the order of pages.',
    about: 'Type the order you want. Pages you list are kept in that order; pages you leave out are dropped, and a page can be repeated.',
    steps: ['Add a PDF.', 'Type the new order.', 'Select Reorder Pages and download.'],
    faq: [['What happens to pages I do not list?', 'They are left out of the new file.']],
  },
  {
    slug: 'page-numbers', name: 'Add Page Numbers', icon: '#️⃣', category: 'Edit', accept: 'pdf',
    fields: [
      { key: 'pos', label: 'Position', type: 'select', options: [['bc', 'Bottom centre'], ['br', 'Bottom right'], ['bl', 'Bottom left'], ['tc', 'Top centre'], ['tr', 'Top right']] },
      { key: 'start', label: 'First number', type: 'number', default: '1' },
      { key: 'size', label: 'Font size', type: 'number', default: '12' },
    ],
    short: 'Stamp page numbers on every page.',
    about: 'Number the pages of reports, theses or scanned documents. Choose the position, starting number and size.',
    steps: ['Add a PDF.', 'Pick position, start number and size.', 'Select Add Page Numbers and download.'],
    faq: [['Can numbering start at a different number?', 'Yes. Change the first number, for example to 5.']],
  },
  {
    slug: 'watermark-pdf', name: 'Watermark PDF', icon: '💧', category: 'Edit', accept: 'pdf',
    fields: [
      { key: 't', label: 'Watermark text', type: 'text', default: 'CONFIDENTIAL' },
      { key: 'size', label: 'Font size', type: 'number', default: '60' },
      { key: 'op', label: 'Opacity (0.05 to 1)', type: 'number', default: '0.25' },
    ],
    short: 'Add a diagonal text watermark to every page.',
    about: 'Mark drafts, confidential files or samples with a diagonal text watermark on every page.',
    steps: ['Add a PDF.', 'Type the watermark text and adjust size and opacity.', 'Select Watermark PDF and download.'],
    faq: [['Can the watermark be removed?', 'It is drawn onto the page, so it is hard to remove, but it is not a security feature.']],
  },
  {
    slug: 'edit-metadata', name: 'Edit PDF Metadata', icon: '🏷️', category: 'Edit', accept: 'pdf',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'keywords', label: 'Keywords (comma separated)', type: 'text' },
    ],
    short: 'Change the title, author, subject and keywords.',
    about: 'Set the document properties that appear in PDF viewers and search results. Empty fields are left unchanged.',
    steps: ['Add a PDF.', 'Fill in the fields you want to change.', 'Select Edit PDF Metadata and download.'],
    faq: [['Which fields are changed?', 'Only the fields you fill in.']],
  },
  {
    slug: 'images-to-pdf', name: 'Images to PDF', icon: '🖼️', category: 'Convert', accept: 'image', multi: true, fields: [],
    short: 'Turn JPG and PNG images into a PDF.',
    about: 'Combine photos or scans into a PDF with one image per page. Each page matches its image size.',
    steps: ['Add JPG or PNG images.', 'Order them with the arrows.', 'Select Images to PDF and download.'],
    faq: [['Which formats work?', 'JPG and PNG.']],
  },
  {
    slug: 'pdf-to-images', name: 'PDF to Images', icon: '📷', category: 'Convert', accept: 'pdf',
    fields: [{ key: 'scale', label: 'Quality', type: 'select', options: [['1.5', 'Standard'], ['2.5', 'High']] }],
    short: 'Save each page as a PNG image (ZIP).',
    about: 'Convert every page into a PNG image and download them together as a ZIP file.',
    steps: ['Add a PDF.', 'Choose the quality.', 'Select PDF to Images and download the ZIP.'],
    faq: [['Why is High quality slower?', 'Pages are drawn at a larger size, which needs more time and memory.']],
  },
];

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
export const categories: Category[] = ['Organize', 'Edit', 'Convert'];
export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'PDFKit',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@example.com',
};
