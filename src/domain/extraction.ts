// Optional, backend-only provider boundary. No provider is configured or called.
export interface ExtractionDraft { patientName:string; medications:{name:string;strength:string;dose:string;uncertain:boolean}[]; sourceDocumentId:string; reviewed:false; }
export interface PrescriptionExtractionProvider { extract(documentId:string):Promise<ExtractionDraft>; }
export const extractionAvailable=false;
export function requireHumanReview(draft:ExtractionDraft,confirmed:boolean){if(!confirmed)throw new Error('Pharmacist review is required before saving extracted clinical data');return {...draft,reviewed:true as const};}
