// A standalone regression against the same real PostgreSQL fixture as database.mjs.
// Run by database.mjs after its core workflow assertions.
export async function checkPayloadValidation({cmd,check,ids,patient,medication,allergy,dispensing,alert}) {
 const reject=async(command,label)=>{const result=await cmd(command);check(!result.ok,label);};
 for(const field of ['severity','status','verification','reaction','substance']) {
  await reject({type:'saveAllergy',allergy:{...allergy,id:crypto.randomUUID(),[field]:null}},`Null allergy ${field} rejected`);
 }
 await reject({type:'reviewAlert',review:{id:crypto.randomUUID(),alertId:alert,action:'resolved',assignedTo:'Test',notes:null}},'Null review evidence rejected');
 await reject({type:'setAllergyStatus',patientId:ids.p2,status:'unknown',reason:null},'Null history-review source rejected');
 for(const patch of [{schedule:null},{frequency:null},{frequency:1.5},{dose:'1'},{daysSupply:1.5},{startDate:'2026-02-30'}]) {
  await reject({type:'saveMedication',medication:{...medication,...patch}},`Invalid medication ${JSON.stringify(patch)} rejected`);
 }
 for(const patch of [{dose:null},{frequency:null},{schedule:null},{acknowledged:'true'},{daysSupply:1.5},{date:'2026-02-30'}]) {
  await reject({type:'dispense',dispensing:{...dispensing,id:crypto.randomUUID(),overrideReason:'Synthetic exceptional review documented',...patch}},`Invalid dispensing ${JSON.stringify(patch)} rejected`);
 }
 await reject({type:'savePatient',patient:{...patient(ids.p,'Synthetic Patient A','+9647701111111'),allergyStatus:'confirmed',consent:'false'}},'String consent rejected');
 const lab={id:crypto.randomUUID(),patientId:ids.p,test:'Synthetic measurement',value:'10',unit:'test',range:'',date:'2026-10-01',notes:'Synthetic',createdAt:new Date().toISOString()};
 await reject({type:'saveLab',lab:{...lab,date:'2026-02-30'}},'Impossible laboratory date rejected');
 let result=await cmd({type:'saveLab',lab});check(result.ok,'Valid laboratory result saved');
 result=await cmd({type:'saveLab',lab:{...lab,value:'11'}});check(result.ok,'Laboratory result editing accepted');
 const followup={id:crypto.randomUUID(),patientId:ids.p,dueDate:'2026-10-28',assignedTo:'Test owner',status:'scheduled',notes:'Synthetic',createdAt:new Date().toISOString()};
 await reject({type:'saveFollowup',followup:{...followup,dueDate:'tomorrow'}},'Invalid follow-up date rejected');
 result=await cmd({type:'saveFollowup',followup});check(result.ok,'Valid follow-up saved');
 await reject({type:'logContact',attempt:{id:crypto.randomUUID(),followupId:followup.id,outcome:'rescheduled',notes:''},nextDate:'2026-02-30'},'Impossible reschedule date rejected');
 await reject({type:'saveConversation',conversation:{id:crypto.randomUUID(),patientId:ids.p,category:'Synthetic',status:null,assignedTo:'Test'}},'Null consultation status rejected');
 await reject({type:'saveSettings',settings:{name:'Synthetic pharmacy',thresholds:[1.5],retentionDays:365}},'Fractional refill threshold rejected');
}
