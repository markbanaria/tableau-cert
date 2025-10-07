declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    html?: string | HTMLElement;
    columns?: any[];
    columnStyles?: any;
    styles?: any;
    bodyStyles?: any;
    headStyles?: any;
    footStyles?: any;
    alternateRowStyles?: any;
    margin?: any;
    theme?: 'striped' | 'grid' | 'plain';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineWidth?: number;
    tableLineColor?: any;
    didDrawPage?: (data: any) => void;
    didDrawCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didParseCell?: (data: any) => void;
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}