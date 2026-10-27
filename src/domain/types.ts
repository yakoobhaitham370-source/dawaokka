export type Role = 'owner'|'pharmacist'|'staff'|'platform_admin';
export type AllergyStatus = 'unknown'|'none_known'|'suspected'|'confirmed'|'intolerance';
export type Severity = 'critical'|'moderate'|'informational';
export type ReviewStatus = 'new'|'pending'|'reviewed'|'resolved';
export interface Patient { id:string; name:string; phone:string; whatsapp:string; dob:string; gender:string; address:string; conditions:string[]; physician:string; notes:string; consent:boolean; preference:'call'|'whatsapp'|'none'; status:'active'|'inactive'|'archived'; allergyStatus:AllergyStatus; createdAt:string; updatedAt:string; }
export interface CatalogMedication { id:string; name:string; generic:string; brand:string; ingredient:string; strength:string; form:string; route:string; drugClass:string; }
export interface Medication { id:string; patientId:string; catalogId:string; dose:number; frequency:number; schedule:'regular'|'prn'|'variable'|'taper'|'custom'; customSchedule:string; timing:string; instructions:string; quantity:number; daysSupply:number|null; startDate:string; refillDate:string|null; physician:string; price:number; status:'active'|'paused'|'stopped'; notes:string; }
export interface Allergy { id:string; patientId:string; substance:string; ingredient:string; drugClass:string; reaction:string; category:string; severity:Severity; status:'suspected'|'confirmed'|'intolerance'; reactionDate:string; recordedAt:string; recordedBy:string; source:string; verification:'unverified'|'verified'; notes:string; }
export interface AllergyAlert { id:string; patientId:string; allergyId:string; medicationId:string|null; category:string; severity:Severity; status:ReviewStatus; assignedTo:string; createdAt:string; }
export interface Review { id:string; alertId:string; action:ReviewStatus; notes:string; assignedTo:string; by:string; createdAt:string; }
export interface Dispensing { id:string; patientId:string; medicationId:string; quantity:number; dose:number; frequency:number; schedule:Medication['schedule']; timing:string; daysSupply:number|null; date:string; refillDate:string|null; price:number; alerts:string[]; acknowledged:boolean; overrideReason:string; staff:string; createdAt:string; }
export interface Adjustment { id:string; dispensingId:string; reason:string; quantity:number; createdAt:string; by:string; }
export interface Conversation { id:string; patientId:string; category:string; status:'open'|'closed'; assignedTo:string; notes:string; outcome:string; createdAt:string; }
export interface Message { id:string; conversationId:string; body:string; sender:'pharmacist'|'patient'; createdAt:string; }
export interface Followup { id:string; patientId:string; dueDate:string; assignedTo:string; status:'scheduled'|'no_answer'|'contacted'|'refilled'|'rescheduled'|'declined'; notes:string; createdAt:string; }
export interface ContactAttempt { id:string; followupId:string; outcome:Followup['status']; notes:string; createdAt:string; by:string; }
export interface Lab { id:string; patientId:string; test:string; value:string; unit:string; range:string; date:string; notes:string; createdAt:string; }
export interface PatientDocument { id:string; patientId:string; name:string; path:string; size:number; mime:string; createdAt:string; }
export interface Audit { id:string; patientId:string|null; action:string; detail:string; by:string; createdAt:string; }
export interface Settings { name:string; thresholds:number[]; retentionDays:number; }
export interface AppData { patients:Patient[]; catalog:CatalogMedication[]; medications:Medication[]; allergies:Allergy[]; alerts:AllergyAlert[]; reviews:Review[]; dispensings:Dispensing[]; adjustments:Adjustment[]; conversations:Conversation[]; messages:Message[]; followups:Followup[]; attempts:ContactAttempt[]; labs:Lab[]; documents:PatientDocument[]; audit:Audit[]; settings:Settings; }
export interface Context { role:Role; name:string; pharmacyId:string; }
export type Command =
 | {type:'savePatient'; patient:Patient; duplicateAcknowledged?:boolean}
 | {type:'saveMedication'; medication:Medication}
 | {type:'saveAllergy'; allergy:Allergy}
 | {type:'setAllergyStatus'; patientId:string; status:'unknown'|'none_known'; reason:string}
 | {type:'reviewAlert'; review:Review}
 | {type:'dispense'; dispensing:Dispensing}
 | {type:'adjustDispensing'; adjustment:Adjustment}
 | {type:'saveConversation'; conversation:Conversation}
 | {type:'sendMessage'; message:Message}
 | {type:'saveFollowup'; followup:Followup}
 | {type:'logContact'; attempt:ContactAttempt; nextDate?:string}
 | {type:'saveLab'; lab:Lab}
 | {type:'saveDocument'; document:PatientDocument}
 | {type:'saveSettings'; settings:Settings};
