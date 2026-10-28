import { describe,expect,it,vi } from 'vitest';
import { createLiveRepository,supabase } from '../src/data/repository';
import type { Command,Context } from '../src/domain/types';

const ctx:Context={pharmacyId:'synthetic-tenant',role:'owner',name:'Test'};
const command:Command={type:'deleteDocument',documentId:'synthetic-document'};
type Client=NonNullable<typeof supabase>;
const client=(value:unknown)=>value as Client;

describe('live repository failure boundaries',()=>{
 it('fails closed when configuration is absent',()=>{
  expect(()=>createLiveRepository(ctx.pharmacyId,null)).toThrow(/not configured/);
 });
 it('rejects a failed network mutation without returning success',async()=>{
  const rpc=vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(createLiveRepository(ctx.pharmacyId,client({rpc})).execute(command,ctx)).rejects.toThrow('Failed to fetch');
  expect(rpc).toHaveBeenCalledExactlyOnceWith('execute_command',{p_pharmacy:ctx.pharmacyId,p_command:command});
 });
 it.each([
  {data:null,error:{message:'JWT expired'}},
  {data:{ok:false,error:'Not authorized for this active pharmacy'},error:null},
  {data:null,error:null},
 ])('rejects authentication or server refusal: %j',async result=>{
  const rpc=vi.fn().mockResolvedValue(result);
  await expect(createLiveRepository(ctx.pharmacyId,client({rpc})).execute(command,ctx)).rejects.toThrow();
 });
 it('does not substitute demo records after a read failure',async()=>{
  const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),range:vi.fn().mockResolvedValue({data:null,error:{message:'Network unavailable'}})};
  const from=vi.fn(()=>query);
  await expect(createLiveRepository(ctx.pharmacyId,client({from})).load()).rejects.toThrow(/Unable to load records/);
  expect(query.eq).toHaveBeenCalledWith('pharmacy_id',ctx.pharmacyId);
 });
 it('loads every page and rejects partial results if a later page fails',async()=>{
  const offsets:number[]=[];
  const from=vi.fn((table:string)=>{
   const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),range:vi.fn(async(offset:number)=>{
    if(table!=='patients')return {data:[],error:null};
    offsets.push(offset);
    return offset===0?{data:Array.from({length:200},(_,id)=>({data:{id}})),error:null}:{data:null,error:{message:'Connection interrupted'}};
   })};
   return query;
  });
  await expect(createLiveRepository(ctx.pharmacyId,client({from})).load()).rejects.toThrow(/Unable to load records/);
  expect(offsets).toEqual([0,200]);
 });
 it('rejects a pharmacy access failure after resource reads succeed',async()=>{
  const from=vi.fn(()=>({select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),range:vi.fn().mockResolvedValue({data:[],error:null}),single:vi.fn().mockResolvedValue({data:null,error:{message:'Membership revoked'}})}));
  await expect(createLiveRepository(ctx.pharmacyId,client({from})).load()).rejects.toThrow(/Pharmacy unavailable/);
 });
});
