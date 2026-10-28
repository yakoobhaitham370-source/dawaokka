import { expect,test } from '@playwright/test';

// UI-only synthetic Auth simulation. Every Supabase request is intercepted.
// Actual RLS is exercised in local PostgreSQL, not claimed from this mock.
for(const available of [true,false])test(`restricted staff UI ${available?'uses only assigned projection':'fails closed without security RPC'}`,async({page})=>{
 const userId='10000000-0000-4000-8000-000000000002',tenant='20000000-0000-4000-8000-000000000001';
 const apiCalls:string[]=[];
 await page.route('https://*.supabase.co/**',async route=>{
  const url=new URL(route.request().url());apiCalls.push(url.pathname);
  if(url.pathname==='/rest/v1/pharmacy_memberships')return route.fulfill({json:[{pharmacy_id:tenant,role:'staff'}]});
  if(url.pathname==='/rest/v1/platform_owners')return route.fulfill({json:null});
  if(url.pathname==='/rest/v1/rpc/staff_followup_queue')return available?
   route.fulfill({json:[{id:'synthetic-task',patientId:'synthetic-patient',patientName:'Synthetic Assigned Contact',phone:null,consent:false,preference:'none',dueDate:'2026-10-28',status:'scheduled'}]}):
   route.fulfill({status:404,json:{code:'PGRST202',message:'Synthetic missing proposal'}});
  return route.abort(); // Never forward an API request to the hosted project.
 });
 await page.addInitScript(({userId})=>{
  const encode=(v:unknown)=>btoa(JSON.stringify(v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const expires=Math.floor(Date.now()/1000)+3600;
  const token=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:userId,role:'authenticated',exp:expires})+'.synthetic-signature';
  localStorage.setItem('sb-abcdefghijklmnopqrst-auth-token',JSON.stringify({access_token:token,refresh_token:['synthetic','only'].join('-'),token_type:'bearer',expires_in:3600,expires_at:expires,user:{id:userId,email:'synthetic-staff@example.invalid',aud:'authenticated',role:'authenticated'}}));
 },{userId});
 await page.goto('/app/patients/synthetic-patient');
 await expect(page.getByRole('heading',{name:/Assigned follow-ups/})).toBeVisible();
 if(available){
  await expect(page.getByRole('heading',{name:'Synthetic Assigned Contact'})).toBeVisible();
  await expect(page.getByText(/No contact permission available/)).toBeVisible();
 }else await expect(page.getByRole('alert')).toContainText('Assigned follow-ups unavailable');
 await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('html')).toHaveAttribute('dir','rtl');
 expect(apiCalls.every(p=>['/rest/v1/pharmacy_memberships','/rest/v1/platform_owners','/rest/v1/rpc/staff_followup_queue'].includes(p))).toBe(true);
 expect(apiCalls).toContain('/rest/v1/rpc/staff_followup_queue');
});
